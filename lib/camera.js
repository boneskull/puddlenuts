'use strict';

const RaspiCam = require('raspicam');
const _ = require('lodash/fp');
const tmp = require('tmp');
const {Observable} = require('rxjs');
const tmpName = Observable.bindNodeCallback(tmp.tmpName, _.identity);
const log = require('./log');
const {packageName} = require('./util');

class Camera {
  constructor (opts = {}) {
    this._opts = _.defaults({
      mode: 'photo',
      log: log.debug.bind(log)
    }, opts);
  }

  async takePhoto () {
    return tmpName({
      prefix: `${packageName}-photo-`,
      postfix: '.jpg'
    })
      .flatMap(output => {
        const cam = new RaspiCam(_.assign({output}, this._opts));
        const read$ = Observable.fromEvent(cam,
          'read',
          (err, timestamp, filename) => {
            if (err) {
              throw err;
            }
            return output;
          })
          .take(1);
        cam.start();
        return read$;
      })
      .do(filepath => {
        log.ok('camera', `wrote image to ${filepath}`);
      })
      .toPromise();
  }
}

exports.getCamera = (opts = {}) => new Camera(opts);
