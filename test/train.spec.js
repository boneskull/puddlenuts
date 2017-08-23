'use strict';

const expect = require('unexpected');
const sinon = require('sinon');
const {train} = require('../lib/shoot');

describe('train', function () {
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  it('should', function (done) {
    this.timeout(0);
    train({
      dryRun: true,
      classDelay: 1000,
      delay: 500,
      limit: 10,
      classifier: 'foo',
      firstClass: 'bar',
      secondClass: 'baz'
    })
      .subscribe(v => {
        console.log(v);
        done();
      });
  });
});
