import {Gpio} from 'onoff';
import _ from 'lodash/fp';
import {log} from './log';
import {EventEmitter} from 'events';
import {pEvent} from './util';
import {DEBOUNCE_MS} from './constants';

export class Trigger extends EventEmitter {
  constructor() {
    super();
    this._pins = new Map();
    this._values = new Map();
  }

  static create() {
    return new Trigger();
  }

  connect(pin) {
    const logCat = 'trigger:Trigger#connect()';
    if (!pin) {
      log.debug(logCat, 'ignoring connection request to void pin');
      return this;
    }
    if (this._pins.has(pin)) {
      log.warn(logCat, `pin ${pin} already connected!`);
      return this;
    }
    const changeHandler = value => {
      this._values.set(pin, value);
      this.emit('change', value, pin);
      this.emit(`change:${pin}`, value);
    };

    const gpio = new Gpio(pin, 'in', 'both');

    // this will read the first value, then set up a change handler thereafter
    gpio.read((err, value) => {
      if (err) {
        log.error(logCat, err);
        return;
      }
      changeHandler(value);
      gpio.on('change', _.debounce(DEBOUNCE_MS, changeHandler));
    });

    log.info(logCat, `connected trigger to pin ${pin}`);
    this._pins.set(pin, gpio);
    return this;
  }

  async when(pin, value) {
    if (this._pins.has(pin) && this._values.get(pin) !== value) {
      return pEvent(this, `change:${pin}`);
    }
  }

  disconnect(pin) {
    const logCat = 'trigger:Trigger#disconnect()';
    if (pin) {
      const gpio = this._pins.get(pin);
      if (gpio) {
        gpio.removeAllListeners('change');
        gpio.unexport();
        this._pins.delete(pin);
        log.debug(logCat, `disconnected trigger from ${pin}`);
      } else {
        log.warn(logCat, `pin ${pin} is not connected!`);
      }
    } else if (this._pins.size) {
      this._pins.forEach((gpio, pin, pins) => {
        gpio.removeAllListeners('change');
        gpio.unexport();
        pins.delete(pin);
      });
      log.debug(logCat, `disconnected all triggers`);
    } else {
      log.debug(logCat, 'no pins connected; nothing to do');
    }
    return this;
  }
}
