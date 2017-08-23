'use strict';

let Gpio;
const _ = require('lodash/fp');
const {Observable, BehaviorSubject} = require('rxjs');
const log = require('./log');

try {
  Gpio = require('onoff').Gpio;

  let trigger;
  let subject;
  let observable;

  exports.connectTrigger = pin => {
    if (pin) {
      if (!subject) {
        log.debug('trigger', `registering trigger on pin ${pin}`);
        let lastValue;
        let value;

        try {
          trigger = new Gpio(pin, 'in', 'both');
        } catch (err) {
          log.error('trigger', `failed registration for pin ${pin}`, err);
          throw err;
        }

        value = lastValue = trigger.readSync();
        log.ok('trigger', `enabled trigger on pin ${pin} w/ value ${value}`);

        subject = new BehaviorSubject(value);
        const handler = _.debounce(50, (err, value) => {
          if (err) {
            subject.error(err);
            return;
          }
          if (lastValue !== value) {
            log.info('trigger', `triggered new value: ${value}`);
            subject.next(value);
            lastValue = value;
          }
        });

        subject.next(value);
        trigger.watch(handler);

        subject.subscribe({
          complete () {
            trigger.unexport();
          },
          error (err) {
            throw err;
          }
        });

        observable = subject.filter(value => {
          if (value === 1) {
            log.debug('train', 'trigger is HIGH; continuing...');
            return true;
          }
          log.warn('train', 'paused while trigger is LOW...');
        });
      }
      return observable;
    }
    log.debug('trigger', 'no trigger pin specified');

    return Observable.defer(() => Observable.of(1));
  };

  exports.disconnectTrigger = () => {
    if (subject) {
      log.debug('trigger', 'disconnecting trigger');
      subject.complete();
    }
  };
} catch (ignored) {
  exports.connectTrigger = () => Observable.defer(() => Observable.of(1));
  exports.disconnectTrigger = _.noop;
}
