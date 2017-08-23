'use strict';

const {NEGATIVE_CLASS} = require('./constants');
const {upsertClassifier} = require('./viz');
const _ = require('lodash/fp');
const {Observable} = require('rxjs');

exports.train = params => {
  const {dryRun, classifier, positive, retrain, negative} = params;
  if (!dryRun) {
    const trainingOption = classname => classname ===
    NEGATIVE_CLASS
      ? 'negative_examples'
      : `${classname}_positive_examples`;

    return upsertClassifier(classifier, _.fromPairs(_.map(result => [
      trainingOption(result.classname),
      result.filepath
    ], negative ? positive.concat({
      filepath: negative,
      classname: NEGATIVE_CLASS
    }) : positive)), {retrain});
  }
  return Observable.empty();
};

exports.handler = async (...args) => {
  return exports.train(...args)
    .toPromise();
};
