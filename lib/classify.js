import {Watson} from './api/watson';
import {createReadStream} from 'fs';
import {Camera} from './camera';
import {log} from './log';
import {dump, pEachSeries} from './util';

export const classify = async ({
  shoot,
  file,
  classifier,
  width,
  height,
  output,
  dryRun,
  raspistill,
  apiKey
}) => {
  const logCat = 'classify:classify';
  let api;
  if (!dryRun) {
    api = Watson.create(apiKey);
    if (classifier) {
      await pEachSeries(async classifierName => {
        const result = await api.findClassifier(classifierName, {
          ready: true
        });
        if (!result) {
          throw new Error(`classifier ${classifierName} is not ready!`);
        }
        log.debug(logCat, `${classifierName} is ready`);
      }, classifier);
    }
  }

  const filepath = shoot ? await Camera.create(raspistill).takePhoto() : file;

  log.ok(logCat, `created ${filepath}`);

  if (!dryRun) {
    const filestream = createReadStream(filepath);
    const classification = await api.classifyImage(filestream, {
      ids: classifier
    });
    log.ok(logCat, 'result', dump(classification));

    return {classification, filepath};
  }
  return {filepath};
};
