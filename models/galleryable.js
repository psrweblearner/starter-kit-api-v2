'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Galleryable extends Model {
        static associate(models) {
            // Galleryable belongs to Gallery
            Galleryable.belongsTo(models.Gallery, {
                foreignKey: 'gallery_id',
                as: 'gallery'
            });
        }

        // Get the actual model instance
        async getModel() {
            const Model = this.sequelize.models[this.galleryable_type];
            if (!Model) {
                throw new Error(`Model ${this.galleryable_type} not found`);
            }
            return await Model.findByPk(this.galleryable_id);
        }
    }
    Galleryable.init({
        gallery_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'galleries',
                key: 'id'
            }
        },
        galleryable_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        galleryable_type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Galleryable',
        tableName: 'galleryables'
    });
    return Galleryable;
};
