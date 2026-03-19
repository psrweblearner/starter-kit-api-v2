'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Taggable extends Model {
        static associate(models) {
            // Taggable belongs to Tag
            Taggable.belongsTo(models.Tag, {
                foreignKey: 'tag_id',
                as: 'tag'
            });
        }

        // Get the actual model instance
        async getModel() {
            const Model = this.sequelize.models[this.taggable_type];
            if (!Model) {
                throw new Error(`Model ${this.taggable_type} not found`);
            }
            return await Model.findByPk(this.taggable_id);
        }
    }
    Taggable.init({
        tag_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'tags',
                key: 'id'
            }
        },
        taggable_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        taggable_type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Taggable',
        tableName: 'taggables'
    });
    return Taggable;
};
