'use strict';

const _ = require('lodash/fp');
const {name} = require('../package.json');

exports.coercePositiveInteger = _.curry((optionName, value) => {
  if (isNaN(value)) {
    throw new Error(`"${optionName}" must be a number`);
  }
  value = parseInt(value, 10);
  if (value < 1) {
    throw new Error(`"${optionName}" must be positive`);
  }
  return value;
});

exports.screamingSnakeCase = _.pipe(_.snakeCase, _.toUpper);

exports.envName = exports.screamingSnakeCase(name);

exports.envKey = _.pipe(_.add(`${exports.envName}-`), exports.screamingSnakeCase);

exports.envValue = _.pipe(exports.envKey, _.get(_, process.env));

exports.packageName = name;
