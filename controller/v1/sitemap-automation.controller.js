const catchAsync = require('../../utils/catchAsync');
const services = require('../../services/v1');
const { getUserIdFromReq } = require('../../services/v1/sitemap-automation/shared');

function automationService() {
  return services['sitemap-automation'];
}

exports.upsertSite = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().upsertSiteConfig({
    userId,
    ...req.body,
  });
  return res.status(200).json({
    success: true,
    message: 'Automation site saved successfully',
    data,
  });
});

exports.listSites = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().listSites({ userId });
  return res.status(200).json({
    success: true,
    message: 'Automation sites fetched successfully',
    data,
  });
});

exports.getSite = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().getSiteConfig({
    userId,
    siteId: req.params.id,
  });
  return res.status(200).json({
    success: true,
    message: 'Automation site fetched successfully',
    data,
  });
});

exports.deleteSite = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().deleteSite({
    userId,
    siteId: req.params.id,
  });
  return res.status(200).json({
    success: true,
    message: 'Automation site deleted successfully',
    data,
  });
});

exports.generateScript = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().generateInstallScript({
    userId,
    siteId: req.params.id,
  });
  return res.status(200).json({
    success: true,
    message: 'Install script generated successfully',
    data,
  });
});

exports.verify = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().verifySiteConnection({
    userId,
    siteId: req.params.id,
  });
  return res.status(200).json({
    success: true,
    message: 'Site verification completed',
    data,
  });
});

exports.checkDomainEligibility = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().checkDomainEligibility({
    userId,
    domain: req.body.domain,
  });
  return res.status(200).json({
    success: true,
    message: 'Domain eligibility check completed',
    data,
  });
});

exports.saveSchema = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().saveSchemaMarkup({
    userId,
    siteId: req.params.id,
    schemaMarkupText: req.body.schemaMarkupText,
  });
  return res.status(200).json({
    success: true,
    message: 'Schema markup saved successfully',
    data,
  });
});

exports.saveCron = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().setCronExpression({
    userId,
    siteId: req.params.id,
    cronExpression: req.body.cronExpression,
  });
  return res.status(200).json({
    success: true,
    message: 'Cron schedule updated successfully',
    data,
  });
});

exports.savePublishConfig = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().savePublishConfig({
    userId,
    siteId: req.params.id,
    publishEndpoint: req.body.publishEndpoint,
    publishSecret: req.body.publishSecret,
    publishPath: req.body.publishPath,
  });
  return res.status(200).json({
    success: true,
    message: 'Publish sync configuration updated',
    data,
  });
});

exports.runNow = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().runNow({
    userId,
    siteId: req.params.id,
  });
  return res.status(200).json({
    success: true,
    message: 'Automation run queued successfully',
    data,
  });
});

exports.getRuns = catchAsync(async (req, res) => {
  const userId = getUserIdFromReq(req);
  const data = await automationService().listRuns({
    userId,
    siteId: req.params.id,
  });
  return res.status(200).json({
    success: true,
    message: 'Automation runs fetched successfully',
    data,
  });
});

exports.publicConfig = catchAsync(async (req, res) => {
  const data = await automationService().getPublicSiteConfig({
    siteId: req.query.siteId,
    token: req.query.token,
    host: req.query.host,
  });
  return res.status(200).json({
    success: true,
    message: 'Public automation config fetched',
    data,
  });
});

exports.publicPing = catchAsync(async (req, res) => {
  const data = await automationService().markPublicScriptPing({
    siteId: req.body?.siteId,
    token: req.body?.token,
    host: req.body?.host,
  });
  return res.status(200).json({
    success: true,
    message: 'Public script ping accepted',
    data,
  });
});

exports.publicScript = catchAsync(async (req, res) => {
  const siteId = String(req.query.siteId || '').trim();
  const token = String(req.query.token || '').trim();
  const apiHost = String(process.env.API_HOST || 'http://localhost:5000').replace(/\/+$/, '');
  const js = [
    '(function () {',
    '  try {',
    "    var siteId = '" + siteId.replace(/'/g, '') + "';",
    "    var token = '" + token.replace(/'/g, '') + "';",
    '    if (!siteId || !token) return;',
    "    var host = window.location.host || window.location.hostname || '';",
    "    var configUrl = '" + apiHost + "/v1/sitemap-automation/public/config?siteId=' + encodeURIComponent(siteId) + '&token=' + encodeURIComponent(token) + '&host=' + encodeURIComponent(host);",
    "    var pingUrl = '" + apiHost + "/v1/sitemap-automation/public/ping';",
    '    fetch(configUrl, { method: "GET", credentials: "omit" })',
    '      .then(function (res) { return res.ok ? res.json() : null; })',
    '      .then(function (payload) {',
    '        if (!payload || !payload.data) return;',
    '        var data = payload.data;',
    "        if (data.schemaAppliedStatus === 'applied' && data.schemaMarkupText) {",
    "          var existing = document.querySelector('script[data-rankpilot-schema=\"1\"]');",
    '          if (!existing) {',
    '            var schemaScript = document.createElement("script");',
    '            schemaScript.type = "application/ld+json";',
    "            schemaScript.setAttribute('data-rankpilot-schema', '1');",
    '            schemaScript.text = data.schemaMarkupText;',
    '            document.head.appendChild(schemaScript);',
    '          }',
    '        }',
    "        fetch(pingUrl, {",
    '          method: "POST",',
    '          headers: { "Content-Type": "application/json" },',
    '          body: JSON.stringify({ siteId: siteId, token: token, host: host })',
    '        }).catch(function () {});',
    '      })',
    '      .catch(function () {});',
    '  } catch (_e) {}',
    '})();',
  ].join('\n');

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.status(200).send(js);
});
