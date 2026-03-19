'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Categorizable extends Model {
        static associate(models) {
            // Categorizable belongs to Category
            Categorizable.belongsTo(models.Category, {
                foreignKey: 'category_id',
                as: 'category'
            });
        }

        // Get the actual model instance
        async getModel() {
            const Model = this.sequelize.models[this.categorizable_type];
            if (!Model) {
                throw new Error(`Model ${this.categorizable_type} not found`);
            }
            return await Model.findByPk(this.categorizable_id);
        }
    }
    Categorizable.init({
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        categorizable_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        categorizable_type: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Categorizable',
        tableName: 'categorizables'
    });
    return Categorizable;
};
