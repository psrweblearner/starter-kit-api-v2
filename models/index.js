'use strict';

/**
 * ==========================================================
 * Sequelize Database Initialization and Model Loader
 * ==========================================================
 *
 * This file is responsible for initializing the Sequelize ORM, loading all models dynamically,
 * setting up associations, and initializing global mail hooks.
 * It centralizes database setup, making it easy to manage models and global features.
 */

/**
 * ==========================================================
 * Module Imports
 * ==========================================================
 *
 * The following modules are imported to handle file system operations, path resolution, Sequelize ORM,
 * environment configuration, and the global mail utility.
 *
 * - fs: File system module to read model files dynamically.
 * - path: Handles file paths and file name resolution.
 * - Sequelize: The ORM for database interactions.
 * - process: Accesses environment variables and process-level information.
 * - globalMail: Custom utility to handle automated mail hooks.
 */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const globalMail = require('../utils/globalMail');

/**
 * ==========================================================
 * Environment and Configuration
 * ==========================================================
 *
 * Determines the current environment (development, production, test) and loads the corresponding
 * database configuration from the config file. This ensures that the application can switch
 * between multiple environments without changing code.
 *
 * - basename: The current filename, used to ignore self during model loading.
 * - env: Current Node environment or 'development' by default.
 * - config: Database configuration object for the current environment.
 */
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];

/**
 * ==========================================================
 * Sequelize Instance Initialization
 * ==========================================================
 *
 * Initializes a Sequelize instance using either an environment variable connection string
 * or the explicit database credentials provided in the configuration.
 *
 * - If `use_env_variable` is set, Sequelize connects using the specified environment variable.
 * - Otherwise, Sequelize uses the database name, username, password, and other configuration options.
 */
const db = {};
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

/**
 * ==========================================================
 * Dynamic Model Loader
 * ==========================================================
 *
 * Reads all JavaScript files in the current directory (excluding this file and test files)
 * and imports them as Sequelize models. Each model is then attached to the `db` object
 * using the model's name as the key. This allows automatic loading of new models without
 * modifying this file.
 */
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

/**
 * ==========================================================
 * Model Associations
 * ==========================================================
 *
 * After all models have been imported, this section iterates through each model and
 * executes its `associate` function if defined. This establishes relationships between
 * models such as hasMany, belongsTo, and many-to-many associations.
 */
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

/**
 * ==========================================================
 * Attach Sequelize and Sequelize Class
 * ==========================================================
 *
 * Attaches the Sequelize instance and the Sequelize class to the `db` object.
 * - db.sequelize: The Sequelize instance used for database operations.
 * - db.Sequelize: The Sequelize class, useful for data types and static properties.
 */
db.sequelize = sequelize;
db.Sequelize = Sequelize;

if (globalMail && typeof globalMail.initMailHooks === 'function') {
  globalMail.initMailHooks(db);
}

/**
 * ==========================================================
 * Module Exports
 * ==========================================================
 *
 * Exports the `db` object containing all models, the Sequelize instance, and the Sequelize class.
 * This allows other modules in the application to import this file and access models or
 * perform database operations without initializing Sequelize multiple times.
 */
module.exports = db;
