const { providers } = require('./providerFactory');
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const activeProvider = providers[STORAGE_TYPE];
if (!activeProvider) {
  throw new Error(`Invalid STORAGE_TYPE: ${STORAGE_TYPE}`);
}
module.exports = {
  getProviderName: () => STORAGE_TYPE,
  getConfig: () => activeProvider.getConfig(),
  uploadFile: (...args) => activeProvider.uploadFile(...args),
  deleteFile: (...args) => activeProvider.deleteFile(...args),
  renameFile: (...args) => activeProvider.renameFile(...args),
  listFiles: (...args) => activeProvider.listFiles(...args),
  createFolder: (...args) => activeProvider.createFolder(...args),
  deleteFolder: (...args) => activeProvider.deleteFolder(...args),
  renameFolder: (...args) => activeProvider.renameFolder(...args),
  getFileUrl: (...args) => activeProvider.getFileUrl(...args),
  searchFiles: (...args) => activeProvider.searchFiles(...args),
  getSignedUrl: (...args) => activeProvider.getSignedUrl(...args),
};
