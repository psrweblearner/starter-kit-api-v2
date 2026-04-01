'use strict';

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  nodemailer = null;
}
const path = require('path');
const { Op } = require('sequelize');

const logger = require('./logger');

let cachedTransporter = null;

function runInBackground(task, label = 'mail-task') {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch(err => logger.error(`${label} failed: ${err.message}`));
  });
}

function isEmailLike(value) {
  return typeof value === 'string' && /.+@.+\..+/.test(value.trim());
}

function normalizeRecipients(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map(item => String(item).trim())
      .filter(Boolean)
      .join(',');
  }
  return String(value).trim();
}

function parseEditorContent(value) {
  try {
    if (value === undefined || value === null) return '';

    if (typeof value === 'object' && value.blocks) {
      return value.blocks.map(block => block.data?.text || '').join('<br>');
    }

    if (typeof value === 'string' && value.trim().startsWith('{')) {
      const parsed = JSON.parse(value);
      if (parsed?.blocks) {
        return parsed.blocks.map(block => block.data?.text || '').join('<br>');
      }
    }

    return value;
  } catch {
    return value;
  }
}

function replacePlaceholders(templateString, data = {}) {
  if (!templateString) return '';

  const resolveToken = (_, key) => {
    const rawValue = data[String(key).trim()];
    const value = parseEditorContent(rawValue);
    return value === undefined || value === null ? '' : String(value);
  };

  return String(templateString)
    .replace(/##\s*(.*?)\s*##/g, resolveToken)
    .replace(/{{\s*(.*?)\s*}}/g, resolveToken);
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
}

function getChangedFields(record = {}, previousRecord = {}) {
  const keys = new Set([...Object.keys(record), ...Object.keys(previousRecord)]);
  const changed = [];

  for (const key of keys) {
    const before = previousRecord[key];
    const after = record[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changed.push(key);
    }
  }

  return changed;
}

function checkConditionRule(rule = {}, record = {}, previousRecord = {}) {
  const field = rule.field;
  const operator = String(rule.operator || 'eq').toLowerCase();
  const currentValue = record[field];
  const previousValue = previousRecord[field];
  const expected = rule.value;

  switch (operator) {
    case 'eq':
      return String(currentValue) === String(expected);
    case 'neq':
      return String(currentValue) !== String(expected);
    case 'includes':
      return Array.isArray(currentValue)
        ? currentValue.map(String).includes(String(expected))
        : String(currentValue || '').includes(String(expected));
    case 'changed':
      return JSON.stringify(currentValue) !== JSON.stringify(previousValue);
    case 'changed_to':
      return JSON.stringify(currentValue) !== JSON.stringify(previousValue) && String(currentValue) === String(expected);
    default:
      return true;
  }
}

function shouldTriggerTemplate(template, operation, record = {}, previousRecord = {}) {
  if (!template) return false;
  const triggerOn = String(template.triggerOn || 'always').toLowerCase();

  if (triggerOn === 'always') {
    return true;
  }

  if (triggerOn === 'status_change') {
    if (operation !== 'update') return false;
    return JSON.stringify(record.status) !== JSON.stringify(previousRecord.status);
  }

  if (triggerOn === 'field_change') {
    const watchedFields = asArray(template.watchedFields);
    if (!watchedFields.length) return false;
    if (operation !== 'update') {
      // For create/delete flows, match if watched field has a non-empty value in current record.
      return watchedFields.some(field => record[field] !== undefined && record[field] !== null && record[field] !== '');
    }
    return watchedFields.some(field => JSON.stringify(record[field]) !== JSON.stringify(previousRecord[field]));
  }

  if (triggerOn === 'custom_condition') {
    const rules = Array.isArray(template.conditionRules) ? template.conditionRules : [];
    if (!rules.length) return false;
    return rules.every(rule => checkConditionRule(rule, record, previousRecord));
  }

  return true;
}

/** Columns added by migrations/20260323142800-add-email-template-trigger-fields.js */
const OPTIONAL_EMAIL_TEMPLATE_TRIGGER_COLUMNS = ['triggerOn', 'watchedFields', 'conditionRules'];

function isMissingOptionalTemplateColumnError(err) {
  const msg = String(err?.message || '');
  if (!msg.includes('Unknown column')) return false;
  return OPTIONAL_EMAIL_TEMPLATE_TRIGGER_COLUMNS.some(
    col => msg.includes(`'${col}'`) || msg.includes(`\`${col}\``) || msg.includes(col)
  );
}

async function findEmailTemplatesForTrigger(db, where) {
  const options = { where, order: [['id', 'DESC']] };
  try {
    return await db.EmailTemplate.findAll(options);
  } catch (err) {
    if (!isMissingOptionalTemplateColumnError(err)) throw err;
    logger.warn(
      'EmailTemplates table is missing trigger columns (triggerOn / watchedFields / conditionRules). Run: npm run db:migrate. Mail triggers will behave as triggerOn=always until then.'
    );
    return await db.EmailTemplate.findAll({
      ...options,
      attributes: { exclude: OPTIONAL_EMAIL_TEMPLATE_TRIGGER_COLUMNS }
    });
  }
}

function parseMailField(mailField) {
  if (!mailField) return {};
  if (typeof mailField === 'object') return mailField;

  if (typeof mailField === 'string') {
    try {
      return JSON.parse(mailField);
    } catch (err) {
      logger.warn(`Mail field JSON parse failed: ${err.message}`);
    }
  }

  return {};
}

function getMailPort() {
  const port = Number(process.env.MAIL_PORT);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

function getMailSecure() {
  if (typeof process.env.MAIL_SECURE !== 'undefined') {
    return String(process.env.MAIL_SECURE).toLowerCase() === 'true';
  }
  return getMailPort() === 465;
}

function getFromAddress() {
  const from = process.env.MAIL_FROM;
  if (from) return from;

  const email = process.env.MAIL_USER || '';
  const name = process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'Starter Kit';

  if (!email) return name;
  return `${name} <${email}>`;
}

function getTransporter() {
  if (!nodemailer) {
    throw new Error('Nodemailer is not installed. Run `npm install` to enable mail delivery.');
  }

  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.MAIL_HOST;
  if (!host) {
    throw new Error('MAIL_HOST is not configured');
  }

  const port = getMailPort();
  const secure = getMailSecure();

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: process.env.MAIL_USER
      ? {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      : undefined
  });

  return cachedTransporter;
}

async function sendMail({ to, subject, html, attachments = [], cc, bcc, replyTo } = {}) {
  const recipient = normalizeRecipients(to);

  if (!recipient) {
    throw new Error('Mail recipient is required');
  }

  if (!isEmailLike(recipient.split(',')[0])) {
    throw new Error(`Invalid recipient email: ${recipient}`);
  }

  const transporter = getTransporter();
  const payload = {
    from: getFromAddress(),
    to: recipient,
    subject: subject || '(no subject)',
    html: html || '',
    attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : []
  };

  const normalizedCc = normalizeRecipients(cc);
  const normalizedBcc = normalizeRecipients(bcc);
  if (normalizedCc) payload.cc = normalizedCc;
  if (normalizedBcc) payload.bcc = normalizedBcc;
  if (replyTo) payload.replyTo = replyTo;

  const info = await transporter.sendMail(payload);
  logger.info(`Email sent to ${payload.to} with subject "${payload.subject}" (${info.messageId || 'no-id'})`);
  return info;
}

function getPlainRecord(instance) {
  if (!instance) return {};
  if (typeof instance.toJSON === 'function') {
    return instance.toJSON();
  }
  if (instance.dataValues) {
    return instance.dataValues;
  }
  return instance;
}

async function resolveFileUrl(db, file) {
  if (!file) return null;

  if (typeof file.getFullUrl === 'function') {
    try {
      return file.getFullUrl();
    } catch (err) {
      logger.warn(`File URL resolution via model helper failed: ${err.message}`);
    }
  }

  try {
    if (db.Setting && file.storage_provider) {
      const setting = await db.Setting.findOne({
        where: { title: 'cdn', type: file.storage_provider }
      });

      let domain = setting?.value || '';
      if (domain.endsWith('/')) {
        domain = domain.slice(0, -1);
      }

      const filePath = file.file_path || '';
      const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      return `${domain}${normalizedPath}`;
    }
  } catch (err) {
    logger.warn(`File URL resolution via settings failed: ${err.message}`);
  }

  return file.file_path || null;
}

async function resolveAttachments(db, record, fieldName) {
  if (!fieldName || !record) return [];

  const rawValue = record[fieldName];
  if (!rawValue) return [];

  const values = Array.isArray(rawValue) ? rawValue : [rawValue];
  const attachments = [];
  const idsToLoad = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === 'object' && (value.file || value.path)) {
      attachments.push({
        filename: value.filename || value.original_name || value.file_name || `attachment-${Date.now()}`,
        path: value.file || value.path,
        contentType: value.type || value.mime_type || 'application/octet-stream'
      });
      continue;
    }

    if (typeof value === 'object' && value.id) {
      idsToLoad.push(value.id);
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const looksLikePath = /^https?:\/\//i.test(trimmed) || trimmed.includes('/') || trimmed.includes('\\');
      if (looksLikePath) {
        attachments.push({
          filename: path.basename(trimmed.split('?')[0]) || `attachment-${Date.now()}`,
          path: trimmed,
          contentType: 'application/octet-stream'
        });
        continue;
      }
    }

    idsToLoad.push(value);
  }

  if (!idsToLoad.length || !db.File) {
    return attachments;
  }

  const files = await db.File.findAll({
    where: { id: idsToLoad }
  });

  for (const file of files) {
    const fileUrl = await resolveFileUrl(db, file);
    attachments.push({
      filename: file.original_name || file.file_name || `file-${file.id}`,
      path: fileUrl || file.file_path,
      contentType: file.mime_type || 'application/octet-stream'
    });
  }

  return attachments;
}

