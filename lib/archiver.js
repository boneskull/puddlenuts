'use strict';

const tmp = require('tmp');
const archiver = require('archiver');
const fs = require('fs');
const exitHook = require('async-exit-hook');
const _ = require('lodash/fp');
const {promisify} = require('util');
const {packageName} = require('./util');
const {Subject, Observable} = require('rxjs');
const log = require('./log');
/**
 * `tmp.file` returns a whole bunch of parameters we don't need; just take the
 * first one, which is the path to the temp file.
 */
const tmpFile = Observable.bindNodeCallback(tmp.file, _.identity);
const unlink = Observable.bindNodeCallback(fs.unlink);
const stat = promisify(fs.stat);

const archiverStream = stream => {
  const archive = archiver('zip')
    .on('error', err => {
      log.error('archiver', err);
      throw err;
    });

  archive.pipe(stream);

  exitHook.unhandledRejectionHandler(() => {
    log.warn('archiver', 'destroying archive stream');
    archive.abort();
  });

  log.debug('archiver', 'initialized archive stream');
  return archive;
};

class Archive {
  /**
   *
   * @param {fs.WriteStream} stream - File stream
   * @param {Archiver} archiver - Archiver stream
   */
  constructor (stream, archiver) {
    this._stream = stream;
    this._archiver = archiver;
  }

  append (...args) {
    this._archiver.append(...args);
    return this;
  }

  get filepath () {
    return this._stream.path;
  }

  async finalize () {
    await this._archiver.finalize();
    const stats = await stat(this.filepath);
    log.ok('archiver', `closed ${this.filepath}; wrote ${stats.size} bytes`);
    return this.filepath;
  }
}

exports.createArchive = (opts = {}) => {
  log.debug('archiver', 'creating archive...', opts);

  return tmpFile(_.defaults({
    prefix: packageName,
    postfix: '.zip',
    mode: 0o666,
    discardDescriptor: true
  }, opts))
    .flatMap(filepath => {
      const stream = fs.createWriteStream(filepath, _.defaults({
        mode: 0o666
      }, opts));

      const cleanup = new Subject();

      Observable.fromEvent(stream, 'error')
        .subscribe(cleanup);

      cleanup.flatMap(() => unlink(filepath), _.identity)
        .subscribe(err => {
          log.warn('archiver', `removed 0-byte archive at ${filepath}`);
          throw err;
        });

      return Observable.fromEvent(stream, 'open', _.constant(stream))
        .take(1)
        .map(archiverStream)
        .map(archiver => {
          Observable.fromEvent(archiver, 'error')
            .subscribe(cleanup);
          log.ok('archiver', `archive at ${filepath} ready`);
          return new Archive(stream, archiver);
        });
    });
};
