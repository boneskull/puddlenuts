'use strict';

const {handler} = require('../classify');
const {watsonOpts, cameraOpts} = require('./common-opts');

exports.command = 'classify <classifier>';

exports.description =
  'Classify an image against existing classifier by a snapshot or existing image';

exports.builder =
  yargs => yargs.options(watsonOpts)
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
      }
    });

exports.handler = handler;
