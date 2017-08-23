import _ from 'lodash/fp';
import {RASPISTILL_DEFAULTS} from '../constants';

export const cameraOpts = {
  raspistill: {
    alias: 'r',
    description:
      'Options for raspistill in dot notation (e.g. "-r.width 640 -r.height 480")',
    requiresArg: true,
    type: 'object',
    default: RASPISTILL_DEFAULTS,
    coerce: _.defaults(RASPISTILL_DEFAULTS),
    group: 'Camera control'
  }
};

export const watsonOpts = {
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
