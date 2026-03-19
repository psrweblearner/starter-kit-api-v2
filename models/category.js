'use strict';
const {
    Model
} = require('sequelize');
const { slugify } = require('../helper/utils');
module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            // Self-referencing relationship for parent-child categories
            Category.hasMany(models.Category, {
                as: 'children',
                foreignKey: 'parent_id',
                sourceKey: 'id'
            });

            Category.belongsTo(models.Category, {
                as: 'parent',
                foreignKey: 'parent_id',
                targetKey: 'id'
            });

            // Polymorphic many-to-many relationship with any model
            Category.belongsToMany(models.Blog, {
                through: {
                    model: models.Categorizable,
                    unique: false,
                    scope: {
                        categorizable_type: 'Blog'
                    }
                },
                foreignKey: 'category_id',
                otherKey: 'categorizable_id',
                as: 'blogs',
                constraints: false
            });
        }

        // Instance method to get usage count across all models
        async getUsageCount() {
            const Categorizable = this.sequelize.models.Categorizable;
            return await Categorizable.count({
                where: { category_id: this.id }
            });
        }
    }
    Category.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100]
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        description: DataTypes.TEXT,
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#007bff',
            validate: {
                is: /^#[0-9A-F]{6}$/i
            }
        },
        icon: DataTypes.STRING,
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
        modelName: 'Category',
        tableName: 'categories',
        hooks: {
            beforeCreate: async (category) => {
                // Convert empty string parent_id to null
                if (category.parent_id === '' || category.parent_id === '0') {
                    category.parent_id = null;
                }

                if (!category.slug && category.name) {
                    let baseSlug = slugify(category.name);
                    let slug = baseSlug;
                    let counter = 1;

                    // Check for uniqueness
                    while (await Category.findOne({ where: { slug } })) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    category.slug = slug;
                }
            },
            beforeUpdate: async (category) => {
                // Convert empty string parent_id to null
                if (category.parent_id === '' || category.parent_id === '0') {
                    category.parent_id = null;
                }

                if (category.changed('name') && !category.changed('slug')) {
                    let baseSlug = slugify(category.name);
                    let slug = baseSlug;
                    let counter = 1;

                    // Check for uniqueness (excluding current record)
                    while (await Category.findOne({ where: { slug, id: { [sequelize.Sequelize.Op.ne]: category.id } } })) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    category.slug = slug;
                }
            }
        }
    });
    return Category;
};
