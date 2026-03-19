'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Draft extends Model {
        static associate(models) {
            Draft.belongsToMany(models.Blog, {
                through: {
                    model: models.Draftable,
                    unique: false,
                    scope: {
                        draftable_type: 'Blog'
                    }
                },
                foreignKey: 'draft_id',
                otherKey: 'draftable_id',
                as: 'blogs',
                constraints: false
            });
        }
    }

    Draft.init({
        data: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Draft',
        tableName: 'drafts'
    });

    return Draft;
};
