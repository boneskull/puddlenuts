import expect from 'unexpected';
import * as util from '../lib/util';

describe('util', function() {
  describe('screamingSnakeCase()', function() {
    it('should return a SCREAMING_SNAKE_STRING', function() {
      expect(util.screamingSnakeCase('foo bar'), 'to equal', 'FOO_BAR');
    });
  });

  describe('envKey()', function() {
    it('should return an environment variable name for the program', function() {
      expect(util.envKey('apiKey'), 'to equal', `${util.envName}_API_KEY`);
    });
  });

  describe('envValue()', function() {
    beforeEach(function() {
      process.env[util.envKey('fooBarBaz')] = 'quux';
    });
    it('should return the value of an environment variable for the program', function() {
      expect(util.envValue('fooBarBaz'), 'to equal', 'quux');
    });
  });

  describe('coercePositiveInteger()', function() {
    it('should throw if given a non-number', function() {
      expect(
        () => util.coercePositiveInteger('myOption', 'foo'),
        'to throw',
        /number/
      );
    });

    it('should throw if given zero', function() {
      expect(
        () => util.coercePositiveInteger('myOption', 0),
        'to throw',
        /positive/
      );
    });

    it('should throw if given a negative number', function() {
      expect(
        () => util.coercePositiveInteger('myOption', -1),
        'to throw',
        /positive/
      );
    });

    it('should throw if given fraction of 1', function() {
      expect(
        () => util.coercePositiveInteger('myOption', 2 / 3),
        'to throw',
        /positive/
      );
    });

    it('should throw if given -Infinity', function() {
      expect(
        () => util.coercePositiveInteger('myOption', -Infinity),
        'to throw',
        /finite/
      );
    });

    it('should throw if given Infinity', function() {
      expect(
        () => util.coercePositiveInteger('myOption', Infinity),
        'to throw',
        /finite/
      );
    });

    it('should return an integer if given a finite positive number', function() {
      expect(util.coercePositiveInteger('myOption', 3.14), 'to equal', 3);
    });
  });
});
