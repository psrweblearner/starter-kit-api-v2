const express = require('express');
const router = express.Router();
const CTR = require('../../controller/v1');
const adminAuth = require('../../middleware/adminAuth');
const userAuth = require('../../middleware/userAuth');
const AppError = require('../../utils/AppError');
const validate = require('../../middleware/validate');
const schema = require('../../validations');

const userAuthRouter = express.Router();

const protectUserOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }
  return next();
};
// Public API

// Tools
router.route('/competitor/analyze').post(validate(schema.audit.run), CTR.Audit.run);
router.route('/competitor/result/:jobId').get(CTR.Audit.getResult);
router.route('/competitor/result/:jobId/subscribe').get(CTR.Audit.subscribeResult);
router.route('/competitor/result/:jobId/clear-cache').post(CTR.Audit.clearResultCache);
router.route('/audit/run').post(validate(schema.audit.run), CTR.Audit.run);
router.route('/audit/section-narratives').post(CTR.Audit.sectionNarratives);
router.route('/audit/business-report').post(CTR.Audit.businessReport);
router.route('/audit/result/:jobId').get(CTR.Audit.getResult);
router.route('/audit/result/:jobId/subscribe').get(CTR.Audit.subscribeResult);
router.route('/audit/result/:jobId/clear-cache').post(CTR.Audit.clearResultCache);
router.route('/sitemap/generate').post(validate(schema.sitemap.generate), CTR.Sitemap.generate);
router.route('/sitemap/stop/:jobId').post(CTR.Sitemap.stop);
router.route('/sitemap/result/:jobId').get(CTR.Sitemap.getResult);
router.route('/sitemap/result/:jobId/clear-cache').post(CTR.Sitemap.clearResultCache);
router.route('/sitemap-automation/public/script.js').get(CTR['Sitemap-automation'].publicScript);
router.route('/sitemap-automation/public/config').get(CTR['Sitemap-automation'].publicConfig);
router.route('/sitemap-automation/public/ping').post(CTR['Sitemap-automation'].publicPing);
router
  .route('/sitemap-automation/site')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].upsertSite),
    CTR['Sitemap-automation'].upsertSite
  )
  .get(
    userAuth.identify,
    protectUserOrAdmin,
    CTR['Sitemap-automation'].listSites
  );
router
  .route('/sitemap-automation/site/check-eligibility')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].checkDomainEligibility),
    CTR['Sitemap-automation'].checkDomainEligibility
  );
router
  .route('/sitemap-automation/site/:id')
  .get(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].withSiteId),
    CTR['Sitemap-automation'].getSite
  )
  .delete(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].withSiteId),
    CTR['Sitemap-automation'].deleteSite
  );
router
  .route('/sitemap-automation/site/:id/generate-script')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].withSiteId),
    CTR['Sitemap-automation'].generateScript
  );
router
  .route('/sitemap-automation/site/:id/verify')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].withSiteId),
    CTR['Sitemap-automation'].verify
  );
router
  .route('/sitemap-automation/site/:id/schema')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].saveSchema),
    CTR['Sitemap-automation'].saveSchema
  );
router
  .route('/sitemap-automation/site/:id/cron')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].saveCron),
    CTR['Sitemap-automation'].saveCron
  );
router
  .route('/sitemap-automation/site/:id/publish-config')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].savePublishConfig),
    CTR['Sitemap-automation'].savePublishConfig
  );
router
  .route('/sitemap-automation/site/:id/run-now')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].withSiteId),
    CTR['Sitemap-automation'].runNow
  );
router
  .route('/sitemap-automation/site/:id/runs')
  .get(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['sitemap-automation'].withSiteId),
    CTR['Sitemap-automation'].getRuns
  );
router.route('/qr/generate').post(validate(schema.qr.generate), CTR.Qr.generate);
router.route('/qr/result/:jobId').get(CTR.Qr.getResult);
router.route('/qr/result/:jobId/clear-cache').post(CTR.Qr.clearResultCache);
router.route('/pagespeed/generate').post(validate(schema.pagespeed.generate), CTR.Pagespeed.generate);
router.route('/pagespeed/result/:jobId').get(CTR.Pagespeed.getResult);
router.route('/pagespeed/result/:jobId/clear-cache').post(CTR.Pagespeed.clearResultCache);
router
  .route('/url-opener/groups')
  .post(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['url-opener'].create),
    CTR['Url-opener'].create
  )
  .get(
    userAuth.identify,
    protectUserOrAdmin,
    CTR['Url-opener'].findAll
  );
