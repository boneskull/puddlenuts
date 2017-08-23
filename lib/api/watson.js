import {commaLists} from 'common-tags';
import VisualRecognition from 'watson-developer-cloud/visual-recognition/v3';
import _ from 'lodash/fp';
import {createReadStream} from 'fs';
import {log} from '../log';
import promwrap from 'promwrap';

// TODO add a getClassifier which accepts an id
export class Watson {
  constructor(
    apiKey,
    watsonVersion = VisualRecognition.VERSION_DATE_2016_05_20
  ) {
    this._viz = promwrap(
      new VisualRecognition({
        api_key: apiKey,
        version_date: watsonVersion
      })
    );
  }

  static notFoundError(name) {
    throw new Error(`required classifier "${name}" not found`);
  }

  async findClassifier(name, opts = {}) {
    const logCat = 'watson:Watson#findClassifier()';

    log.debug(logCat, `finding classifier "${name}"`);
    const viz = this._viz;
    const {classifiers} = await viz.listClassifiers(opts);

    // prefer id
    let classifier = _.find({classifier_id: name}, classifiers);
    if (classifier) {
      log.ok(logCat, `found classifier "${name}" (name: ${classifier.name})`);
    } else {
      classifier = _.filter({name}, classifiers);
      if (classifier.length > 1) {
        log.warn(
          logCat,
          commaLists`multiple classifiers found with name "${name}": ${classifier}`
        );
        return;
      }
      if (classifier.length) {
        classifier = _.first(classifier);
        log.ok(
          logCat,
          `found classifier "${name}" (id: ${classifier.classifier_id})`
        );
      } else {
        log.warn(logCat, `no classifier with name/id "${name}"`);
      }
    }

    if (classifier && opts.ready && classifier.status !== 'ready') {
      log.warn(
        logCat,
        `classifier ${name} is not ready (${classifier.status})`
      );
      return;
    }

    return classifier;
  }

  async trainClassifier(name, classes, opts = {}) {
    const logCat = 'watson:Watson#trainClassifier()';

    log.debug(logCat, `training classifier ${name}`);
    let classifier = await this.findClassifier(name, opts);

    const createStreams = _.mapValues(createReadStream);

    if (!classifier) {
      if (opts.create) {
        log.warn(logCat, `creating classifier "${name}"`);
        classifier = await this._viz.createClassifier(
          _.assign({name}, createStreams(classes))
        );
        log.ok(
          logCat,
          `created & queued classifier "${name}" (${classifier.classifier_id}) for training`
        );
        return classifier;
      }
      Watson.notFoundError(name);
    }
    if (opts.retrain) {
      log.info(logCat, `attempting to retrain existing classifier "${name}"`);
      const params = _.assign({name}, createStreams(classes));
      classifier = await this._viz.retrainClassifier(params);
      log.ok(
        logCat,
        `queued classifier "${name}" (${classifier.classifier_id}) for retraining`
      );
      return classifier;
    }
    log.warn(logCat, `classifier "${name}" exists, but "retrain" option unset`);
  }

  async upsertClassifier(name, classes, opts = {}) {
    return this.trainClassifier(
      name,
      classes,
      _.defaults(
        {
          create: true
        },
        opts
      )
    );
  }

  async classifyImage(img, opts = {}) {
    return _.get(
      'images[0].classifiers',
      await this._viz.classify({
        images_file: img,
        classifier_ids: opts.ids || []
      })
    );
  }

  static create(...args) {
    return new Watson(...args);
  }
}
