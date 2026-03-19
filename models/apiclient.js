// models/apiClient.js
'use strict';

module.exports = (sequelize, DataTypes) => {
  const ApiClient = sequelize.define(
    'ApiClient',
    {
      name: DataTypes.STRING,
      domain: DataTypes.STRING,
      api_key: DataTypes.STRING,
      allow_all: DataTypes.BOOLEAN,
      status: DataTypes.INTEGER
    },
    {
      tableName: 'apiClients',
      underscored: true
    }
  );

  return ApiClient;
};
