'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ColdOutreachLeadContact extends Model {
    static associate(models) {
      if (models.ColdOutreachLead) {
        ColdOutreachLeadContact.belongsTo(models.ColdOutreachLead, {
          foreignKey: 'leadId',
          as: 'lead',
        });
      }
    }
  }

  ColdOutreachLeadContact.init(
    {
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'lead_id',
      },
      phone: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      source: {
        type: DataTypes.ENUM('scraped', 'manual', 'gmb'),
        allowNull: false,
        defaultValue: 'gmb',
      },
    },
    {
      sequelize,
      modelName: 'ColdOutreachLeadContact',
      tableName: 'cold_outreach_lead_contacts',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return ColdOutreachLeadContact;
};
