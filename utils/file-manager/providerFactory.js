'use strict';

const local = require('./localStorage');
const aws = require('./awsStorage');
const gcp = require('./gcpStorage');

const providers = { local, aws, gcp };

const getProvider = (providerName = 'local') => {
  return providers[providerName] || providers.local;
};

module.exports = { getProvider, providers };
