const fs = require('fs');
const path = require('path');
const glob = require('glob');
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

module.exports = {
  getConfig: () => ({
    storageType: 'local',
    basePath: UPLOAD_DIR,
    maxFileSize: 50 * 1024 * 1024
  }),

  uploadFile: async (buffer, fileName, folder, meta) => {
    // Handle root directory upload (when folder is undefined or empty)
    const folderPath = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fullPhysicalPath = path.join(folderPath, fileName);
    fs.writeFileSync(fullPhysicalPath, buffer);

    // Generate correct file URL based on whether it's in a folder or root
    const fileUrl = folder ? `/uploads/${folder}/${fileName}` : `/uploads/${fileName}`;
    const filePath = folder ? `/uploads/${folder}/${fileName}` : `/uploads/${fileName}`;

    return {
      success: true,
      fileUrl: fileUrl,
      filePath: filePath,
      fileSize: buffer.length,
      mimeType: meta.mimeType
    };
  },

  deleteFile: async (filePath) => {
    try {
      fs.unlinkSync(path.join(UPLOAD_DIR, filePath));
      return true;
    } catch {
      return false;
    }
  },

  renameFile: async (oldPath, newPath) => {
    try {
      fs.renameSync(path.join(UPLOAD_DIR, oldPath), path.join(UPLOAD_DIR, newPath));
      return true;
    } catch {
      return false;
    }
  },

  listFiles: async (folder = "", options = {}) => {
    try {
      const folderPath = path.join(UPLOAD_DIR, folder);

      if (!fs.existsSync(folderPath)) {
        return { success: true, items: [], totalItems: 0 };
      }

      const { page = 1, limit = 20 } = options;

      // Get all items first to calculate totals
      const allItems = fs.readdirSync(folderPath, { withFileTypes: true });

      const allMixedItems = [];

      // Process ALL items first to get complete dataset for proper sorting
      for (const item of allItems) {
        const itemRelativePath = path.join(folder, item.name).replace(/\\/g, '/');
        const dbPath = `/uploads/${itemRelativePath}`;

        if (item.isDirectory()) {
          // Get actual folder stats for proper sorting
          try {
            const itemFullPath = path.join(folderPath, item.name);
            const stats = fs.statSync(itemFullPath);

            // Use birthtime if available, otherwise use mtime for creation date
            const createdDate = stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime : stats.mtime;

            allMixedItems.push({
              name: item.name,
              fullPath: dbPath,
              isFolder: true,
              type: 'folder',
              created: createdDate,
              modified: stats.mtime
            });

            // Debug: Log folder dates
            console.log(`FOLDER: ${item.name} - Created: ${createdDate.toISOString()} - Modified: ${stats.mtime.toISOString()}`);
          } catch (statError) {
            // If stats fail, use current time
            const currentTime = new Date();
            allMixedItems.push({
              name: item.name,
              fullPath: dbPath,
              isFolder: true,
              type: 'folder',
              created: currentTime,
              modified: currentTime
            });

            console.log(`FOLDER (ERROR): ${item.name} - Using current time: ${currentTime.toISOString()}`);
          }
        } else {
          // Only get stats for files when needed
          try {
            const itemFullPath = path.join(folderPath, item.name);
            const stats = fs.statSync(itemFullPath);

            // Use birthtime if available, otherwise use mtime for creation date
            const createdDate = stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime : stats.mtime;

            allMixedItems.push({
              name: item.name,
              fullPath: dbPath,
              size: stats.size,
              modified: stats.mtime,
              created: createdDate,
              isFolder: false,
              type: 'file',
              fileUrl: dbPath
            });

            // Debug: Log file dates
            console.log(`FILE: ${item.name} - Created: ${createdDate.toISOString()} - Modified: ${stats.mtime.toISOString()}`);
          } catch (statError) {
            // If stats fail, create a minimal file object
            const currentTime = new Date();
            allMixedItems.push({
              name: item.name,
              fullPath: dbPath,
              size: 0,
              modified: currentTime,
              created: currentTime,
              isFolder: false,
              type: 'file',
              fileUrl: dbPath
            });

            console.log(`FILE (ERROR): ${item.name} - Using current time: ${currentTime.toISOString()}`);
          }
        }
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
        const result = dateB.getTime() - dateA.getTime();

        // Debug: Log the sorting for first few items
        console.log(`SORTING: ${a.name} (${dateA.toISOString()}) vs ${b.name} (${dateB.toISOString()}) = ${result}`);

        return result;
      });

      // Debug: Show first 5 items after sorting
      console.log('FIRST 5 ITEMS AFTER SORTING:');
      allMixedItems.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} - Created: ${item.created} - Modified: ${item.modified}`);
      });

      // Now apply pagination AFTER sorting to get the correct items for this page
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = allMixedItems.slice(startIndex, endIndex);

      // Use total items count for accurate pagination
      const totalItems = allItems.length;

      return {
        success: true,
        items: paginatedItems,
        totalItems: totalItems,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems: totalItems,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalItems / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error in listFiles:', error);
      return {
        success: false,
        items: [],
        error: error.message
      };
    }
  },

  searchFiles: async (query, options = {}) => {
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
      const allResults = [];
      const maxDepth = 2; // Reduced depth for faster search
      const maxResults = 500; // Reduced results for faster response

      // Determine search base directory
      const searchBaseDir = folderScope && currentFolder ? path.join(UPLOAD_DIR, currentFolder) : UPLOAD_DIR;

      // Debug logging for folder scope
      console.log('=== SEARCH DEBUG ===');
      console.log('Query:', query, '| Folder Scope:', folderScope, '| Current Folder:', currentFolder);
      console.log('Search Base Dir:', searchBaseDir);

      if (!fs.existsSync(searchBaseDir)) {
        return {
          success: true,
          items: [],
          totalItems: 0,
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }

      // Fast search using glob patterns
      try {
        const globOptions = {
          cwd: searchBaseDir,
          ignore: ['node_modules/**', '.git/**'],
          maxDepth: maxDepth
        };

        console.log('Glob options:', globOptions);

        let files = [];
        let dirs = [];

        // Search for files based on file type filter
        if (fileType === 'all' || fileType === 'files') {
          if (folderScope && currentFolder) {
            // When searching in current folder, only look for direct children
            const filePattern = exactMatch ? searchTerm : `*${searchTerm}*`;
            console.log('Using file pattern (folder scope):', filePattern);
            files = glob.sync(filePattern, {
              ...globOptions,
              nodir: true
            });
          } else {
            // Search recursively in all folders
            // For root level files, we need both patterns: direct match and nested match
            const filePattern1 = exactMatch ? searchTerm : `*${searchTerm}*`;
            const filePattern2 = exactMatch ? `**/${searchTerm}` : `**/*${searchTerm}*`;
            console.log('Using file patterns (global):', filePattern1, 'and', filePattern2);

            // Search for root level files
            const rootFiles = glob.sync(filePattern1, {
              ...globOptions,
              nodir: true
            });

            // Search for nested files
            const nestedFiles = glob.sync(filePattern2, {
              ...globOptions,
              nodir: true
            });

            // Combine results and remove duplicates
            files = [...new Set([...rootFiles, ...nestedFiles])];
          }
        }

        // Search for directories based on file type filter
        if (fileType === 'all' || fileType === 'folders') {
          if (folderScope && currentFolder) {
            // When searching in current folder, only look for direct children
            const dirPattern = exactMatch ? searchTerm : `${searchTerm}*`;
            console.log('Using dir pattern (folder scope):', dirPattern);
            dirs = glob.sync(dirPattern, {
              ...globOptions,
              onlyDirectories: true
            });
          } else {
            // Search recursively in all folders
            // For root level folders, we need both patterns: direct match and nested match
            const dirPattern1 = exactMatch ? searchTerm : `${searchTerm}*`;
            const dirPattern2 = exactMatch ? `**/${searchTerm}` : `**/${searchTerm}*`;
            console.log('Using dir patterns (global):', dirPattern1, 'and', dirPattern2);

            // Search for root level folders
            const rootDirs = glob.sync(dirPattern1, {
              ...globOptions,
              onlyDirectories: true
            });

            // Search for nested folders
            const nestedDirs = glob.sync(dirPattern2, {
              ...globOptions,
              onlyDirectories: true
            });

            // Combine results and remove duplicates
            dirs = [...new Set([...rootDirs, ...nestedDirs])];
          }
        }

        console.log('Found files:', files.length, 'dirs:', dirs.length);
        console.log('Files found:', files);
        console.log('Dirs found:', dirs);

        // Process files efficiently - synchronous for speed
        for (const file of files.slice(0, maxResults)) {
          try {
            const filePath = path.join(searchBaseDir, file);
            const stats = fs.statSync(filePath);
            const fileName = path.basename(file);
            const parentPath = path.dirname(file);

            // Adjust fullPath based on search scope
            const fullPath = folderScope && currentFolder ?
              path.join(currentFolder, file).replace(/\\/g, '/') :
              file;

            allResults.push({
              name: fileName,
              fullPath: fullPath,
              size: stats.size,
              modified: stats.mtime,
              created: stats.birthtime,
              isFolder: false,
              type: 'file',
                        fileUrl: `/uploads/${fullPath}`,
              parentPath: parentPath === '.' ? '' : parentPath
            });
          } catch (statError) {
            console.warn(`Failed to get stats for ${file}:`, statError.message);
          }
        }

        // Process directories efficiently - synchronous for speed
        for (const dir of dirs.slice(0, maxResults - allResults.length)) {
          try {
            const dirName = path.basename(dir);
            const parentPath = path.dirname(dir);

            // Adjust fullPath based on search scope
            const fullPath = folderScope && currentFolder ?
              path.join(currentFolder, dir).replace(/\\/g, '/') :
              dir;

            allResults.push({
              name: dirName,
              fullPath: fullPath,
              isFolder: true,
              type: 'folder',
              created: new Date(), // Skip stats for directories to save time
              modified: new Date(),
              parentPath: parentPath === '.' ? '' : parentPath
            });
          } catch (dirError) {
            console.warn(`Failed to process directory ${dir}:`, dirError.message);
          }
        }
      } catch (globError) {
        console.warn('Glob search failed, falling back to recursive search:', globError.message);

        // Fallback to recursive search - optimized synchronous version
        const searchDirectory = (dirPath, relativePath = '', currentDepth = 0) => {
          if (currentDepth > maxDepth || !fs.existsSync(dirPath) || allResults.length >= maxResults) {
            return;
          }

          try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true });

            for (let i = 0; i < items.length && allResults.length < maxResults; i++) {
              const item = items[i];
              const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
              const itemFullPath = path.join(dirPath, item.name);

              // Check if item matches search term based on exact match setting
              const matchesSearch = exactMatch ?
                item.name === searchTerm :
                item.name.toLowerCase().includes(searchTerm);

              if (matchesSearch) {
                // Check file type filter
                const isFile = !item.isDirectory();
                const isFolder = item.isDirectory();

                if ((fileType === 'all') ||
                  (fileType === 'files' && isFile) ||
                  (fileType === 'folders' && isFolder)) {

                  if (item.isDirectory()) {
                    try {
                      const dirStats = fs.statSync(itemFullPath);
                      // Adjust fullPath based on search scope
                      const fullPath = folderScope && currentFolder ?
                        path.join(currentFolder, itemRelativePath).replace(/\\/g, '/') :
                        itemRelativePath;

                      allResults.push({
                        name: item.name,
                        fullPath: fullPath,
                        isFolder: true,
                        type: 'folder',
                        created: dirStats.birthtime,
                        modified: dirStats.mtime,
                        parentPath: relativePath || ''
                      });
                    } catch (dirStatError) {
                      const fullPath = folderScope && currentFolder ?
                        path.join(currentFolder, itemRelativePath).replace(/\\/g, '/') :
                        itemRelativePath;

                      allResults.push({
                        name: item.name,
                        fullPath: fullPath,
                        isFolder: true,
                        type: 'folder',
                        created: new Date(),
                        modified: new Date(),
                        parentPath: relativePath || ''
                      });
                    }
                  } else {
                    try {
                      const stats = fs.statSync(itemFullPath);
                      // Adjust fullPath based on search scope
                      const fullPath = folderScope && currentFolder ?
                        path.join(currentFolder, itemRelativePath).replace(/\\/g, '/') :
                        itemRelativePath;

                      allResults.push({
                        name: item.name,
                        fullPath: fullPath,
                        size: stats.size,
                        modified: stats.mtime,
                        created: stats.birthtime,
                        isFolder: false,
                        type: 'file',
                        fileUrl: `/uploads/${fullPath}`,
                        parentPath: relativePath || ''
                      });
                    } catch (statError) {
                      console.warn(`Failed to get stats for ${item.name}:`, statError.message);
                    }
                  }
                }
              }

              if (item.isDirectory() && currentDepth < maxDepth) {
                searchDirectory(itemFullPath, itemRelativePath, currentDepth + 1);
              }
            }
          } catch (dirError) {
            console.warn(`Error reading directory ${dirPath}:`, dirError.message);
          }
        };

        searchDirectory(searchBaseDir);
      }

      // Sort results by creation date descending (newest first)
      allResults.sort((a, b) => {
        // Ensure we're comparing Date objects, not strings
        const dateA = new Date(a.created || a.modified || new Date(0));
        const dateB = new Date(b.created || b.modified || new Date(0));

        // For descending order (newest first), we want dateB - dateA
        return dateB.getTime() - dateA.getTime();
      });

      // Apply pagination
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

    } catch (error) {
      console.error('Error in searchFiles:', error);
      return {
        success: false,
        items: [],
        error: error.message
      };
    }
  },

  createFolder: async (folderPath) => {
    console.log('📁 Creating folder:', folderPath);
    console.log('📁 UPLOAD_DIR:', UPLOAD_DIR);
    const fullPath = path.join(UPLOAD_DIR, folderPath);
    console.log('📁 Full path:', fullPath);

    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log('✅ Folder created successfully at:', fullPath);

      // Verify the folder was created
      if (fs.existsSync(fullPath)) {
        console.log('✅ Folder exists and is accessible');
        return true;
      } else {
        console.error('❌ Folder was not created or is not accessible');
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating folder:', error.message);
      return false;
    }
  },

  deleteFolder: async (folderName) => {
    const folderPath = path.join(UPLOAD_DIR, folderName);
    fs.rmdirSync(folderPath, { recursive: true });
    return true;
  },

  renameFolder: async (oldName, newName) => {
    fs.renameSync(path.join(UPLOAD_DIR, oldName), path.join(UPLOAD_DIR, newName));
    return true;
  },

  getFileUrl: (filePath) => {
    const normalized = (filePath || '').replace(/^\/?uploads\//, '');
    return `/uploads/${normalized}`;
  },

  getSignedUrl: async (filePath) => {
    const normalized = (filePath || '').replace(/^\/?uploads\//, '');
    return `/uploads/${normalized}`;
  },

  // Get nested folder structure recursively
  getNestedStructure: async (folder = '') => {
    const folderPath = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(folderPath)) return { success: true, structure: {} };

    const buildStructure = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const structure = {
        files: [],
        folders: {}
      };

      items.forEach(item => {
        const itemPath = path.join(dirPath, item.name);
        const itemRelativePath = relativePath ? path.join(relativePath, item.name) : item.name;

        if (item.isDirectory()) {
          structure.folders[item.name] = buildStructure(itemPath, itemRelativePath);
        } else {
          const stats = fs.statSync(itemPath);
          structure.files.push({
            name: item.name,
            fullPath: itemRelativePath,
            size: stats.size,
            modified: stats.mtime,
            type: 'file'
          });
        }
      });

      return structure;
    };

    try {
      const structure = buildStructure(folderPath, folder);
      return {
        success: true,
        structure: structure
      };
    } catch (error) {
      console.error('Error building nested structure:', error);
      return { success: false, structure: {} };
    }
  }
};
