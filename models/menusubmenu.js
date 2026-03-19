'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuSubMenu extends Model {
    static associate(models) {
      // This is just the pivot table – associations are already defined in Menu and SubMenu
    }
  }

  MenuSubMenu.init(
    {
      menuId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Menus', key: 'id' }
      },
      subMenuId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'SubMenus', key: 'id' }
      }
    },
    {
      sequelize,
      modelName: 'MenuSubMenu'
    }
  );

  return MenuSubMenu;
};
