'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AdminUserRole extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AdminUserRole.init({
    adminUserId: DataTypes.INTEGER,
    roleId: DataTypes.INTEGER,
    access: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AdminUserRole',
  });
  return AdminUserRole;
};