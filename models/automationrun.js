'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AutomationRun extends Model {
    static associate(models) {
      if (models.AutomationSite) {
        AutomationRun.belongsTo(models.AutomationSite, {
          foreignKey: 'siteId',
          as: 'site',
        });
      }
      if (models.User) {
        AutomationRun.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
      if (models.Job) {
        AutomationRun.belongsTo(models.Job, {
          foreignKey: 'jobId',
          as: 'job',
        });
      }
    }
  }

  AutomationRun.init(
    {
      siteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'site_id',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      jobId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'job_id',
      },
      triggerType: {
        type: DataTypes.ENUM('manual', 'cron'),
        allowNull: false,
        defaultValue: 'manual',
        field: 'trigger_type',
      },
      status: {
        type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'queued',
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'started_at',
      },
      finishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'finished_at',
      },
      discoveredCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'discovered_count',
      },
      failedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'failed_count',
      },
      externalCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'external_count',
      },
      sitemapUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'sitemap_url',
      },
      indexSubmittedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'index_submitted_count',
      },
      indexFailedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'index_failed_count',
      },
      errorSummary: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        field: 'error_summary',
      },
      resultData: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        field: 'result_data',
      },
    },
    {
      sequelize,
      modelName: 'AutomationRun',
      tableName: 'automation_runs',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return AutomationRun;
};
