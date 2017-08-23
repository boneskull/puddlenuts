'use strict';

const {Observable} = require('rxjs');
const _ = require('lodash/fp');
const log = require('./log');
const {getCamera} = require('./camera');
const {connectTrigger, disconnectTrigger} = require('./trigger');
const {createArchive} = require('./archiver');
const {upsertClassifier} = require('./viz');
const {NEGATIVE_CLASS} = require('./constants');
const {packageName} = require('./util');

/**
 * (Re-)trains a classifier by taking one or more snapshots.
 * Minimum two classes and 10 snapshots per class.
 *
 * @param {Object} params - Required parameters
 * @param {string} params.classifier - Classifier name
 * @param {number} params.delay - Pause (in ms) between snapshots
 * @param {number} params.limit - Limit to this many snapshots
 * @param {boolean} params.dryRun - Don't upload archive
 * @param {boolean} params.classDelay - Pause (in ms) between classes
 * @param {boolean} params.retrain - Retrain existing classifiers
 * @param {Array<string|Symbol>} [params.classes] - Classes to train
 * @param {boolean} params.negative - Take snapshots for negative example
 * @returns {Observable}
 */
/* @formatter:off */
exports.shoot = ({
  classifier, limit, delay, trigger, dryRun, classDelay,
  retrain, negative, classes, raspistill
}) => {
/* @formatter:on */
  log.info('shoot',
    `training classifier "${classifier}" with classes: ${classes}`);
  log.debug('shoot', `limit: ${limit}`, `delay: ${delay}`);
  log.debug('shoot', `class-delay: ${classDelay}`, `dry-run: ${dryRun}`);
  if (trigger) {
    log.info('shoot', `trigger is set to pin ${trigger}`);
  }

  const camera = getCamera(raspistill);

  const trigger$ = connectTrigger(trigger);

  return Observable.from(negative
    ? classes.concat(NEGATIVE_CLASS)
    : classes)
    .concatMap((classname, count) => {
      return createArchive({
        prefix: `${packageName}-${classifier}-${classname}-`
      })
        .flatMap(archive => Observable.range(0, limit)
          .concatMap(snapshotCount => trigger$.first()
            .flatMap(() => {
              log.info(`shoot <${classname}>`,
                `taking snapshot ${snapshotCount + 1} / ${limit}`);
              return Observable.fromPromise(camera.takePhoto())
                .map(filepath => archive.append(filepath, {
                  name: `${packageName}-${classifier}-${classname}-${snapshotCount}.jpg`
                }))
                .do(archive => {
                  log.ok(`shoot <${classname}>`,
                    `appended to archive ${archive.filepath}`);
                  log.debug(`shoot <${classname}>`, `waiting ${delay}ms...`);
                })
                .delay(delay);
            }))
          .bufferCount(limit), _.identity)
        .flatMap(archive => Observable.fromPromise(archive.finalize()),
          _.identity)
        .do(archive => {
          log.ok('shoot', `completed training for "${classname}"`);
          if (count < classes.length - 1) {
            log.info('shoot', `waiting ${classDelay}ms...`);
          }
        })
        .delay(count < classes.length - 1
          ? classDelay
          : 0);
    }, (classname, archive) => ({
      classname,
      filepath: archive.filepath
    }))
    .toArray()
    .flatMap(results => {
      if (!dryRun) {
        const trainingOption = classname => classname === NEGATIVE_CLASS
          ? 'negative_examples'
          : `${classname}_positive_examples`;

        return upsertClassifier(classifier, _.fromPairs(_.map(result => [
          trainingOption(result.classname),
          result.filepath
        ], results)), {retrain});
      }
      return Observable.empty();
    }, (results, classifiers) => ({
      results,
      classifiers
    }))
    .do(() => {
      disconnectTrigger();
    });
};

exports.handler = async (...args) => {
  return exports.shoot(...args)
    .toPromise();
};