router
  .route('/url-opener/groups/:id')
  .get(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['url-opener'].withId),
    CTR['Url-opener'].findOne
  )
  .put(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['url-opener'].update),
    CTR['Url-opener'].update
  )
  .delete(
    userAuth.identify,
    protectUserOrAdmin,
    validate(schema['url-opener'].withId),
    CTR['Url-opener'].remove
  );
router
  .route('/cold-outreach/rules')
  .post(
    validate(schema['cold-outreach'].createRule),
    CTR['Cold-outreach'].createRule
  )
  .get(
    CTR['Cold-outreach'].listRules
  );
router
  .route('/cold-outreach/rules/:id/run')
  .post(
    validate(schema['cold-outreach'].withId),
    CTR['Cold-outreach'].runRule
  );
router
  .route('/cold-outreach/rules/:id')
  .get(
    validate(schema['cold-outreach'].withId),
    CTR['Cold-outreach'].getRule
  )
  .delete(
    validate(schema['cold-outreach'].withId),
    CTR['Cold-outreach'].deleteRule
  );
router
  .route('/cold-outreach/leads')
  .get(
    validate(schema['cold-outreach'].listLeads),
    CTR['Cold-outreach'].listLeads
  );
router
  .route('/cold-outreach/leads/export')
  .get(
    CTR['Cold-outreach'].exportLeadsCsv
  );
// http://localhost:5000/v1/admin-auth/login
router.route('/admin-auth/login').post(validate(schema.adminAuth.login), CTR.AdminAuth.login);
router.route('/admin-auth/refresh-token').post(CTR.AdminAuth.refreshToken);
router.route('/admin').get(CTR.Admin.findAll);
router.route('/admin/:id').get(CTR.Admin.findOne);
router.route('/admin-auth/switch-role').post(validate(schema.adminAuth.switchRole), CTR.AdminAuth.switchRole);
router.route('/admin-auth/forget-password').post(validate(schema.adminAuth.forget), CTR.AdminAuth.forget);
router.route('/admin-auth/verify-otp').post(validate(schema.adminAuth.verifyOtp), CTR.AdminAuth.verifyOtp);
router.route('/admin-auth/reset-password').post(validate(schema.adminAuth.resetPassword), CTR.AdminAuth.resetPassword);

// http://localhost:5000/api/v1/blogs
router.get('/blogs', CTR.Blog.findAll);
router.get('/blogs/:id', CTR.Blog.findOne);

userAuthRouter.route('/register').post(validate(schema.userAuth.register), CTR.UserAuth.register);
userAuthRouter.route('/login').post(validate(schema.userAuth.login), CTR.UserAuth.login);
userAuthRouter.route('/refresh-token').post(CTR.UserAuth.refreshToken);
userAuthRouter.route('/forget-password').post(validate(schema.userAuth.forget), CTR.UserAuth.forget);
userAuthRouter.route('/verify-otp').post(validate(schema.userAuth.verifyOtp), CTR.UserAuth.verifyOtp);
userAuthRouter.route('/reset-password').post(validate(schema.userAuth.resetPassword), CTR.UserAuth.resetPassword);

// Protected user-auth routes only
// NOTE:
// - app.js already runs adminAuth.identify globally, so admin sessions set req.user.
// - here we also identify user sessions, then allow either authenticated user or admin.
userAuthRouter.use(userAuth.identify);
userAuthRouter.use(protectUserOrAdmin);
userAuthRouter.route('/auth-info').get(CTR.UserAuth.authInfo);
// userAuthRouter.route('/users').post(CTR.User.create).get(CTR.User.findAll);
// userAuthRouter.route('/users/:id').get(CTR.User.findOne).put(CTR.User.update).patch(CTR.User.update);

router.use('/user-auth', userAuthRouter);




// Admin API
router.use(adminAuth.protect);

// http://localhost:5000/api/v1/admin-auth/register
router.route('/admin-auth/register').post(validate(schema.adminAuth.register), CTR.AdminAuth.register);
router.route('/admin-auth/auth-info').get(CTR.AdminAuth.authInfo);
router.route('/admin/:id').put(CTR.Admin.update).delete(CTR.Admin.delete);
router.route('/admin/:id/status').patch(CTR.Admin.toggle);
router.post('/assign-role-user', CTR.Admin.assignRoleUser);
router.post('/assign-special-permissions', CTR.Admin.assignSpecialPermission);
router.delete('/reset-special-permissions', CTR.Admin.resetSpecialPermissions);

