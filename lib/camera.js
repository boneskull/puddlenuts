import RaspiCam from 'raspicam';
import _ from 'lodash/fp';
import tmp from 'tmp';
import {promisify} from 'util';
import {log} from './log';
import {dump, pEvent} from './util';
import {EventEmitter} from 'events';
import {PACKAGE_NAME} from './constants';

const tmpName = promisify(tmp.tmpName);

export class Camera extends EventEmitter {
  constructor(opts = {}) {
    super();
    const logCat = 'camera:Camera()';
    this._opts = _.defaults(
      {
        mode: 'photo',
        log: log.silly.bind(log, 'raspicam')
      },
      opts
    );
    log.debug(logCat, 'instantiated Camera with opts:', dump(this._opts));
  }

  static create(...args) {
    return new Camera(...args);
  }

  async takePhoto() {
    const logCat = 'camera:Camera#takePhoto()';
    const filepath = await tmpName({
      prefix: `${PACKAGE_NAME}-photo-`,
      postfix: '.jpg'
    });
    const cam = new RaspiCam(_.assign({output: filepath}, this._opts));
    cam.on('error', err => {
      log.error(logCat, err);
      this.emit('error', err);
    });
    cam.start();
    const [err] = await pEvent(cam, 'read', {multiArgs: true});
    if (err) {
      log.error(logCat, err);
      this.emit('error', err);
      return;
    }
    log.ok(logCat, `wrote image to ${filepath}; waiting for exit`);
    cam.stop();
    await pEvent(cam, 'exit');
    return filepath;
  }
}