async function resolveAdminUsers(db) {
  try {
    if (!db.AdminUser || !db.Role) return [];

    const admins = await db.AdminUser.findAll({
      where: { status: 1 },
      include: [
        {
          model: db.Role,
          as: 'roles',
          where: { title: 'Admin' },
          attributes: ['id', 'title', 'status'],
          through: { attributes: [] },
          required: true
        }
      ]
    });

    return admins.map(admin => admin.toJSON());
  } catch (err) {
    logger.error(`resolveAdminUsers failed: ${err.message}`);
    return [];
  }
}

async function resolveUserData(db, template, data) {
  try {
    const record = data || {};

    if (template?.module === 'AdminUser' && template?.operation === 'create') {
      return record;
    }

    const ownerId = record.createdBy ?? record.modifyBy ?? record.modifiedBy ?? null;
    if (!ownerId || !db.AdminUser) {
      return record;
    }

    const user = await db.AdminUser.findByPk(ownerId);
    return user ? user.toJSON() : record;
  } catch (err) {
    logger.error(`resolveUserData failed: ${err.message}`);
    return data;
  }
}

async function createEmailLog(db, payload) {
  if (!db.EmailLog) return null;

  try {
    return await db.EmailLog.create(payload);
  } catch (err) {
    logger.error(`Email log create failed: ${err.message}`);
    return null;
  }
}