router.route('/users').get(CTR.User.findAll);
router.route('/users/:id').get(CTR.User.findOne);
// http://localhost:5000/api/v1/roles
router.route('/roles').post(CTR.Roles.create).get(CTR.Roles.findAll);
router.route('/roles/:id').get(CTR.Roles.findOne).delete(CTR.Roles.remove);
router.patch('/roles/:id/status', CTR.Roles.updateStatus);
router.post('/assign-page-role', CTR.Roles.roleSubmenuAssign);

// http://localhost:5000/api/v1/api-client/
router.route('/api-client').post(validate(schema.apiclient.create), CTR.Apiclient.create).get(CTR.Apiclient.findAll);
router.route('/api-client/:id').get(CTR.Apiclient.findOne).patch(CTR.Apiclient.update).delete(CTR.Apiclient.delete);


//http://localhost:5000/api/v1/cache-config
router.route('/cache-config').get(CTR.CacheConfig.findAll).post(CTR.CacheConfig.upsert);
router.route('/cache-config/:scope/toggle').patch(CTR.CacheConfig.toggle);
router.route('/queue/monitor').get(CTR.Queue.monitor);


// http://localhost:5000/api/v1/blogs
router.route('/blogs').post(CTR.Blog.create);
router.route('/blogs/:id').put(CTR.Blog.update).delete(CTR.Blog.remove);
router.patch('/blogs/:id/status', CTR.Blog.updateStatus);

// http://localhost:5000/api/v1/menu (Methods [GET,POST,PUT,DELETE]);
router.route('/menu').post(CTR.Menu.create).get(CTR.Menu.findAll);
router.route('/menu/:id').get(CTR.Menu.findOne).put(CTR.Menu.update).delete(CTR.Menu.remove);
router.patch('/menu/:id/status', CTR.Menu.updateStatus);
router.get('/assign-menu-assignments', CTR.Menu.findAssignMenu);
router.post('/save-menu-submenu', CTR.Menu.assign_subMenu);

// http://localhost:5000/api/v1/sub-menu (Methods [GET,POST,PUT,DELETE]);
router.route('/sub-menu').post(CTR.SubMenu.create).get(CTR.SubMenu.findAll);
router.route('/sub-menu/:id').get(CTR.SubMenu.findOne).put(CTR.SubMenu.update).delete(CTR.SubMenu.remove);
router.patch('/sub-menu/:id/status', CTR.SubMenu.updateStatus);

// http://localhost:5000/api/v1/folders (Methods [GET,POST,DELETE]);
router.route('/folders').post(CTR.FileManager.createFolder).get(CTR.FileManager.findAllFolder);
router.delete('/folders/:id', CTR.FileManager.removeFolder);
router.put('/folders/rename', CTR.FileManager.renameFolder);

// http://localhost:5000/api/v1/files (Methods [GET,POST]);
router.route('/files').get(CTR.FileManager.findAllFiles).post(CTR.FileManager.upload.single('file'), CTR.FileManager.uploadFile);
router.delete('/files/:fileId', CTR.FileManager.deleteFile);
router.put('/files/rename', CTR.FileManager.renameFile);
router.get('/files/search', CTR.FileManager.searchFiles);

router.post('/files/upload-chunk', CTR.FileManager.uploadChunkFile);
router.post('/files/merge-chunks', CTR.FileManager.mergeChunksFile);
router.post('/files/download-zip', CTR.FileManager.downloadZip);

// storage info and sync
router.get('/storage/info', CTR.FileManager.getStorageInfo);
router.post('/storage/sync', CTR.FileManager.syncStorage);

// http://localhost:5000/api/v1/settings (Methods [GET,POST,PUT,DELETE]);
router.route('/settings').post(CTR.Setting.create).get(CTR.Setting.findAll);
router.route('/settings/:id').get(CTR.Setting.findOne).put(CTR.Setting.update).delete(CTR.Setting.remove);
router.patch('/settings/:id/status', CTR.Setting.updateStatus);


// http://localhost:5000/api/v1/categories (Methods [GET,POST,PUT,DELETE]);
router.post('/categories', CTR.Category.create);
router.get('/categories', CTR.Category.findAll);
router.get('/categories/:id', CTR.Category.findOne);
router.put('/categories/:id', CTR.Category.update);
router.patch('/categories/:id/status', CTR.Category.updateStatus);
router.delete('/categories/:id', CTR.Category.remove);

