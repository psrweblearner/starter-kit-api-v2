'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PropertyType extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  PropertyType.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200]
      }
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
    modelName: 'PropertyType',
    tableName: 'propertytypes',
    timestamps: true
  });

  return PropertyType;
};