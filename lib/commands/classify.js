import {classify} from '../classify';
import {watsonOpts, cameraOpts} from './common-opts';
import {oneLineTrim} from 'common-tags';

export const command = 'classify [..classifier]';

export const description = oneLineTrim`
  Classify an image against one or more classifiers by a snapshot or existing
  image.  Default is to run against all classifiers.
  `;

export const builder = yargs => {
  return yargs
    .options(watsonOpts)
    .options(cameraOpts)
    .options({
      shoot: {
        alias: 's',
        type: 'boolean',
        default: true,
        description: 'Take a snapshot and upload result',
        group: 'IO'
      },
      input: {
        alias: 'i',
        type: 'string',
        description: 'Upload .jpg or .png at this path',
        normalize: true,
        implies: 'no-shoot',
        group: 'IO'
      },
      output: {
        alias: 'o',
        description: 'Output to temp file or filepath (if specified)',
        group: 'IO',
        type: 'string',
        defaultDescription: '(none)'
      },
      threshold: {
        alias: 't',
        description: 'Set threshold for classification'
      }
    });
};

export {classify as handler};
