'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Faqable extends Model {
        static associate(models) {
            // Faqable belongs to Faq
            Faqable.belongsTo(models.Faq, {
                foreignKey: 'faq_id',
                as: 'faq'
            });
        }
    }
    Faqable.init({
        faq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'faqs',
                key: 'id'
            }
        },
        faqable_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: 'ID of the related model (blog, service, property, etc.)'
        },
        faqable_type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Model name (Blog, Service, Property, etc.)'
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Faqable',
        tableName: 'faqables'
    });
    return Faqable;
};
