'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AdminSession extends Model {
        static associate(models) {
            this.belongsTo(models.AdminUser, { foreignKey: 'adminUserId', as: 'user' });
        }
    }
    AdminSession.init({
        adminUserId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        refreshToken: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        finger: {
            type: DataTypes.STRING,
            allowNull: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            defaultValue: 1 // 1: Active, 0: Revoked
        }
    }, {
        sequelize,
        modelName: 'AdminSession',
    });
    return AdminSession;
};
