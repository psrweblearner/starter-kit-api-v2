'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Dynamically loads modules (files or directories) from a directory.
 * @param {string} directoryPath - The absolute path to the directory.
 * @param {Object} options - Loading options.
 * @param {boolean} options.loadFiles - Whether to load .js files (default: true).
 * @param {boolean} options.loadDirectories - Whether to load subdirectories (default: false).
 * @param {string[]} options.exclude - Filenames to exclude (default: ['index.js']).
 * @returns {Object} An object containing all loaded modules keyed by their basename.
 */
const loadModules = (directoryPath, options = {}) => {
    const {
        loadFiles = true,
        loadDirectories = false,
        deepLoad = false, // If true, subdirectories without index.js will be loaded as maps of their files
        exclude = ['index.js']
    } = options;

    const modules = {};

    fs.readdirSync(directoryPath, { withFileTypes: true }).forEach((dirent) => {
        const name = dirent.name;
        const fullPath = path.join(directoryPath, name);

        // Skip excluded items
        if (exclude.includes(name)) return;

        if (loadFiles && dirent.isFile() && name.endsWith('.js')) {
            const moduleName = path.basename(name, '.js');
            modules[moduleName] = require(fullPath);
        } else if (loadDirectories && dirent.isDirectory()) {
            const indexSubPath = path.join(fullPath, 'index.js');

            if (fs.existsSync(indexSubPath)) {
                // Priority 1: Use index.js if it exists
                modules[name] = require(indexSubPath);
            } else if (deepLoad) {
                // Priority 2: Automatically map files inside if deepLoad is on
                modules[name] = loadModules(fullPath, {
                    loadFiles: true,
                    loadDirectories: false,
                    exclude
                });
            }
        }
    });

    return modules;
};

module.exports = { loadModules };
