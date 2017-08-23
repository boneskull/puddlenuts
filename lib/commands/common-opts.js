'use strict';

const _ = require('lodash/fp');

const RASPISTILL_DEFAULTS = {
  width: 640,
  height: 480,
  quality: 100,
  timeout: 1
};

exports.cameraOpts = {
  raspistill: {
    alias: 'r',
    description: 'Options for raspistill in dot notation (e.g. "-r.width 640 -r.height 480")',
    requiresArg: true,
    type: 'object',
    default: RASPISTILL_DEFAULTS,
    coerce: _.defaults(RASPISTILL_DEFAULTS),
    group: 'Camera control'
  }
};

exports.watsonOpts = {
  retrain: {
    type: 'boolean',
    default: false,
    description: 'Retrain classifier (if exists)',
    group: 'Watson'
  },
  'dry-run': {
    type: 'boolean',
    default: false,
    description: `Don't actually upload anything`,
    group: 'Watson'
  }
};
