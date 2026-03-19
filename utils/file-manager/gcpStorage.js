const { Storage } = require('@google-cloud/storage');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const BUCKET = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
const KEYFILE = process.env.GOOGLE_CLOUD_KEY_FILE; // path to service account JSON

// Initialize storage client only if GCP is configured
let storage = null;
let bucket = null;

if (PROJECT_ID && BUCKET) {
  try {
    storage = new Storage({ projectId: PROJECT_ID, keyFilename: KEYFILE });
    bucket = storage.bucket(BUCKET);
  } catch (error) {
    console.warn('GCP Storage initialization failed:', error.message);
  }
}

module.exports = {
  getConfig: () => ({ storageType: 'gcp', bucket: BUCKET, projectId: PROJECT_ID, maxFileSize: 50 * 1024 * 1024 }),
  uploadFile: async (buffer, fileName, folder, meta) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }
    const destination = folder ? `${folder}/${fileName}` : fileName;
    const file = bucket.file(destination);
    await file.save(buffer, { contentType: meta.mimeType, resumable: false });
    return { success: true, fileUrl: `https://storage.googleapis.com/${BUCKET}/${destination}`, filePath: destination, fileSize: buffer.length, mimeType: meta.mimeType };
  },
  deleteFile: async (filePath) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    try {
      await bucket.file(filePath).delete();
      return true;
    } catch (err) {
      console.error('GCP delete error:', err.message);
      return false;
    }
  },

  renameFile: async (oldPath, newPath) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    try {
      await bucket.file(oldPath).move(newPath);
      return true;
    } catch (err) {
      console.error('GCP rename error:', err.message);
      return false;
    }
  },
  listFiles: async (folder = '', options = {}) => {
    if (!bucket) throw new Error('GCP Storage not properly configured.');

    try {
      const { page = 1, limit = 100 } = options;
      const prefix = folder ? folder.replace(/\/$/, '') + '/' : '';

      // Fetch all files under this prefix
      const [files] = await bucket.getFiles({
        prefix,
        autoPaginate: true,
        delimiter: undefined // Important: fetch all files, not just folders
      });

      const allMixedItems = [];
      const folderMap = new Map(); // To keep track of pseudo folders

      files.forEach(file => {
        const parts = file.name.split('/');
        const fileName = parts.pop();
        let currentPath = '';

        // Create folder structure from file path
        parts.forEach(part => {
          currentPath += part + '/';
          if (!folderMap.has(currentPath)) {
            folderMap.set(currentPath, {
              name: part,
              fullPath: currentPath.replace(/\/$/, ''),
              isFolder: true,
              type: 'folder',
              created: new Date(),
              modified: new Date()
            });
          }
        });

        // Add file
        allMixedItems.push({
          name: fileName,
          fullPath: file.name,
          size: parseInt(file.metadata.size, 10) || 0,
          modified: file.metadata.updated ? new Date(file.metadata.updated) : new Date(),
          created: file.metadata.timeCreated ? new Date(file.metadata.timeCreated) : new Date(),
          isFolder: false,
          type: 'file',
          fileUrl: `https://storage.googleapis.com/${BUCKET}/${file.name}`
        });
      });

      // Add folders to the list
      allMixedItems.push(...folderMap.values());

      // Sort by most recent (created or modified)
      allMixedItems.sort((a, b) => {
        const dateA = Math.max(a.created?.getTime() || 0, a.modified?.getTime() || 0);
        const dateB = Math.max(b.created?.getTime() || 0, b.modified?.getTime() || 0);
        return dateB - dateA;
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedItems = allMixedItems.slice(startIndex, startIndex + limit);

      return {
        success: true,
        items: paginatedItems,
        totalItems: allMixedItems.length,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(allMixedItems.length / limit),
          totalItems: allMixedItems.length,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(allMixedItems.length / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (err) {
      console.error('GCP listFiles error:', err);
      return { success: false, items: [] };
    }
  },
  searchFiles: async (query, options = {}) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    try {
      const {
        page = 1,
        limit = 20,
        fileType = 'all',
        folderScope = false,
        exactMatch = false,
        currentFolder = ''
      } = options;

      const searchTerm = exactMatch ? query : query.toLowerCase();
      const maxResults = 500; // Limit total results for faster performance

      // Optimize search by limiting results early
      const allResults = [];
      const maxItemsToSearch = Math.min(maxResults * 3, 1000); // Search 3x more than needed for better results

      // Determine search prefix based on folder scope
      let searchPrefix = '';
      if (folderScope && currentFolder) {
        // When searching in current folder, only look for direct children
        searchPrefix = `${currentFolder}/`;
      }

      const queryOptions = {
        prefix: searchPrefix,
        delimiter: folderScope && currentFolder ? '/' : undefined, // Only direct children when folder scope is enabled
        maxResults: maxItemsToSearch // Limit search scope for better performance
      };

      const [files, , apiResponse] = await bucket.getFiles(queryOptions);

      files.forEach(file => {
        const fileName = file.name.split('/').pop();
        const isFolder = file.name.endsWith('/');

        // Skip the folder marker itself
        if (isFolder && file.name === searchPrefix) {
          return;
        }

        // When folder scope is enabled, ensure we only get direct children
        if (folderScope && currentFolder) {
          const relativePath = file.name.replace(searchPrefix, '');
          if (relativePath.includes('/')) {
            return; // Skip nested items
          }
        }

        // Check if item matches search term based on exact match setting
        const matchesSearch = exactMatch ?
          fileName === searchTerm :
          fileName.toLowerCase().includes(searchTerm);

        if (matchesSearch) {
          // Check file type filter
          if ((fileType === 'all') ||
            (fileType === 'files' && !isFolder) ||
            (fileType === 'folders' && isFolder)) {

            allResults.push({
              name: fileName,
              fullPath: file.name,
              size: parseInt(file.metadata.size, 10) || 0,
              modified: file.metadata.updated ? new Date(file.metadata.updated) : new Date(),
              created: file.metadata.timeCreated ? new Date(file.metadata.timeCreated) : new Date(),
              isFolder: isFolder,
              type: isFolder ? 'folder' : 'file',
              fileUrl: isFolder ? '' : `https://storage.googleapis.com/${BUCKET}/${file.name}`,
              parentPath: file.name.substring(0, file.name.lastIndexOf('/'))
            });
          }
        }
      });


      // Sort by creation date descending (newest first)
      allResults.sort((a, b) => {
        // Get the most recent date between created and modified for each item
        const dateA = new Date(Math.max(
          new Date(a.created || 0).getTime(),
          new Date(a.modified || 0).getTime()
        ));
        const dateB = new Date(Math.max(
          new Date(b.created || 0).getTime(),
          new Date(b.modified || 0).getTime()
        ));

        // For descending order (newest first), we want dateB - dateA
        return dateB.getTime() - dateA.getTime();
      });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = allResults.slice(startIndex, endIndex);

      return {
        success: true,
        items: paginatedResults,
        totalItems: allResults.length,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(allResults.length / limit),
          totalItems: allResults.length,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(allResults.length / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (err) {
      console.error('GCP search error:', err.message);
      return { success: false, items: [], error: err.message };
    }
  },

  createFolder: async (folderPath) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    try {
      // Ensure the path ends with a slash for folder marker
      const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
      const file = bucket.file(key);
      await file.save('');
      return true;
    } catch (err) {
      console.error('GCP createFolder error:', err.message);
      return false;
    }
  },

  deleteFolder: async (folderName) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    try {
      await bucket.deleteFiles({ prefix: `${folderName}/` });
      return true;
    } catch (err) {
      console.error('GCP deleteFolder error:', err.message);
      return false;
    }
  },

  renameFolder: async (oldName, newName) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    try {
      const [files] = await bucket.getFiles({ prefix: `${oldName}/` });
      for (const f of files) {
        const newKey = f.name.replace(oldName, newName);
        await f.move(newKey);
      }
      return true;
    } catch (err) {
      console.error('GCP renameFolder error:', err.message);
      return false;
    }
  },

  getFileUrl: (filePath) => `https://storage.googleapis.com/${BUCKET}/${filePath}`,

  getSignedUrl: async (filePath, expires = 300) => {
    if (!bucket) {
      throw new Error('GCP Storage not properly configured. Please check your environment variables.');
    }

    const [url] = await bucket.file(filePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (expires * 1000)
    });
    return url;
  }
};
