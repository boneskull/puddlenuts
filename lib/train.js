import {NEGATIVE_CLASS} from './constants';
import {Watson} from './api/watson';
import _ from 'lodash/fp';
import {log} from './log';

const trainingOption = classname =>
  classname === NEGATIVE_CLASS
    ? 'negative_examples'
    : `${classname}_positive_examples`;

const createOpts = result => [
  trainingOption(result.classname),
  result.filepath
];

const buildOpts = (positive, negative) =>
  _.fromPairs(
    _.map(
      createOpts,
      negative
        ? [
            ...positive,
            {
              filepath: negative,
              classname: NEGATIVE_CLASS
            }
          ]
        : positive
    )
  );

export const train = async ({
  dryRun,
  classifier,
  positive,
  retrain,
  negative,
  apiKey
}) => {
  const logCat = 'command:train';

  if (!dryRun) {
    return Watson.create(apiKey).upsertClassifier(
      classifier,
      buildOpts(positive, negative),
      {
        retrain
      }
    );
  } else {
    log.debug(logCat, 'dry run; nothing to do');
  }
};
