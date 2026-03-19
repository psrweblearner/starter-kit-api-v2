'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    static associate(models) {
      this.belongsToMany(models.SubMenu, {through: models.MenuSubMenu,foreignKey: 'menuId',otherKey: 'subMenuId',as: 'submenus'});
    }
  }
  Menu.init({
    title: {
      type:DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: false,
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      set(value) {
        this.setDataValue('slug', value ? value.toLowerCase().replace(/\s+/g, '-') : value);
      },
      validate: {
        notEmpty: false,
        len: [2, 100]
      }
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: true,
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
    modelName: 'Menu',
  });
  return Menu;
};

