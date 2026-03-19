require('dotenv').config();

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'api_starter_kit_db',
    timezone: '+05:30',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    retry: { max: 3 },
    migrationStorage: 'sequelize',
    seederStorage: 'sequelize',
    dialectOptions: {
      connectTimeout: 10000
    }
  },
  production: {
    dialect: 'mysql',
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+05:30',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    retry: { max: 3 },
    migrationStorage: 'sequelize',
    seederStorage: 'sequelize',
    dialectOptions: {
      connectTimeout: 10000
    }
  }
};
