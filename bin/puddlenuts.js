#!/usr/bin/env node
/* eslint-disable strict */
'use strict';

require('@std/esm')(module, {
  cjs: true,
  esm: 'js'
})('../lib/cli');
