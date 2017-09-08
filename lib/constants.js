import {resolve} from 'path';
import {sync as loadJsonFile} from 'load-json-file';

const pkg = loadJsonFile(resolve(__dirname, '..', 'package.json'));

export const DEBOUNCE_MS = 50;
export const PACKAGE_NAME = pkg.name;
export const NEGATIVE_CLASS = '__negative__';
export const HIGH = 1;
export const COMMAND_DIR = resolve(__dirname, 'commands');
export const COMMAND_BLACKLIST = /common-opts/;
export const RASPISTILL_DEFAULTS = {
  width: 640,
  height: 480,
  quality: 100,
  timeout: 1
};
