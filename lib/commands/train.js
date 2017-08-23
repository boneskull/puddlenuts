'use strict';

const _ = require('lodash/fp');
const {normalize} = require('path');
const {oneLineTrim} = require('common-tags');

const {handler} = require('../train');
const {watsonOpts} = require('./common-opts');

const buildPositiveExamples = _.pipe(_.chunk(2),
  _.map(([name, path]) => _.zipObject([
    'classname',
    'filepath'
  ], [
    name,
    normalize(path)
  ])));

exports.command = 'train <classifier>';

exports.description = 'Train Watson with existing .zip archives';

exports.builder = yargs => yargs.options(watsonOpts)
  .options({
    positive: {
      alias: 'p',
      type: 'array',
      nargs: 2,
      description: 'Positive example classname and path to .zip',
      demandOption: 'Provide a classname and path to .zip',
      coerce: buildPositiveExamples,
      group: 'Classes'
    },
    negative: {
      alias: 'n',
      type: 'string',
      nargs: 1,
      normalize: true,
      description: 'Path to .zip of negative examples',
      group: 'Classes'
    },
    retrain: {
      type: 'boolean',
      default: false,
      description: 'Retrain classifier (if exists)',
      group: 'Watson'
    }
  })
  .check(argv => {
    if (argv.positive.length === 1 && !argv.negative) {
      throw new Error(`Specify two (2) positive classes and paths (-p <pos-class1> <pos-path2> -p <pos-class2> <pos-path2>), OR one (1) positive class and path AND one (1) negative path (-p <pos-class> <pos-path> --negative <neg-path>)`);
    }
    return true;
  }, false)
  // @formatter:off
  .example(
    oneLineTrim`
      $0 train fish -p catfish /path/to/catfish.zip -p swordfish 
      /path/to/swordfish.zip
    `,
    oneLineTrim`
      Upload to train (do not retrain) the "fish" classifier with positive 
      example classes of  "catfish" and "swordfish" (and paths to .zip files 
      containing images, respectively)
    `)
  .example(
    oneLineTrim`
      $0 train dogs -p poodles /path/to/poodles.zip -n 
      /path/to/negative_examples.zip --retrain
    `,
    oneLineTrim`
      Upload to train or retrain the "dogs" classifier with positive example 
      class "poodles" and a negative example class (and paths to .zip files 
      containing images, respectively)
    `)
  // @formatter:on
;

exports.handler = handler;
