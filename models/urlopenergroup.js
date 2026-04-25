'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UrlOpenerGroup extends Model {
    static associate(models) {
      if (models.User) {
        UrlOpenerGroup.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
        });
      }
    }
  }

  UrlOpenerGroup.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      urlsJson: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        field: 'urls_json',
      },
    },
    {
      sequelize,
      modelName: 'UrlOpenerGroup',
      tableName: 'url_opener_groups',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return UrlOpenerGroup;
};
