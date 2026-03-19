'use strict';
const { Model } = require('sequelize');
const { slugify } = require('../helper/utils');
module.exports = (sequelize, DataTypes) => {
    class Blog extends Model {
        static associate(models) {
            // Polymorphic many-to-many relationship with categories
            Blog.belongsToMany(models.Category, {
                through: {
                    model: models.Categorizable,
                    unique: false,
                    scope: {
                        categorizable_type: 'Blog'
                    }
                },
                foreignKey: 'categorizable_id',
                otherKey: 'category_id',
                as: 'categories',
                constraints: false
            });

            // Polymorphic many-to-many relationship with tags
            Blog.belongsToMany(models.Tag, {
                through: {
                    model: models.Taggable,
                    unique: false,
                    scope: {
                        taggable_type: 'Blog'
                    }
                },
                foreignKey: 'taggable_id',
                otherKey: 'tag_id',
                as: 'tags',
                constraints: false
            });

            // Polymorphic many-to-many relationship with galleries
            Blog.belongsToMany(models.Gallery, {
                through: {
                    model: models.Galleryable,
                    unique: false,
                    scope: {
                        galleryable_type: 'Blog'
                    }
                },
                foreignKey: 'galleryable_id',
                otherKey: 'gallery_id',
                as: 'galleries',
                constraints: false
            });

            // Polymorphic many-to-many relationship with drafts
            Blog.belongsToMany(models.Draft, {
                through: {
                    model: models.Draftable,
                    unique: false,
                    scope: {
                        draftable_type: 'Blog'
                    }
                },
                foreignKey: 'draftable_id',
                otherKey: 'draft_id',
                as: 'drafts',
                constraints: false
            });

            // Polymorphic many-to-many relationship with FAQs
            Blog.belongsToMany(models.Faq, {
                through: {
                    model: models.Faqable,
                    unique: false,
                    scope: {
                        faqable_type: 'Blog'
                    }
                },
                foreignKey: 'faqable_id',
                otherKey: 'faq_id',
                as: 'faqs',
                constraints: false
            });

            // Blog has many categorizables (polymorphic)
            Blog.hasMany(models.Categorizable, {
                foreignKey: 'categorizable_id',
                scope: {
                    categorizable_type: 'Blog'
                },
                as: 'categorizables',
                constraints: false
            });

            // Blog has many taggables (polymorphic)
            Blog.hasMany(models.Taggable, {
                foreignKey: 'taggable_id',
                scope: {
                    taggable_type: 'Blog'
                },
                as: 'taggables',
                constraints: false
            });

            // Blog has many galleryables (polymorphic)
            Blog.hasMany(models.Galleryable, {
                foreignKey: 'galleryable_id',
                scope: {
                    galleryable_type: 'Blog'
                },
                as: 'galleryables',
                constraints: false
            });

            // Blog has many draftables (polymorphic)
            Blog.hasMany(models.Draftable, {
                foreignKey: 'draftable_id',
                scope: {
                    draftable_type: 'Blog'
                },
                as: 'draftables',
                constraints: false
            });

            // Blog has many faqables (polymorphic)
            Blog.hasMany(models.Faqable, {
                foreignKey: 'faqable_id',
                scope: {
                    faqable_type: 'Blog'
                },
                as: 'faqables',
                constraints: false
            });

            // Blog belongs to AdminUser (author)
            Blog.belongsTo(models.AdminUser, {
                foreignKey: 'author',
                as: 'authorInfo'
            });
        }

        // Instance method to check if blog is published
        isPublished() {
            return this.status === 1;
        }

        // Instance method to get excerpt
        getExcerpt(length = 150) {
            if (this.description) {
                return this.description.replace(/<[^>]*>/g, '').substring(0, length) + '...';
            }
            return '';
        }

        // Instance method to add categories (polymorphic)
        async addCategories(categoryIds) {
            const Categorizable = this.sequelize.models.Categorizable;
            const categorizables = categoryIds.map(categoryId => ({
                category_id: categoryId,
                categorizable_id: this.id,
                categorizable_type: 'Blog'
            }));
            return await Categorizable.bulkCreate(categorizables);
        }

        // Instance method to remove categories (polymorphic)
        async removeCategories(categoryIds) {
            const Categorizable = this.sequelize.models.Categorizable;
            return await Categorizable.destroy({
                where: {
                    categorizable_id: this.id,
                    categorizable_type: 'Blog',
                    category_id: categoryIds
                }
            });
        }

        // Instance method to set categories (polymorphic)
        async setCategories(categoryIds) {
            // Remove existing categories
            await this.removeCategories(categoryIds);
            // Add new categories
            if (categoryIds && categoryIds.length > 0) {
                await this.addCategories(categoryIds);
            }
        }

        // Instance method to add tags (polymorphic)
        async addTags(tagIds) {
            const Taggable = this.sequelize.models.Taggable;
            const taggables = tagIds.map(tagId => ({
                tag_id: tagId,
                taggable_id: this.id,
                taggable_type: 'Blog'
            }));
            return await Taggable.bulkCreate(taggables);
        }

        // Instance method to remove tags (polymorphic)
        async removeTags(tagIds) {
            const Taggable = this.sequelize.models.Taggable;
            return await Taggable.destroy({
                where: {
                    taggable_id: this.id,
                    taggable_type: 'Blog',
                    tag_id: tagIds
                }
            });
        }

        // Instance method to set tags (polymorphic)
        async setTags(tagIds) {
            // Remove existing tags
            await this.removeTags(tagIds);
            // Add new tags
            if (tagIds && tagIds.length > 0) {
                await this.addTags(tagIds);
            }
        }

        // Instance method to add galleries (polymorphic)
        async addGalleries(galleryIds) {
            const Galleryable = this.sequelize.models.Galleryable;
            const galleryables = galleryIds.map(galleryId => ({
                gallery_id: galleryId,
                galleryable_id: this.id,
                galleryable_type: 'Blog'
            }));
            return await Galleryable.bulkCreate(galleryables);
        }

        // Instance method to remove galleries (polymorphic)
        async removeGalleries(galleryIds) {
            const Galleryable = this.sequelize.models.Galleryable;
            return await Galleryable.destroy({
                where: {
                    galleryable_id: this.id,
                    galleryable_type: 'Blog',
                    gallery_id: galleryIds
                }
            });
        }

        // Instance method to set galleries (polymorphic)
        async setGalleries(galleryIds) {
            // Remove existing galleries
            await this.removeGalleries(galleryIds);
            // Add new galleries
            if (galleryIds && galleryIds.length > 0) {
                await this.addGalleries(galleryIds);
            }
        }

        // Instance method to add drafts (polymorphic)
        async addDrafts(draftIds) {
            const Draftable = this.sequelize.models.Draftable;
            const draftables = draftIds.map(draftId => ({
                draft_id: draftId,
                draftable_id: this.id,
                draftable_type: 'Blog'
            }));
            return await Draftable.bulkCreate(draftables);
        }

        // Instance method to remove drafts (polymorphic)
        async removeDrafts(draftIds) {
            const Draftable = this.sequelize.models.Draftable;
            return await Draftable.destroy({
                where: {
                    draftable_id: this.id,
                    draftable_type: 'Blog',
                    draft_id: draftIds
                }
            });
        }

        // Instance method to set drafts (polymorphic)
        async setDrafts(draftIds) {
            // Remove existing drafts
            await this.removeDrafts(draftIds);
            // Add new drafts
            if (draftIds && draftIds.length > 0) {
                await this.addDrafts(draftIds);
            }
        }

        // Instance method to add FAQs (polymorphic)
        async addFaqs(faqIds) {
            const Faqable = this.sequelize.models.Faqable;
            const faqables = faqIds.map(faqId => ({
                faq_id: faqId,
                faqable_id: this.id,
                faqable_type: 'Blog'
            }));
            return await Faqable.bulkCreate(faqables);
        }

        // Instance method to remove FAQs (polymorphic)
        async removeFaqs(faqIds) {
            const Faqable = this.sequelize.models.Faqable;
            return await Faqable.destroy({
                where: {
                    faqable_id: this.id,
                    faqable_type: 'Blog',
                    faq_id: faqIds
                }
            });
        }

        // Instance method to set FAQs (polymorphic)
        async setFaqs(faqIds) {
            // Remove existing FAQs
            await this.removeFaqs(faqIds);
            // Add new FAQs
            if (faqIds && faqIds.length > 0) {
                await this.addFaqs(faqIds);
            }
        }
    }
    Blog.init({
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        tagline: DataTypes.STRING,
        description: DataTypes.TEXT('long'),
        file_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            references: {
                model: 'files',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to file in files table'
        },
        status: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0 // 0 = draft, 1 = published
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        author: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'adminusers',
                key: 'id'
            }
        },
        createdBy: DataTypes.STRING,
        modifiedBy: DataTypes.STRING,
        publishedAt: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'Blog',
        tableName: 'blogs',
        hooks: {
            beforeCreate: async (blog) => {
                if (!blog.slug && blog.title) {
                    let baseSlug = slugify(blog.title);
                    let slug = baseSlug;
                    let counter = 1;

                    // Check for uniqueness
                    while (await Blog.findOne({ where: { slug } })) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    blog.slug = slug;
                }
                if (blog.status === 1 && !blog.publishedAt) {
                    blog.publishedAt = new Date();
                }
            },
            beforeUpdate: async (blog) => {
                if (blog.changed('title') && !blog.changed('slug')) {
                    let baseSlug = slugify(blog.title);
                    let slug = baseSlug;
                    let counter = 1;

                    // Check for uniqueness (excluding current record)
                    while (await Blog.findOne({ where: { slug, id: { [sequelize.Sequelize.Op.ne]: blog.id } } })) {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    blog.slug = slug;
                }
                if (blog.changed('status') && blog.status === 1 && !blog.publishedAt) {
                    blog.publishedAt = new Date();
                }
            }
            ,
            /**
             * Ensure polymorphic relations are cleaned when a Blog is deleted.
             * Note: Polymorphic join tables use constraints: false, so DB-level
             * cascades are not available. We remove related rows manually here.
             * 
             * Deletion strategy:
             * - Drafts: Delete (blog-specific)
             * - Categories/Tags: Keep (shared resources)
             * - Galleries: Keep (shared resources)
             */
            afterDestroy: async (blog, options) => {
                const { Categorizable, Taggable, Galleryable, Draftable, Draft, Faqable } = blog.sequelize.models;
                const tx = options && options.transaction ? options.transaction : undefined;
                const whereId = blog.id;

                // Get all drafts associated with this blog before deleting relationships
                const draftables = await Draftable.findAll({
                    where: { draftable_id: whereId, draftable_type: 'Blog' },
                    transaction: tx
                });
                const draftIds = draftables.map(da => da.draft_id);

                // Delete polymorphic relationships
                await Promise.all([
                    Categorizable.destroy({ where: { categorizable_id: whereId, categorizable_type: 'Blog' }, transaction: tx }),
                    Taggable.destroy({ where: { taggable_id: whereId, taggable_type: 'Blog' }, transaction: tx }),
                    Galleryable.destroy({ where: { galleryable_id: whereId, galleryable_type: 'Blog' }, transaction: tx }),
                    Draftable.destroy({ where: { draftable_id: whereId, draftable_type: 'Blog' }, transaction: tx }),
                    Faqable.destroy({ where: { faqable_id: whereId, faqable_type: 'Blog' }, transaction: tx })
                ]);

                // Delete associated drafts (blog-specific, not shared)
                if (draftIds.length > 0) {
                    await Draft.destroy({
                        where: { id: draftIds },
                        transaction: tx
                    });
                }
            }
        }
    });
    return Blog;
};
