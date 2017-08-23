'use strict';

// TODO add a getClassifier which accepts an id

const {promisify} = require('util');
const {commaLists} = require('common-tags');
const VisualRecognition = require('watson-developer-cloud/visual-recognition/v3');
const _ = require('lodash/fp');
const {createReadStream} = require('fs');
const log = require('./log');
const {Observable} = require('rxjs');
const {envValue} = require('./util');

let viz;
Object.defineProperty(exports, 'viz', {
  get () {
    if (viz) {
      return viz;
    }

    viz = new VisualRecognition({
      api_key: envValue('apiKey'),
      version_date: VisualRecognition.VERSION_DATE_2016_05_20
    });
    viz.listClassifiersAsync = promisify(viz.listClassifiers);
    viz.createClassifierAsync = promisify(viz.createClassifier);
    viz.retrainClassifierAsync = promisify(viz.retrainClassifier);
    viz.classifyAsync = promisify(viz.classify);
    return viz;
  }
});

const notFoundError = name => {
  log.error('watson', `required classifier "${name}" not found`);
  throw new Error(`required classifier "${name}" not found`);
};

exports.findClassifier = async (name, opts = {}) => {
  log.debug('watson', `finding classifier "${name}"`);
  const viz = exports.viz;
  const {classifiers} = await viz.listClassifiersAsync(opts);

  // prefer id
  let classifier = _.find({classifier_id: name}, classifiers);
  if (classifier) {
    log.ok('watson', `found classifier "${name}" (name: ${classifier.name})`);
  } else {
    classifier = _.filter({name}, classifiers);
    if (classifier.length > 1) {
      log.warn('watson',
        commaLists`multiple classifiers found with name "${name}": ${classifier}`);
      return;
    }
    if (classifier.length) {
      classifier = _.first(classifier);
      log.ok('watson',
        `found classifier "${name}" (id: ${classifier.classifier_id})`);
    } else {
      log.warn('watson', `no classifier with name/id "${name}"`);
    }
  }

  if (classifier && opts.ready && classifier.status !== 'ready') {
    log.warn('watson',
      `classifier ${name} is not ready (${classifier.status})`);
    return;
  }

  return classifier;
};

exports.trainClassifier = async (name, classes, opts = {}) => {
  log.debug('watson', `training classifier ${name}`);
  let classifier = await exports.findClassifier(name, opts);

  const createStreams = _.mapValues(filepath => createReadStream(filepath));

  if (!classifier) {
    if (opts.create) {
      log.warn('watson', `creating classifier "${name}"`);
      classifier =
        await viz.createClassifierAsync(_.assign({name},
          createStreams(classes)));
      log.ok('watson',
        `created & queued classifier "${name}" (${classifier.classifier_id}) for training`);
      return classifier;
    }
    notFoundError(name);
  }
  if (opts.retrain) {
    log.info('watson', `attempting to retrain existing classifier "${name}"`);
    const params = _.assign({name}, createStreams(classes));
    classifier = await viz.retrainClassifierAsync(params);
    log.ok('watson',
      `queued classifier "${name}" (${classifier.classifier_id}) for retraining`);
    return classifier;
  }
  log.warn('watson', `classifier "${name}" exists, but "retrain" option unset`);
};

/**
 * Upserts a classifier
 */
exports.upsertClassifier = (name, classes, opts = {}) => {
  return Observable.fromPromise(exports.trainClassifier(name,
    classes,
    _.defaults({
      create: true
    }, opts)));
};

exports.classifyOne = async (id, img, opts = {}) => {
  log.debug('watson', {
    images_file: img,
    classifier_ids: [id],
    owners: ['me']
  });
  const result = await viz.classifyAsync({
    images_file: img,
    classifier_ids: [id]
  });
  return result.images;
};