async function updateEmailLog(log, payload) {
  if (!log || typeof log.update !== 'function') return;

  try {
    await log.update(payload);
  } catch (err) {
    logger.error(`Email log update failed: ${err.message}`);
  }
}

async function handleEmailDispatch(db, template, instance, req, context = {}) {
  const record = getPlainRecord(instance);
  const previousRecord = context.previousRecord || {};
  const operation = context.operation || template.operation;
  const changedFields = context.changedFields || getChangedFields(record, previousRecord);
  const mailEnabled = String(template.mail ?? '1') !== '0';
  const emailField = template.attchment || template.attachment || null;

  const log = await createEmailLog(db, {
    email_template_id: template.id,
    module: template.module,
    operation: template.operation,
    record_id: record.id ?? null,
    user_id: record.createdBy ?? record.modifyBy ?? record.modifiedBy ?? null,
    details: {
      current: record,
      previous: previousRecord,
      changedFields
    },
    mail_triggered: false,
    status: mailEnabled ? 'pending' : 'skipped'
  });

  if (!mailEnabled) {
    return;
  }

  if (!shouldTriggerTemplate(template, operation, record, previousRecord)) {
    await updateEmailLog(log, { status: 'skipped' });
    return;
  }

  const userData = await resolveUserData(db, template, record);
  const admins = await resolveAdminUsers(db);
  const mailConfig = parseMailField(template.mailField);
  const attachments = await resolveAttachments(db, record, emailField);
  const mailTo = String(template.mailTo || 'all').toLowerCase();
  const attachmentTo = String(template.attchmentTo || 'all').toLowerCase();

  const sendResult = [];

  const sendWithSafety = async ({ to, subject, body, label, includeAttachments, mergeData = {} }) => {
    const recipient = Array.isArray(to) ? to.filter(Boolean) : to;
    const normalizedRecipient = normalizeRecipients(recipient);
    if (!normalizedRecipient || !isEmailLike(normalizedRecipient.split(',')[0])) {
      logger.warn(`Skipping ${label} mail because recipient is invalid: ${normalizedRecipient || '(empty)'}`);
      return false;
    }

    const resolvedSubject = replacePlaceholders(subject, {
      ...record,
      ...mergeData
    });
    const resolvedBody = replacePlaceholders(body, {
      ...record,
      ...mergeData
    });
    const mailAttachments = includeAttachments ? attachments : [];

    await sendMail({
      to: normalizedRecipient,
      subject: resolvedSubject,
      html: resolvedBody,
      attachments: mailAttachments
    });

    sendResult.push({ label, to: normalizedRecipient });
    return true;
  };

  if (mailTo === 'all' || mailTo === 'user') {
    const userConfig = mailConfig.user || {};
    const field = userConfig.field || 'email';
    const subject = userConfig.subject || template.userSubject || template.subject || template.module;
    const body = userConfig.body || template.userBody || '';
    const recipient = record[field];
    const includeAttachments = attachmentTo === 'all' || attachmentTo === 'user';

    if (recipient && body) {
      await sendWithSafety({
        to: recipient,
        subject,
        body,
        label: 'user',
        includeAttachments,
        mergeData: userData
      });
    }
  }

  if (mailTo === 'all' || mailTo === 'admin') {
    const adminConfig = mailConfig.admin || {};
    const field = adminConfig.field || 'email';
    const subject = adminConfig.subject || template.adminSubject || `[ADMIN] ${template.userSubject || template.subject || template.module}`;
    const body = adminConfig.body || template.adminBody || '';
    const includeAttachments = attachmentTo === 'all' || attachmentTo === 'admin';

    for (const admin of admins) {
      const recipient = admin[field];
      if (!recipient || !body) continue;

      await sendWithSafety({
        to: recipient,
        subject,
        body,
        label: 'admin',
        includeAttachments,
        mergeData: {
          ...userData,
          adminFirstName: admin.firstName || 'Admin',
          adminLastName: admin.lastName || '',
          adminEmail: admin.email || '',
          adminName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin'
        }
      });
    }
  }

  if (mailTo === 'all') {
    for (const [key, config] of Object.entries(mailConfig)) {
      if (['user', 'admin'].includes(key)) continue;
      if (!config?.field || !config?.subject || !config?.body) {
        continue;
      }

      const recipient = record[config.field];
      if (!recipient) continue;

      const includeAttachments = attachmentTo === 'all';
      await sendWithSafety({
        to: recipient,
        subject: config.subject,
        body: config.body,
        label: key,
        includeAttachments,
        mergeData: record
      });
    }
  }

  if (sendResult.length > 0) {
    await updateEmailLog(log, { mail_triggered: true, status: 'sent' });
    logger.info(`Mail dispatch completed for ${template.module}.${template.operation}`);
    return;
  }

  await updateEmailLog(log, { status: 'skipped' });
}

