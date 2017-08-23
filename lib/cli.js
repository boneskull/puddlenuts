import {envName, envValue, envKey} from '../lib/util';
import exitHook from 'async-exit-hook';
import yargs from 'yargs';
import loudRejection from 'loud-rejection';
import {COMMAND_DIR, COMMAND_BLACKLIST} from '../lib/constants';
import _ from 'lodash/fp';
import {config as dotenv} from 'dotenv';
import {log} from '../lib/log';

loudRejection();
dotenv();

// eslint-disable-next-line no-unused-expressions
yargs
  .usage('$0 <command> [options...]')
  .commandDir(COMMAND_DIR, {
    blacklist: COMMAND_BLACKLIST
  })
  .demandCommand(1)
  .options({
    color: {
      description: 'Enable color output, if available',
      default: true,
      type: 'boolean',
      group: 'IO'
    },
    loglevel: {
      choices: ['error', 'warn', 'info', 'debug', 'silly'],
      description: 'Logging level',
      default: 'info',
      group: 'IO'
    },
    'api-key': {
      type: 'string',
      description: `Set ${envKey('apiKey')} env var instead!`,
      demandOption: true,
      group: 'Watson'
    },
    debug: {
      default: false,
      type: 'boolean',
      description: `Shortcut for '--loglevel debug'`,
      group: 'IO'
    }
  })
  .check(argv => {
    if (argv.debug) {
      argv.loglevel = 'debug';
    }
    log.level = envValue('loglevel') || argv.loglevel;

    if (!argv.color) {
      log.disableColor();
    }

    const apiKeyKey = envKey('apiKey');
    process.env[apiKeyKey] = process.env[apiKeyKey] || argv[apiKeyKey];

    exitHook.unhandledRejectionHandler(err => {
      log.error('process', _.getOr(err, 'message', err));
    });

    return true;
  })
  .wrap(yargs.terminalWidth())
  .env(envName)
  .help().argv;
