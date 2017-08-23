'use strict';

const {classifyOne, findClassifier} = require('./viz');
const {createReadStream} = require('fs');
const {getCamera} = require('./camera');
const {Observable} = require('rxjs');
const log = require('./log');
const _ = require('lodash/fp');

exports.classify = ({
  shoot, file, classifier, width, height, output, dryRun, raspistill
}) => Observable.fromPromise(findClassifier(classifier, {ready: true}))
  .map(result => {
    if (!result && !dryRun) {
      throw new Error(`classifier ${classifier} is not ready to classify`);
    }
    const id = _.get('classifier_id', result);
    let read$;
    if (shoot) {
      log.debug('classify', 'taking snapshot...');
      const camera = getCamera(raspistill);
      read$ =
        Observable.fromPromise(camera.takePhoto())
          .map(createReadStream);
    } else {
      log.debug('classify', `reading from file ${file}`);
      read$ = Observable.of(createReadStream(file));
    }
    return read$
      .map(img => {
        if (dryRun) {
          return;
        }
        return classifyOne(id, img);
      });
  })
  .concatAll();

exports.handler = (...args) => {
  return exports.classify(...args)
    .toPromise()
    .then(res => {
      if (res) {
        console.log(require('util')
          .inspect(res, {depth: null}));
      }
    });
};
