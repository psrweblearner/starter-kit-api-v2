'use strict';

const parseJSON = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

module.exports = (body = {}) => {
  const payload = { ...body };
  const jsonFields = ['mailField', 'watchedFields', 'conditionRules'];

  jsonFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      payload[field] = parseJSON(payload[field]);
    }
  });

  if (payload.mailTo) payload.mailTo = String(payload.mailTo).toLowerCase();
  if (payload.attchmentTo) payload.attchmentTo = String(payload.attchmentTo).toLowerCase();
  if (payload.triggerOn) payload.triggerOn = String(payload.triggerOn).toLowerCase();
  if (payload.module && ['all', '*'].includes(String(payload.module).toLowerCase())) payload.module = '*';
  if (payload.operation && ['any', 'all', '*'].includes(String(payload.operation).toLowerCase())) payload.operation = null;
  delete payload.eventKey;
  delete payload.placeholders;
  delete payload.isOtpTemplate;
  delete payload.otpType;

  return payload;
};
