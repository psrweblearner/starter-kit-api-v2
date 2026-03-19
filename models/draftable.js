'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Draftable extends Model {
        static associate(models) {
            // Draftable belongs to Draft
            Draftable.belongsTo(models.Draft, {
                foreignKey: 'draft_id',
                as: 'draft'
            });
        }

        // Get the actual model instance
        async getModel() {
            const Model = this.sequelize.models[this.draftable_type];
            if (!Model) {
                throw new Error(`Model ${this.draftable_type} not found`);
            }
            return await Model.findByPk(this.draftable_id);
        }
    }
    Draftable.init({
        draft_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'drafts',
                key: 'id'
            }
        },
        draftable_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        draftable_type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Draftable',
        tableName: 'draftables'
    });
    return Draftable;
};
