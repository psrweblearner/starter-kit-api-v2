'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Faq extends Model {
        static associate(models) {
            // Polymorphic many-to-many relationship with any model
            Faq.belongsToMany(models.Blog, {
                through: {
                    model: models.Faqable,
                    unique: false,
                    scope: {
                        faqable_type: 'Blog'
                    }
                },
                foreignKey: 'faq_id',
                otherKey: 'faqable_id',
                as: 'blogs',
                constraints: false
            });

            // Association with Faqable pivot
            Faq.hasMany(models.Faqable, {
                foreignKey: 'faq_id',
                as: 'faqables'
            });
        }
    }
    Faq.init({
        question: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        ans: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: '0: Inactive, 1: Active'
        },
        sort_order: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_global: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '0: No, 1: Yes'
        },
        createdBy: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Faq',
        tableName: 'faqs'
    });
    return Faq;
};
