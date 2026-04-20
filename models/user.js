'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.UserSession, { foreignKey: 'userId', as: 'sessions' });
    }

    async validatePassword(plainPassword) {
      return bcrypt.compare(plainPassword, this.password);
    }
  }

  User.generateToken = async function (user, finger = null, type = 'ACCESS', expiresIn = '20m') {
    const fs = require('fs');
    const path = require('path');
    const privateKey = fs.readFileSync(path.join(__dirname, '../', process.env.JWT_PRIVATE_KEY_PATH), 'utf8');
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      type,
      finger
    };
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn });
  };

  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });
  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password') && user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  return User;
};
