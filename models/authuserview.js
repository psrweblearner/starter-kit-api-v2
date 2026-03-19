'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AuthUserView extends Model {
        static associate(models) {
            // Define associations here if needed, though usually views are read-only
        }
    }

    AuthUserView.init({
        adminUserId: { type: DataTypes.INTEGER, primaryKey: true }, // Composite PK part 1
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        mobile: DataTypes.STRING,
        profile: DataTypes.STRING,
        address: DataTypes.STRING,
        designation: DataTypes.STRING,
        about: DataTypes.TEXT,
        userStatus: DataTypes.INTEGER,
        roleId: { type: DataTypes.INTEGER, primaryKey: true }, // Composite PK part 2
        roleTitle: DataTypes.STRING,
        roleStatus: DataTypes.INTEGER,
        roleAccess: DataTypes.STRING,
        pageId: { type: DataTypes.INTEGER, primaryKey: true }, // Composite PK part 3
        pageTitle: DataTypes.STRING,
        pageIcon: DataTypes.STRING,
        pageSlug: DataTypes.STRING,
        pageStatus: DataTypes.INTEGER,
        pageActions: DataTypes.JSON,
        menuId: DataTypes.INTEGER,
        menuTitle: DataTypes.STRING,
        menuIcon: DataTypes.STRING,
        menuSlug: DataTypes.STRING,
        menuStatus: DataTypes.INTEGER,
        specialActions: DataTypes.JSON
    }, {
        sequelize,
        modelName: 'AuthUserView',
        tableName: 'AuthUserView',
        timestamps: false, // Views don't have timestamps usually
        freezeTableName: true
    });

    return AuthUserView;
};
