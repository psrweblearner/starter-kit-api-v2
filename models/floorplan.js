'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Floorplan extends Model {
    static associate(models) {
      // Example association:
      // this.belongsTo(models.Property, { foreignKey: 'property_id' });
    }
  }

  Floorplan.init({
    tagline: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    property_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    bedroom: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0'
    },

    bathroom: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0'
    },

    amount: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0'
    },

    area: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0'
    },

    parking: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '0'
    },

    file_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0'
    },

    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    modifyBy: {
      type: DataTypes.STRING,
      allowNull: true,
    }

  }, {
    sequelize,
    modelName: 'Floorplan',
    tableName: 'floorplans',
    timestamps: true
  });

  return Floorplan;
};