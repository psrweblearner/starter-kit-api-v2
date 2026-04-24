'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Job extends Model {
    static associate(models) {
      if (models.User) {
        Job.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
    }
  }

  Job.init(
    {
      type: {
        type: DataTypes.ENUM('sitemap', 'competitor', 'speed', 'qr', 'sitemap_automation', 'audit'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      inputData: {
        type: DataTypes.JSON,
        allowNull: false,
        field: 'input_data',
      },
      resultData: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        field: 'result_data',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'user_id',
      },
    },
    {
      sequelize,
      modelName: 'Job',
      tableName: 'jobs',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Job;
};
