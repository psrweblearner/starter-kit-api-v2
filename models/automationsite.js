'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AutomationSite extends Model {
    static associate(models) {
      if (models.User) {
        AutomationSite.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
      if (models.AutomationRun) {
        AutomationSite.hasMany(models.AutomationRun, {
          foreignKey: 'siteId',
          as: 'runs',
        });
      }
    }
  }

  AutomationSite.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      domain: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isConnected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_connected',
      },
      verificationToken: {
        type: DataTypes.STRING(128),
        allowNull: true,
        field: 'verification_token',
      },
      verifyScriptInstalled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'verify_script_installed',
      },
      verifySitemapReachable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'verify_sitemap_reachable',
      },
      schemaMarkupText: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        field: 'schema_markup_text',
      },
      schemaAppliedStatus: {
        type: DataTypes.ENUM('not_applied', 'applied', 'failed'),
        allowNull: false,
        defaultValue: 'not_applied',
        field: 'schema_applied_status',
      },
      cronExpression: {
        type: DataTypes.STRING(120),
        allowNull: true,
        field: 'cron_expression',
      },
      lastRunAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_run_at',
      },
      nextRunAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'next_run_at',
      },
      googleIndexEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'google_index_enabled',
      },
      googleProperty: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'google_property',
      },
      indexApiConfigRef: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'index_api_config_ref',
      },
      publishEndpoint: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'publish_endpoint',
      },
      publishSecret: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'publish_secret',
      },
      publishPath: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'public/sitemap.xml',
        field: 'publish_path',
      },
      lastPingAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_ping_at',
      },
      verifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verified_at',
      },
      lastPublishAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_publish_at',
      },
      lastPublishStatus: {
        type: DataTypes.ENUM('pending', 'success', 'failed', 'not-configured'),
        allowNull: false,
        defaultValue: 'not-configured',
        field: 'last_publish_status',
      },
      lastPublishMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'last_publish_message',
      },
    },
    {
      sequelize,
      modelName: 'AutomationSite',
      tableName: 'automation_sites',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return AutomationSite;
};
