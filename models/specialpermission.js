'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SpecialPermission extends Model {
    static associate(models) {
      // Link to the user
      this.belongsTo(models.AdminUser, { foreignKey: 'adminUserId', as: 'user' });

      // Link to the role
      this.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });

      // Link to the page (submenu)
      this.belongsTo(models.SubMenu, { foreignKey: 'pageId', as: 'page' });
    }
  }

  SpecialPermission.init(
    {
      adminUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      actions: {
        type: DataTypes.JSON, // ['create','read','update','delete']
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: 'SpecialPermission',
      tableName: 'SpecialPermission', // optional: specify table name
      timestamps: true,
    }
  );

  return SpecialPermission;
};
