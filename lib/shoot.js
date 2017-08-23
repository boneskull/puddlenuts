import _ from 'lodash/fp';
import {log} from './log';
import {Camera} from './camera';
import {Trigger} from './trigger';
import {Archiver} from './archiver';
import {Watson} from './api/watson';
import {createReadStream} from 'fs';
import {PACKAGE_NAME, NEGATIVE_CLASS, HIGH} from './constants';
import {pMap, pMapSeries, pEachSeries, pDelay} from './util';
import {commaLists} from 'common-tags';

/**
 * @typedef {Object} Result
 * @property {String} classname - Name of the class
 * @property {String} filepath - Path to .zip file
 */

/**
 * (Re-)trains a classifier by taking one or more snapshots.
 * Minimum two classes (or one class and the `negative` option), and 10
 * snapshots per class.
 *
 * @param {Object} params - Required parameters
 * @param {string} params.classifier - Classifier name
 * @param {number} params.delay - Pause (in ms) between snapshots
 * @param {number} params.limit - Limit to this many snapshots
 * @param {boolean} params.dryRun - Don't upload archive
 * @param {boolean} params.classDelay - Pause (in ms) between classes
 * @param {boolean} params.retrain - Retrain existing classifiers
 * @param {string[]} [params.classes] - Classes to train
 * @param {boolean} params.negative - Take snapshots for negative example
 * @returns Promise<Result[]> Results
 */
export const shoot = async ({
  classifier,
  limit,
  delay,
  trigger,
  dryRun,
  classDelay,
  retrain,
  negative,
  classes,
  raspistill,
  apiKey
}) => {
  const logCat = 'command:shoot';
  log.info(
    logCat,
    commaLists`training classifier "${classifier}" with classes: ${classes}`
  );
  log.debug(logCat, `limit: ${limit}`, `delay: ${delay}`);
  log.debug(logCat, `class-delay: ${classDelay}`, `dry-run: ${dryRun}`);
  if (trigger) {
    log.info(logCat, `trigger is set to pin ${trigger}`);
  }

  const camera = Camera.create(raspistill);

  const triggerInput = Trigger.create().connect(trigger);

  const shootClass = async (classname, classIdx) => {
    const archive = await Archiver.create({
      prefix: `${PACKAGE_NAME}-${classifier}-${classname}-`
    });
    const logCatClass = `${logCat} <${classname}>`;

    await pEachSeries(_.range(0, await limit), async snapshotIdx => {
      await triggerInput.when(trigger, HIGH);
      log.info(logCatClass, `taking snapshot ${snapshotIdx + 1} / ${limit}`);
      const imgFilepath = await camera.takePhoto();
      archive.append(createReadStream(imgFilepath), {
        name: `${PACKAGE_NAME}-${classifier}-${classname}-${snapshotIdx}.jpg`
      });
      log.ok(
        logCatClass,
        `appended ${imgFilepath} to archive ${archive.filepath}`
      );
      log.debug(logCatClass, `waiting ${delay}ms...`);
      return pDelay(delay);
    });

    await archive.finalize();
    log.ok(logCat, `completed training for "${classname}"`);

    if (classIdx < classes.length - 1) {
      log.info(logCat, `waiting ${classDelay}ms...`);
      await pDelay(classDelay);
    }

    return {
      classname,
      filepath: archive.filepath
    };
  };

  const results = await pMapSeries(
    negative ? [...classes, NEGATIVE_CLASS] : classes,
    shootClass
  );

  if (!dryRun) {
    const api = Watson.create(apiKey);
    await pMap(results, result => {
      const trainingOption = classname =>
        classname === NEGATIVE_CLASS
          ? 'negative_examples'
          : `${classname}_positive_examples`;

      return api.upsertClassifier(
        classifier,
        _.fromPairs(
          _.map(
            result => [trainingOption(result.classname), result.filepath],
            results
          )
        ),
        {retrain}
      );
    });
  }
  triggerInput.disconnect();

  return results;
};