async function triggerMail(db, { modelName, instance, operation, req, previousRecord, changedFields }) {
  try {
    if (!db.EmailTemplate) return;

    const templates = await findEmailTemplatesForTrigger(db, {
      status: '1',
      [Op.or]: [
        { module: modelName },
        { module: '*' },
        { module: 'all' }
      ]
    });

    if (!templates.length) return;

    const matched = pickBestModelTemplate(templates, modelName, operation);

    if (!matched) return;

    runInBackground(
      () => handleEmailDispatch(db, matched, instance, req, { operation, previousRecord, changedFields }),
      `triggerMail ${modelName}.${operation}`
    );
  } catch (err) {
    logger.error(`triggerMail failed for ${modelName}.${operation}: ${err.message}`);
  }
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function operationScore(templateOperation, targetOperation) {
  if (isBlank(templateOperation)) return 10; // any operation
  return String(templateOperation).toLowerCase() === String(targetOperation || '').toLowerCase() ? 20 : -1;
}

function modelScore(templateModule, targetModel) {
  const moduleValue = String(templateModule || '').trim();
  if (!moduleValue) return -1;
  if (moduleValue.toLowerCase() === String(targetModel || '').toLowerCase()) return 40;
  if (moduleValue === '*' || moduleValue.toLowerCase() === 'all') return 20;
  return -1;
}

function pickBestModelTemplate(templates = [], modelName, operation) {
  let best = null;
  let bestScore = -1;
  for (const template of templates) {
    const mScore = modelScore(template.module, modelName);
    const oScore = operationScore(template.operation, operation);
    if (mScore < 0 || oScore < 0) continue;
    const total = mScore + oScore;
    if (total > bestScore || (total === bestScore && Number(template.id || 0) > Number(best?.id || 0))) {
      best = template;
      bestScore = total;
    }
  }
  return best;
}

function initMailHooks(db) {
  const skippedNameParts = ['log', 'template', 'view', 'sequelize'];
  const alreadyHooked = new Set();

  Object.keys(db).forEach(modelName => {
    const model = db[modelName];
    if (!model?.addHook) return;
    if (alreadyHooked.has(modelName)) return;

    const lower = modelName.toLowerCase();
    if (skippedNameParts.some(part => lower.includes(part))) return;

    alreadyHooked.add(modelName);

    model.addHook('afterCreate', async (instance, options) => {
      triggerMail(db, {
        modelName,
        instance,
        operation: 'create',
        req: options?.req || null
      }).catch(err => logger.error(`Mail hook failed for ${modelName}.create: ${err.message}`));
    });

    model.addHook('afterUpdate', async (instance, options) => {
      const previousRecord = { ...(instance?._previousDataValues || {}) };
      const changedFields = Array.isArray(options?.fields) ? options.fields : (typeof instance.changed === 'function' ? instance.changed() || [] : []);
      triggerMail(db, {
        modelName,
        instance,
        operation: 'update',
        req: options?.req || null,
        previousRecord,
        changedFields
      }).catch(err => logger.error(`Mail hook failed for ${modelName}.update: ${err.message}`));
    });

    model.addHook('afterDestroy', async (instance, options) => {
      triggerMail(db, {
        modelName,
        instance,
        operation: 'delete',
        req: options?.req || null
      }).catch(err => logger.error(`Mail hook failed for ${modelName}.delete: ${err.message}`));
    });
  });

  logger.info('Global mail hooks initialized');
}

module.exports = {
  initMailHooks,
  triggerMail,
  sendMail,
  replacePlaceholders
};
