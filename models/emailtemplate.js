'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmailTemplate extends Model {
    static associate(models) {
      EmailTemplate.belongsTo(models.AdminUser, {
        foreignKey: 'createdBy',
        as: 'createdByUser'
      });

      EmailTemplate.belongsTo(models.AdminUser, {
        foreignKey: 'modifiedBy',
        as: 'modifiedByUser'
      });

      EmailTemplate.hasMany(models.EmailLog, {
        foreignKey: 'email_template_id',
        as: 'logs'
      });
    }
  }

  EmailTemplate.init(
    {
      module: {
        type: DataTypes.STRING,
        allowNull: false
      },
      operation: {
        type: DataTypes.ENUM('create', 'update', 'delete', 'download'),
        allowNull: true
      },
      attchment: {
        type: DataTypes.STRING,
        allowNull: true
      },
      attchmentTo: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userSubject: {
        type: DataTypes.STRING,
        allowNull: false
      },
      adminSubject: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      userBody: {
        type: DataTypes.TEXT('long'),
        allowNull: false
      },
      adminBody: {
        type: DataTypes.TEXT('long'),
        allowNull: true
      },
      mailTo: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'all'
      },
      mail: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1'
      },
      mailField: {
        type: DataTypes.JSON,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1'
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EmailTemplate',
      tableName: 'EmailTemplates',
      timestamps: true
    }
  );

  return EmailTemplate;
};
