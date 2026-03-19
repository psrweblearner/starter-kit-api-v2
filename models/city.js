'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    static associate(models) {
      // Define associations here if needed later
      // Example:
      // this.belongsTo(models.State, { foreignKey: 'state_id' });
    }
  }

  City.init({
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 150]
      }
    },

    file_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      set(value) {
        this.setDataValue(
          'slug',
          value ? value.toLowerCase().replace(/\s+/g, '-') : value
        );
      },
      validate: {
        len: [2, 150]
      }
    },

    tagline: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false,
    },

    is_prominent: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false,
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
    modelName: 'City',
    tableName: 'cities',
    timestamps: true
  });

  return City;
};