'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ColdOutreachLead extends Model {
    static associate(models) {
      if (models.ColdOutreachRule) {
        ColdOutreachLead.belongsTo(models.ColdOutreachRule, {
          foreignKey: 'ruleId',
          as: 'rule',
        });
      }
      if (models.ColdOutreachLeadContact) {
        ColdOutreachLead.hasMany(models.ColdOutreachLeadContact, {
          foreignKey: 'leadId',
          as: 'contacts',
        });
      }
    }
  }

  ColdOutreachLead.init(
    {
      ruleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'rule_id',
      },
      placeId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'place_id',
      },
      businessName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'business_name',
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'review_count',
      },
      phone: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      sourceKeyword: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'source_keyword',
      },
      sourceLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'source_location',
      },
      leadScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'lead_score',
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: 'ColdOutreachLead',
      tableName: 'cold_outreach_leads',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        {
          unique: true,
          fields: ['rule_id', 'place_id'],
          name: 'uniq_cold_outreach_rule_place',
        },
      ],
    }
  );

  return ColdOutreachLead;
};
