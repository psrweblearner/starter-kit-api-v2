'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ColdOutreachRule extends Model {
    static associate(models) {
      if (models.User) {
        ColdOutreachRule.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
      if (models.ColdOutreachLead) {
        ColdOutreachRule.hasMany(models.ColdOutreachLead, {
          foreignKey: 'ruleId',
          as: 'leads',
        });
      }
    }
  }

  ColdOutreachRule.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      ruleName: {
        type: DataTypes.STRING(180),
        allowNull: false,
        field: 'rule_name',
      },
      filters: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      runStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'run_status',
      },
      lastRunAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_run_at',
      },
    },
    {
      sequelize,
      modelName: 'ColdOutreachRule',
      tableName: 'cold_outreach_rules',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return ColdOutreachRule;
};
