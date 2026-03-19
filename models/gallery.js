'use strict';
const {
    Model
} = require('sequelize');
const { slugify } = require('../helper/utils');
module.exports = (sequelize, DataTypes) => {
    class Gallery extends Model {
        static associate(models) {
            // Polymorphic many-to-many relationship with any model
            Gallery.belongsToMany(models.Blog, {
                through: {
                    model: models.Galleryable,
                    unique: false,
                    scope: {
                        galleryable_type: 'Blog'
                    }
                },
                foreignKey: 'gallery_id',
                otherKey: 'galleryable_id',
                as: 'blogs',
                constraints: false
            });

            // Association with Galleryable pivot
            Gallery.hasMany(models.Galleryable, {
                foreignKey: 'gallery_id',
                as: 'galleryables'
            });

            // Association with File model
            Gallery.belongsTo(models.File, {
                foreignKey: 'file_id',
                as: 'fileInfo'
            });
        }

        // Instance method to get usage count across all models
        async getUsageCount() {
            const Galleryable = this.sequelize.models.Galleryable;
            return await Galleryable.count({
                where: { gallery_id: this.id }
            });
        }
    }
    Gallery.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 200]
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        description: DataTypes.TEXT,
        file_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            references: {
                model: 'files',
                key: 'id'
            }
        },
        alt: DataTypes.STRING,
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        createdBy: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Gallery',
        tableName: 'galleries',

    });
    return Gallery;
};
