// services/v1/index.js
'use strict';

const { loadModules } = require('../../utils/loader');

module.exports = loadModules(__dirname, {
  loadFiles: false,
  loadDirectories: true,
  deepLoad: true
});
