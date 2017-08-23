import {stringify} from 'purdy';
import _ from 'lodash/fp';
import {PACKAGE_NAME} from './constants';

export const coercePositiveInteger = _.curry((optionName, value) => {
  if (isNaN(value) || !isFinite(value)) {
    throw new Error(`"${optionName}" must be a finite number`);
  }
  value = parseInt(value, 10);
  if (value < 1) {
    throw new Error(`"${optionName}" must be positive`);
  }
  return value;
});

export const screamingSnakeCase = _.pipe(_.snakeCase, _.toUpper);
export const envName = screamingSnakeCase(PACKAGE_NAME);
export const envKey = _.pipe(_.add(`${envName}-`), screamingSnakeCase);
export const envValue = _.pipe(envKey, _.get(_, process.env));
export const dump = _.partialRight(stringify, [
  {
    depth: null
  }
]);

export {default as pDelay} from 'delay';
export {default as pEvent} from 'p-event';
export {default as pMap} from 'p-map';
export {default as pMapSeries} from 'p-map-series';
export {default as pEachSeries} from 'p-each-series';
