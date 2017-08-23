'use strict';

const {coercePositiveInteger} = require('../util');
const {handler} = require('../shoot.js');
const log = require('../log');
const {oneLineTrim} = require('common-tags');
const {cameraOpts, watsonOpts} = require('./common-opts');

const MIN_LIMIT = 10;
const SUGGESTED_LIMIT = 50;

exports.command = 'shoot <classifier> <classes..>';

exports.description =
  'Take snapshots to train classifier with two (2) or more positive example classes, OR one (1) or more positive example classes, and one (1) negative example class (see "-n")';

exports.builder = yargs => yargs.options(cameraOpts)
  .options(watsonOpts)
  .options({
    negative: {
      alias: 'n',
      type: 'boolean',
      description: 'Include negative example class in training (will be final class)',
      group: 'Class',
      default: false
    },
    limit: {
      alias: 'l',
      coerce: coercePositiveInteger('limit'),
      description: 'Limit to this many snapshots per class',
      default: 50,
      type: 'number',
      requiresArg: true,
      group: 'Camera control'
    },
    delay: {
      alias: 'd',
      coerce: coercePositiveInteger('delay'),
      default: 3000,
      defaultDescription: '3000 (3s)',
      description: 'Delay between snapshots in ms',
      type: 'number',
      requiresArg: true,
      group: 'Camera control'
    },
    'class-delay': {
      alias: 'D',
      coerce: coercePositiveInteger('class-delay'),
      default: 10000,
      defaultDescription: '10000 (10s)',
      description: 'Delay between classes in ms',
      type: 'number',
      requiresArg: true,
      group: 'Camera control'
    },
    trigger: {
      alias: 't',
      coerce: coercePositiveInteger('trigger'),
      description: 'Set trigger interrupt on this GPIO pin (RPi only)',
      defaultDescription: 'No trigger',
      type: 'number',
      requiresArg: true,
      group: 'Camera control'
    }
  })
  .check(argv => {
    if (argv.classes.length === 1 && !argv.negative) {
      throw new Error(`Specify two (2) positive classes (<class1> <class2>), OR one (1) positive class and the "negative" flag (<class1> --negative)`);
    }
    const {limit} = argv;
    if (limit < MIN_LIMIT) {
      log.warn('command',
        `limit (${limit}) is less than ${MIN_LIMIT}; setting limit to ${MIN_LIMIT}`);
      argv.limit = MIN_LIMIT;
    } else if (limit < SUGGESTED_LIMIT) {
      log.warn('command',
        `A class with ${SUGGESTED_LIMIT} or more images is strongly recommended`);
    }
    return true;
  }, false)
  // @formatter:off
  .example(
    oneLineTrim`
      $0 shoot dogs poodles -n --retrain
    `,
    oneLineTrim`
      Take snapshots to train or retrain the "dogs" classifier, with a positive 
      example set of "poodles" and a negative example set (i.e. non-dogs); 
      upload to Watson
  `)
  .example(
    oneLineTrim`
      $0 shoot fish catfish swordfish --dry-run
    `,
    oneLineTrim`
      Take snapshots to train (do not retrain if "fish" exists") the "fish" 
      classifier with positive examples of "catfish" and "swordfish"; 
      don't upload
    `);
// @formatter:on

exports.handler = handler;
