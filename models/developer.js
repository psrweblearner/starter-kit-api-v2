'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Developer extends Model {
    static associate(models) {
      // Define associations here if needed
      // Example:
      // this.hasMany(models.Property, { foreignKey: 'developer_id' });
    }
  }

  Developer.init({
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 150]
      }
    },

    logo: {
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
    modelName: 'Developer',
    tableName: 'developers',
    timestamps: true
  });

  return Developer;
};