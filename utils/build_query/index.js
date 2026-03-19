'use strict';

// main queries
const { listQuery } = require('./listQuery');
const { detailQuery } = require('./detailQuery');

// core builders
const { buildQuery } = require('./buildQuery');
const { parseColumns } = require('./parseColumns');
const { getIncludeList } = require('./getIncludeList');
const { applyWhere } = require('./applyWhere');

// helpers
const { hydrateEditorDescriptionForEdit } = require('./hydrateEditor');
const { hydrateFileFields } = require('./hydrateFiles');
const { hydrateUserFields } = require('./hydrateUsers');
const { validatePublish } = require('./validatePublish');

module.exports = {
  // queries
  listQuery,
  detailQuery,

  // builders
  buildQuery,
  parseColumns,
  getIncludeList,
  applyWhere,

  // hydrators
  hydrateEditorDescriptionForEdit,
  hydrateFileFields,
  hydrateUserFields,

  // validators
  validatePublish
};
