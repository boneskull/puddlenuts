import log from 'npmlog';
import {PACKAGE_NAME} from './constants';

log.level = process.env[`${PACKAGE_NAME.toUpperCase()}_LOGLEVEL`] || 'info';
log.addLevel('silly', -Infinity, {fg: 'magenta'}, 'SILLY');
log.addLevel('debug', 1000, {fg: 'grey'}, 'DEBUG');
log.addLevel('info', 2000, {fg: 'white'}, 'INFO');
log.addLevel('ok', 2000, {fg: 'green'}, 'OK');
log.addLevel('warn', 3000, {fg: 'yellow'}, 'WARN');
log.addLevel('error', 5000, {fg: 'red'}, 'ERROR');
log.prefixStyle = {fg: 'cyan'};

export {log};
