'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubMenu extends Model {
    static associate(models) {
     this.belongsToMany(models.Menu, {through: models.MenuSubMenu,foreignKey: 'subMenuId',otherKey: 'menuId',as: 'menus'});
    this.hasMany(models.Permission, { foreignKey: 'pageId', as: 'permissions' });
    this.belongsToMany(models.Role, {through: models.Permission,foreignKey: 'pageId',otherKey: 'roleId',as: 'roles'});
    }
  }
  SubMenu.init({
    title: DataTypes.STRING,
    icon: DataTypes.STRING,
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      set(value) {
        this.setDataValue('slug', value ? value.toLowerCase().replace(/\s+/g, '-') : value);
      }
    },
    status: DataTypes.INTEGER,
    createdBy: DataTypes.STRING,
    modifyBy: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SubMenu',
  });
  return SubMenu;
};

