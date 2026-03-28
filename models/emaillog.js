'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailLog extends Model {
    static associate(models) {
      EmailLog.belongsTo(models.EmailTemplate, {
        foreignKey: 'email_template_id',
        as: 'template',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      if (models.AdminUser) {
        EmailLog.belongsTo(models.AdminUser, {
          foreignKey: 'user_id',
          as: 'user'
        });
      }
    }
  }

  EmailLog.init(
    {
      email_template_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      module: {
        type: DataTypes.STRING,
        allowNull: false
      },
      operation: {
        type: DataTypes.ENUM('create', 'update', 'delete'),
        allowNull: false
      },
      record_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      details: {
        type: DataTypes.JSON,
        allowNull: true
      },
      mail_triggered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'skipped'),
        defaultValue: 'pending'
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EmailLog',
      tableName: 'EmailLogs',
      timestamps: true
    }
  );

  return EmailLog;
};
