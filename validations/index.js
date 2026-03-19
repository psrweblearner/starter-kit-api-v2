'use strict';

const fs = require('fs');
const path = require('path');

const validations = {};
const basePath = __dirname;

fs.readdirSync(basePath, { withFileTypes: true })
  .filter(
    (file) =>
      file.isFile() &&
      file.name !== 'index.js' &&
      file.name.endsWith('.schema.js')
  )
  .forEach((file) => {
    const validationName = path.basename(file.name, '.schema.js');
    const validationPath = path.join(basePath, file.name);

    validations[validationName] = require(validationPath);
  });

module.exports = validations;
