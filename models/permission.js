'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Role, { foreignKey: 'roleId',as: 'role' });
      this.belongsTo(models.SubMenu, { foreignKey: 'pageId', as: 'Pages' });
    }
  }
  Permission.init({
    roleId: DataTypes.INTEGER,
    pageId: DataTypes.INTEGER,
    actions: {
      type: DataTypes.JSON,
      defaultValue: [] // e.g. ["create","read","update","delete"]
    }
  }, {
    sequelize,
    modelName: 'Permission',
  });
  return Permission;
};