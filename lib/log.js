'use strict';

const log = exports.log = require('npmlog');
const {name} = require('../package.json');

log.level = process.env[`${name.toUpperCase()}_LOGLEVEL`] || 'info';
log.addLevel('debug', 1000, {fg: 'grey'}, 'DEBUG');
log.addLevel('info', 2000, {fg: 'white'}, 'INFO');
log.addLevel('ok', 2000, {fg: 'green'}, 'OK');
log.addLevel('warn', 3000, {fg: 'yellow'}, 'WARN');
log.addLevel('error', 5000, {fg: 'red'}, 'ERROR');
log.prefixStyle = {fg: 'cyan'};

module.exports = log;
