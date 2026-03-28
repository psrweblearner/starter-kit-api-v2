'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Otp extends Model {}

  Otp.init(
    {
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      mobile: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      otp: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      expire: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Otp',
      tableName: 'Otps',
      timestamps: true
    }
  );

  return Otp;
};
