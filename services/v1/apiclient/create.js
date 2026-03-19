// services/v1/apiclient/create.js
'use strict';
const { ApiClient } = require('../../../models');
const crypto = require('crypto');
const AppError = require('../../../utils/AppError');
module.exports = async (payload) => {
  if (!payload.domain) {
    throw new AppError('Domain is required to create API Client', 400);
  }
  const apiKey = crypto.randomBytes(16).toString('hex');
  payload.api_key = apiKey;
  const client = await ApiClient.create(payload);
  return client;
  
};
