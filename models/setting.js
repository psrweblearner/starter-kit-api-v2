'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Setting extends Model {
        /**
         * Helper method for defining associations.
         */
        static associate(models) {
        }
    }

    Setting.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        type: {
            type: DataTypes.STRING(50), // contact, file, etc
            allowNull: false,
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 1
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        modifyBy: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Setting',
        tableName: 'Settings',
        timestamps: true
    });

    return Setting;
};
