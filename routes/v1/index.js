const express = require('express');
const router = express.Router();
const CTR = require('../../controller/v1');
const adminAuth = require('../../middleware/adminAuth');
const validate = require('../../middleware/validate');
const schema = require('../../validations');
// Public API
// http://localhost:5000/api/v1/admin-auth/login
router.route('/admin-auth/login').post(validate(schema.adminAuth.login), CTR.AdminAuth.login);
router.route('/admin-auth/refresh-token').post(CTR.AdminAuth.refreshToken);
router.route('/admin').get(CTR.Admin.findAll);
router.route('/admin/:id').get(CTR.Admin.findOne);
router.route('/admin-auth/switch-role').post(validate(schema.adminAuth.switchRole), CTR.AdminAuth.switchRole);


// http://localhost:5000/api/v1/blogs
router.get('/blogs', CTR.Blog.findAll);
router.get('/blogs/:id', CTR.Blog.findOne);

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