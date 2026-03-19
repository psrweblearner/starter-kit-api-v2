const AWS = require('aws-sdk');

const ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const SECRET_KEY = process.env.AWS_SECRET_KEY;
const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_BUCKET;

// Initialize S3 client only if AWS is configured
let s3 = null;

if (ACCESS_KEY && SECRET_KEY && REGION && BUCKET) {
  try {
    s3 = new AWS.S3({
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      region: REGION
    });
  } catch (error) {
    console.warn('AWS S3 initialization failed:', error.message);
  }
}

module.exports = {
  getConfig: () => ({
    storageType: 'aws',
    bucket: BUCKET,
    maxFileSize: 50 * 1024 * 1024
  }),

  uploadFile: async (buffer, fileName, folder, meta) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    const Key = folder ? `${folder}/${fileName}` : fileName;

    await s3.putObject({
      Bucket: BUCKET,
      Key,
      Body: buffer,
      ContentType: meta.mimeType
    }).promise();

    return {
      success: true,
      fileUrl: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${Key}`,
      filePath: Key,
      fileSize: buffer.length,
      mimeType: meta.mimeType
    };
  },

  deleteFile: async (filePath) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    try {
      await s3.deleteObject({ Bucket: BUCKET, Key: filePath }).promise();
      return true;
    } catch (err) {
      console.error('AWS delete error:', err.message);
      return false;
    }
  },

  renameFile: async (oldPath, newPath) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    try {
      await s3.copyObject({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${oldPath}`,
        Key: newPath
      }).promise();

      await s3.deleteObject({ Bucket: BUCKET, Key: oldPath }).promise();
      return true;
    } catch (err) {
      console.error('AWS rename error:', err.message);
      return false;
    }
  },

  listFiles: async (folder, options = {}) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    try {
      const { page = 1, limit = 20 } = options;

      // Optimize AWS S3 listing with early pagination
      const allMixedItems = [];
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // Only fetch what we need for current page + small buffer
      const maxItemsToFetch = Math.min(endIndex + limit, 1000);

      const params = {
        Bucket: BUCKET,
        Prefix: folder,
        Delimiter: '/',
        MaxKeys: maxItemsToFetch // Limit items to what we actually need
      };

      const data = await s3.listObjectsV2(params).promise();

      // Process files
      if (data.Contents) {
        data.Contents.forEach(item => {
          if (item.Key !== folder + '/') {
            const fileName = item.Key.replace(folder + '/', '');
            allMixedItems.push({
              name: fileName,
              fullPath: item.Key,
              size: item.Size,
              modified: item.LastModified,
              created: item.LastModified, // S3 doesn't track creation date separately
              isFolder: false,
              type: 'file',
              fileUrl: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${item.Key}`
            });
          }
        });
      }

      // Process folders
      if (data.CommonPrefixes) {
        data.CommonPrefixes.forEach(prefix => {
          const folderName = prefix.Prefix.replace(folder + '/', '').replace('/', '');
          allMixedItems.push({
            name: folderName,
            fullPath: prefix.Prefix,
            isFolder: true,
            type: 'folder',
            created: new Date(), // S3 doesn't track folder creation separately
            modified: new Date()
          });
        });
      }


      // Sort items by creation date descending (newest first)
      allMixedItems.sort((a, b) => {
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

      // Apply pagination to mixed items
      const paginatedItems = allMixedItems.slice(startIndex, endIndex);

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
      console.error('AWS list error:', err.message);
      return { success: false, items: [] };
    }
  },

  searchFiles: async (query, options = {}) => {
    // For AWS S3, we would need to implement a more complex search
    // This is a simplified version that searches by prefix
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
        searchPrefix = currentFolder + '/';
      }

      const params = {
        Bucket: BUCKET,
        Prefix: searchPrefix,
        Delimiter: folderScope && currentFolder ? '/' : undefined, // Only direct children when folder scope is enabled
        MaxKeys: maxItemsToSearch // Limit search scope for better performance
      };

      const data = await s3.listObjectsV2(params).promise();

      if (data.Contents) {
        data.Contents.forEach(item => {
          const fileName = item.Key.split('/').pop();
          const isFolder = item.Key.endsWith('/');

          // Skip the folder marker itself
          if (isFolder && item.Key === searchPrefix) {
            return;
          }

          // When folder scope is enabled, ensure we only get direct children
          if (folderScope && currentFolder) {
            const relativePath = item.Key.replace(searchPrefix, '');
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
                fullPath: item.Key,
                size: item.Size,
                modified: item.LastModified,
                created: item.LastModified, // S3 doesn't track creation separately
                isFolder: isFolder,
                type: isFolder ? 'folder' : 'file',
                fileUrl: isFolder ? '' : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${item.Key}`,
                parentPath: item.Key.substring(0, item.Key.lastIndexOf('/'))
              });
            }
          }
        });
      }


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
      console.error('AWS search error:', err.message);
      return { success: false, items: [], error: err.message };
    }
  },

  createFolder: async (folderPath) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    try {
      // Ensure the path ends with a slash for folder marker
      const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
      await s3.putObject({ Bucket: BUCKET, Key: key }).promise();
      return true;
    } catch (err) {
      console.error('AWS createFolder error:', err.message);
      return false;
    }
  },

  deleteFolder: async (folderName) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    try {
      // List and delete all inside
      const data = await s3.listObjectsV2({ Bucket: BUCKET, Prefix: folderName }).promise();
      if (data.Contents.length > 0) {
        await s3.deleteObjects({
          Bucket: BUCKET,
          Delete: { Objects: data.Contents.map(item => ({ Key: item.Key })) }
        }).promise();
      }
      return true;
    } catch (err) {
      console.error('AWS deleteFolder error:', err.message);
      return false;
    }
  },

  renameFolder: async (oldName, newName) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }

    try {
      // Copy all objects
      const data = await s3.listObjectsV2({ Bucket: BUCKET, Prefix: oldName }).promise();
      for (const item of data.Contents) {
        const newKey = item.Key.replace(oldName, newName);
        await s3.copyObject({
          Bucket: BUCKET,
          CopySource: `${BUCKET}/${item.Key}`,
          Key: newKey
        }).promise();
        await s3.deleteObject({ Bucket: BUCKET, Key: item.Key }).promise();
      }
      return true;
    } catch (err) {
      console.error('AWS renameFolder error:', err.message);
      return false;
    }
  },

  getFileUrl: (filePath) => `https://${BUCKET}.s3.${REGION}.amazonaws.com/${filePath}`,

  getSignedUrl: async (filePath, expires = 300) => {
    if (!s3) {
      throw new Error('AWS S3 not properly configured. Please check your environment variables.');
    }
    return s3.getSignedUrlPromise('getObject', {
      Bucket: BUCKET,
      Key: filePath,
      Expires: expires
    });
  }
};
