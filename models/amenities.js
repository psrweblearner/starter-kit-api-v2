'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Amenity extends Model {
    static associate(models) {
      // Example:
      // this.belongsToMany(models.Property, { through: 'PropertyAmenities' });
    }
  }

  Amenity.init({
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 150]
      }
    },

    icons: {
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
    modelName: 'Amenity',
    tableName: 'amenities',
    timestamps: true
  });

  return Amenity;
};