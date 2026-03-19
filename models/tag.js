'use strict';
const {
    Model
} = require('sequelize');
const { slugify } = require('../helper/utils');
module.exports = (sequelize, DataTypes) => {
    class Tag extends Model {
        static associate(models) {
            // Polymorphic many-to-many relationship with any model
            Tag.belongsToMany(models.Blog, {
                through: {
                    model: models.Taggable,
                    unique: false,
                    scope: {
                        taggable_type: 'Blog'
                    }
                },
                foreignKey: 'tag_id',
                otherKey: 'taggable_id',
                as: 'blogs',
                constraints: false
            });
        }

        // Instance method to increment usage count
        incrementUsage() {
            this.increment('usage_count');
        }

        // Instance method to decrement usage count
        decrementUsage() {
            this.decrement('usage_count');
        }

        // Instance method to get usage count across all models
        async getTotalUsageCount() {
            const Taggable = this.sequelize.models.Taggable;
            return await Taggable.count({
                where: { tag_id: this.id }
            });
        }
    }
    Tag.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50]
            }
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        description: DataTypes.TEXT,
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#6c757d',
            validate: {
                is: /^#[0-9A-F]{6}$/i
            }
        },
        usage_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        modelName: 'Tag',
        tableName: 'tags',
        hooks: {
            beforeCreate: async (tag) => {
                if (!tag.slug && tag.name) {
                    let baseSlug = slugify(tag.name);
                    let slug = baseSlug;
                    let counter = 1;

                    // Check for uniqueness
                    while (await Tag.findOne({ where: { slug } })) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    tag.slug = slug;
                }
            },
            beforeUpdate: async (tag) => {
                if (tag.changed('name') && !tag.changed('slug')) {
                    let baseSlug = slugify(tag.name);
                    let slug = baseSlug;
                    let counter = 1;

                    // Check for uniqueness (excluding current record)
                    while (await Tag.findOne({ where: { slug, id: { [sequelize.Sequelize.Op.ne]: tag.id } } })) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    tag.slug = slug;
                }
            }
        }
    });
    return Tag;
};
