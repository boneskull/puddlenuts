#!/usr/bin/env node
'use strict';

const {envName, envValue, envKey} = require('../lib/util');
const exitHook = require('async-exit-hook');
const yargs = require('yargs');
const {resolve} = require('path');

require('dotenv')
  .config();

exitHook.unhandledRejectionHandler(err => {
  require('../lib/log').error('process', err);
});

// eslint-disable-next-line no-unused-expressions
yargs.usage('$0 <command> [options...]')
  .commandDir(resolve(__dirname, '..', 'lib/commands'), {
    blacklist: /common-opts/
  })
  .demandCommand(1)
  .options({
    color: {
      description: 'Enable color output, if available',
      default: true,
      type: 'boolean'
    },
    loglevel: {
      choices: [
        'debug',
        'info',
        'warn',
        'error'
      ],
      description: 'Logging level',
      default: 'info'
    },
    'api-key': {
      type: 'string',
      description: `Set ${envKey('apiKey')} env var instead!`,
      demandOption: true,
      group: 'Watson'
    }
  })
  .check(argv => {
    const log = require('../lib/log');
    log.level = envValue('loglevel') || argv.loglevel;
    if (!argv.color) {
      log.disableColor();
    }
    process.env[envKey('apiKey')] = process.env[envKey('apiKey')] || argv[envKey('apiKey')];
    return true;
  })
  .wrap(yargs.terminalWidth())
  .env(envName)
  .help().argv;
