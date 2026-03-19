'use strict';
const { Model } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { uniqueId, slugify } = require('../helper/utils');
module.exports = (sequelize, DataTypes) => {
  class AdminUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Role, { through: models.AdminUserRole, foreignKey: 'adminUserId', otherKey: 'roleId', as: 'roles' });
      this.hasMany(models.SpecialPermission, { foreignKey: 'adminUserId', as: 'specialPermissions' });
    }
  }

  AdminUser.generateToken = async function (user, activeRole, roles = false, finger = null, type = 'ACCESS', expiresIn = "20m") {
    const fs = require('fs');
    const path = require('path');
    const privateKey = fs.readFileSync(path.join(__dirname, '../', process.env.JWT_PRIVATE_KEY_PATH), 'utf8');
    const payload = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profile: user.profile,
      mobile: user.mobile,
      type: type, // 'ACCESS' or 'REFRESH'
      role: {
        id: activeRole.id,
        title: activeRole.title,
      },
      finger: finger // Device fingerprint
    };

    // only add roles if provided
    if (roles && Array.isArray(roles)) {
      payload.roles = roles.map(r => ({
        id: r.id,
        title: r.title,
        status: r.status
      }));
    }
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: expiresIn });
  };


  AdminUser.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    userCode: DataTypes.STRING,
    email: DataTypes.STRING,
    slug: DataTypes.STRING,
    password: DataTypes.STRING,
    pwd: DataTypes.STRING,
    mobile: DataTypes.STRING,
    about: DataTypes.TEXT,
    profile: DataTypes.STRING,
    address: DataTypes.STRING,
    designation: DataTypes.STRING,
    is_agent: DataTypes.INTEGER,
    license: DataTypes.STRING,
    status: DataTypes.INTEGER,
    is_verify: DataTypes.INTEGER,
    order: DataTypes.INTEGER,
    createdBy: DataTypes.STRING,
    modifyBy: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AdminUser',
  });
  AdminUser.beforeCreate(async (user) => {
    if (!user.userCode) {
      user.userCode = uniqueId(8);
    }
    if (!user.slug) {
      const base = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      user.slug = slugify(base || user.userCode);
    }
    if (!user.password) {
      user.password = await bcrypt.hash('123456789', 10);
      user.pwd = '123456789';
    }
  });

  AdminUser.beforeUpdate(async (user) => {
    if (!user.slug || user.changed('firstName') || user.changed('lastName')) {
      const base = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      user.slug = slugify(base || user.userCode);
    }
  });
  return AdminUser;
};