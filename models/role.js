'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.AdminUser, {
          through: models.AdminUserRole,
          foreignKey: 'roleId',
          otherKey: 'adminUserId',
          as: 'users'
        });
  this.hasMany(models.Permission, { foreignKey: 'roleId', as: 'permissions' });
  this.belongsToMany(models.SubMenu, {
    through: models.Permission,
    foreignKey: "roleId",
    otherKey: "pageId",
    as: "pages"
  });
    }
  }
  Role.init({
    title: DataTypes.STRING,
    status: DataTypes.INTEGER,
    createdBy: DataTypes.STRING,
    modifyBy: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Role',
  });
  return Role;
};