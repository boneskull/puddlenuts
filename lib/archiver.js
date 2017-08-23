import archiver from 'archiver';
import exitHook from 'async-exit-hook';
import _ from 'lodash/fp';
import {log} from './log';
import {EventEmitter} from 'events';
import {dump, pEvent} from './util';
import {PACKAGE_NAME} from './constants';
import tmp from 'tmp';
import fs from 'fs';
import {promisify} from 'util';

/**
 * promwrap does something untoward with tmp
 */
const tmpFile = promisify(tmp.file);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export class Archiver extends EventEmitter {
  /**
   * Pipes the streams; traps errors coming out of archiver stream
   * @param {NodeJS.WritableStream} output - (File?) output stream
   * @param {Archiver} zipArchiver - Archiver stream
   */
  constructor(output, zipArchiver) {
    const logCat = 'archiver:Archiver()';
    super();

    this._output = output;
    this._archiver = zipArchiver;
    this._errored = false;
    this._finalized = false;

    zipArchiver.pipe(output);

    zipArchiver.on('error', async err => {
      if (!this._errored) {
        log.error(logCat, err);
        try {
          await this.cleanup();
        } finally {
          this._errored = true;
        }
        this.emit('error', err);
      }
    });

    const destroy = () => {
      if (!this._finalized) {
        zipArchiver.abort();
        log.error(logCat, 'destroyed archive stream');
      }
    };

    exitHook.unhandledRejectionHandler(destroy);
    exitHook.uncaughtExceptionHandler(destroy);
    exitHook(async done => {
      if (!this._finalized) {
        log.warn(
          logCat,
          `attempting to salvage non-finalized archive ${this.filepath}`
        );
        try {
          await this.finalize();
          done();
        } catch (err) {
          log.error(logCat, `finalization failed`);
          destroy();
          done(err);
        }
      }
    });
  }

  get filepath() {
    return this._output.path;
  }

  static async create(opts) {
    const logCat = 'archiver:Archiver.create()';
    opts = _.defaults(
      {
        prefix: PACKAGE_NAME,
        postfix: '.zip',
        mode: 0o666,
        discardDescriptor: true
      },
      opts
    );
    log.debug(logCat, 'creating archive w/ options:', dump(opts));

    const filepath = await tmpFile(opts);

    /**
     * @type {NodeJS.WritableStream}
     */
    const output = await fs.createWriteStream(
      filepath,
      _.defaults(
        {
          mode: 0o666
        },
        opts
      )
    );

    output.on('error', async err => {
      if (!this._errored) {
        log.error(logCat, err);
        try {
          await this.cleanup();
        } finally {
          this._errored = true;
        }
        this.emit('error', err);
      }
    });

    const openStream = pEvent(output, 'open');
    const zipArchiver = archiver('zip');
    const wrappedArchiver = new Archiver(output, zipArchiver);
    await openStream;
    log.ok(logCat, `archive at ${filepath} ready for appending`);

    return wrappedArchiver;
  }

  async cleanup() {
    const logCat = 'archiver:Archiver#cleanup()';
    if (!this._finalized) {
      try {
        await unlink(this.filepath);
        log.warn(logCat, `removed 0-byte archive at ${this.filepath}`);
      } catch (err) {
        log.error(logCat, err);
        this.emit('error', err);
      }
    }
  }

  append(...args) {
    this._archiver.append(...args);
    return this;
  }

  async finalize() {
    const logCat = 'archiver:Archiver#finalize()';
    await this._archiver.finalize();
    this._finalized = true;
    const stats = await stat(this.filepath);
    if (stats.size === 0) {
      log.warn(logCat, `closed ${this.filepath} but it was 0 bytes!`);
    } else {
      log.ok(logCat, `closed ${this.filepath}; wrote ${stats.size} bytes`);
    }
    return this.filepath;
  }
}