// http://localhost:5000/api/v1/tags (Methods [GET,POST,PUT,DELETE]);
router.post('/tags', CTR.Tags.create);
router.get('/tags', CTR.Tags.findAll);
router.get('/tags/:id', CTR.Tags.findOne);
router.put('/tags/:id', CTR.Tags.update);
router.patch('/tags/:id/status', CTR.Tags.updateStatus);
router.delete('/tags/:id', CTR.Tags.remove);

// http://localhost:5000/api/v1/gallery (Methods [GET,POST,PUT,DELETE]);
router.post('/gallery', CTR.Gallery.create);
router.get('/gallery', CTR.Gallery.findAll);
router.route('/gallery/:id').put(CTR.Gallery.update).delete(CTR.Gallery.remove).get(CTR.Gallery.findOne);
router.patch('/gallery/:id/status', CTR.Gallery.updateStatus);

// http://localhost:5000/api/v1/faq (Methods [GET,POST,PUT,DELETE]);
router.post('/faq', CTR.Faq.create);
router.get('/faq', CTR.Faq.findAll);
router.route('/faq/:id').put(CTR.Faq.update).delete(CTR.Faq.remove).get(CTR.Faq.findOne);
router.patch('/faq/:id/status', CTR.Faq.updateStatus);


// http://localhost:5000/api/v1/city (Methods [GET,POST,PUT,DELETE]);
router.post('/city', CTR.City.create);
router.get('/city', CTR.City.findAll);
router.get('/city/:id', CTR.City.findOne);
router.put('/city/:id', CTR.City.update);
router.patch('/city/:id/status', CTR.City.updateStatus);
router.delete('/city/:id', CTR.City.remove);

// http://localhost:5000/api/v1/developer (Methods [GET,POST,PUT,DELETE]);
router.post('/developer', CTR.Developer.create);
router.get('/developer', CTR.Developer.findAll);
router.get('/developer/:id', CTR.Developer.findOne);
router.put('/developer/:id', CTR.Developer.update);
router.patch('/developer/:id/status', CTR.Developer.updateStatus);
router.delete('/developer/:id', CTR.Developer.remove);

// http://localhost:5000/api/v1/property-type (Methods [GET,POST,PUT,DELETE]);
router.post('/property-type', CTR.PropertyType.create);
router.get('/property-type', CTR.PropertyType.findAll);
router.get('/property-type/:id', CTR.PropertyType.findOne);
router.put('/property-type/:id', CTR.PropertyType.update);
router.patch('/property-type/:id/status', CTR.PropertyType.updateStatus);
router.delete('/property-type/:id', CTR.PropertyType.remove);

// http://localhost:5000/api/v1/amenities (Methods [GET,POST,PUT,DELETE]);
router.post('/amenities', CTR.Amenities.create);
router.get('/amenities', CTR.Amenities.findAll);
router.get('/amenities/:id', CTR.Amenities.findOne);
router.put('/amenities/:id', CTR.Amenities.update);
router.patch('/amenities/:id/status', CTR.Amenities.updateStatus);
router.delete('/amenities/:id', CTR.Amenities.remove);


// http://localhost:5000/api/v1/floor-plan (Methods [GET,POST,PUT,DELETE]);
router.post('/floor-plan', CTR.FloorPlan.create);
router.get('/floor-plan', CTR.FloorPlan.findAll);
router.get('/floor-plan/:id', CTR.FloorPlan.findOne);
router.put('/floor-plan/:id', CTR.FloorPlan.update);
router.patch('/floor-plan/:id/status', CTR.FloorPlan.updateStatus);
router.delete('/floor-plan/:id', CTR.FloorPlan.remove);

// http://localhost:5000/api/v1/email-template (Methods [GET,POST,PUT,DELETE]);
router.route('/email-template').post(CTR.EmailTemplate.create).get(CTR.EmailTemplate.findAll);
router.route('/email-template/:id').get(CTR.EmailTemplate.findOne).put(CTR.EmailTemplate.update).delete(CTR.EmailTemplate.remove);
router.patch('/email-template/:id/status',CTR.EmailTemplate.updateStatus);

// http://localhost:5000/admin-api/models (Methods [GET]);
router.get('/models',CTR.Models.findAllModels);
router.get('/models/:name/fields',CTR.Models.findModelFields);
module.exports = router;
