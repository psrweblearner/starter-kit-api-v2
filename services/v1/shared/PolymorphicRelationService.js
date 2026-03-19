'use strict';
const models = require('../../../models');

/**
 * PolymorphicRelationService
 * Unified service to handle polymorphic many-to-many relationships for:
 * - Tags (Taggable)
 * - Categories (Categorizable)
 * - Gallery (Galleryable)
 * - Drafts (Draftable)
 * 
 * Used for models like Blog, Service, Property, etc.
 */
class PolymorphicRelationService {
    static RELATION_CONFIGS = {
        tags: {
            pivotModel: 'Taggable',
            foreignKey: 'tag_id',
            idKey: 'taggable_id',
            typeKey: 'taggable_type'
        },
        categories: {
            pivotModel: 'Categorizable',
            foreignKey: 'category_id',
            idKey: 'categorizable_id',
            typeKey: 'categorizable_type'
        },
        gallery: {
            pivotModel: 'Galleryable',
            foreignKey: 'gallery_id',
            idKey: 'galleryable_id',
            typeKey: 'galleryable_type'
        },
        drafts: {
            pivotModel: 'Draftable',
            foreignKey: 'draft_id',
            idKey: 'draftable_id',
            typeKey: 'draftable_type'
        },
        faqs: {
            pivotModel: 'Faqable',
            foreignKey: 'faq_id',
            idKey: 'faqable_id',
            typeKey: 'faqable_type'
        }
    };

    /**
     * Synchronize relations by replacing existing ones with a new set of IDs.
     * 
     * @param {Object} instance - The main model instance (e.g., Blog)
     * @param {string} type - The relation type ('tags', 'categories', 'gallery', 'drafts')
     * @param {Array<number|string>} ids - Array of related record IDs
     * @returns {Promise<void>}
     */
    async syncRelations(instance, type, ids) {
        const config = PolymorphicRelationService.RELATION_CONFIGS[type];
        if (!config) throw new Error(`Invalid relation type: ${type}`);

        const Pivot = models[config.pivotModel];
        const instanceId = instance.id;
        const instanceType = instance.constructor.name;

        // Normalize ids to an array
        const normalizedIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);

        // 1. Remove existing relations for this instance and type
        await Pivot.destroy({
            where: {
                [config.idKey]: instanceId,
                [config.typeKey]: instanceType
            }
        });

        // 2. Add new relations if IDs are provided
        if (normalizedIds.length > 0) {
            const records = [...new Set(normalizedIds)].map(id => ({
                [config.foreignKey]: id,
                [config.idKey]: instanceId,
                [config.typeKey]: instanceType
            }));
            await Pivot.bulkCreate(records);
        }
    }

    /**
     * Attach new relations without removing existing ones.
     * 
     * @param {Object} instance - The main model instance
     * @param {string} type - The relation type
     * @param {Array<number|string>} ids - Array of related record IDs
     * @returns {Promise<void>}
     */
    async attachRelations(instance, type, ids) {
        const config = PolymorphicRelationService.RELATION_CONFIGS[type];
        if (!config) throw new Error(`Invalid relation type: ${type}`);

        // Normalize ids to an array
        const normalizedIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
        if (normalizedIds.length === 0) return;

        const Pivot = models[config.pivotModel];
        const instanceId = instance.id;
        const instanceType = instance.constructor.name;

        // Filter out IDs that are already attached
        const existing = await Pivot.findAll({
            where: {
                [config.idKey]: instanceId,
                [config.typeKey]: instanceType,
                [config.foreignKey]: normalizedIds
            },
            attributes: [config.foreignKey]
        });

        const existingIds = existing.map(e => e[config.foreignKey]);
        const newIds = normalizedIds.filter(id => !existingIds.includes(Number(id)) && !existingIds.includes(String(id)));

        if (newIds.length > 0) {
            const records = [...new Set(newIds)].map(id => ({
                [config.foreignKey]: id,
                [config.idKey]: instanceId,
                [config.typeKey]: instanceType
            }));
            await Pivot.bulkCreate(records);
        }
    }

    /**
     * Detach specific relations.
     * 
     * @param {Object} instance - The main model instance
     * @param {string} type - The relation type
     * @param {Array<number|string>} ids - Array of related record IDs (optional, if empty detaches all)
     * @returns {Promise<void>}
     */
    async detachRelations(instance, type, ids) {
        const config = PolymorphicRelationService.RELATION_CONFIGS[type];
        if (!config) throw new Error(`Invalid relation type: ${type}`);

        const Pivot = models[config.pivotModel];
        const instanceId = instance.id;
        const instanceType = instance.constructor.name;

        const where = {
            [config.idKey]: instanceId,
            [config.typeKey]: instanceType
        };

        // Normalize ids to an array if provided
        if (ids) {
            const normalizedIds = Array.isArray(ids) ? ids : [ids];
            if (normalizedIds.length > 0) {
                where[config.foreignKey] = normalizedIds;
            }
        }

        await Pivot.destroy({ where });
    }

    /**
     * Get all related records for a specific instance and type.
     * 
     * @param {Object} instance - The main model instance
     * @param {string} type - The relation type
     * @param {Object} options - Additional query options for the related model
     * @returns {Promise<Array<Object>>}
     */
    async getRelated(instance, type, options = {}) {
        const config = PolymorphicRelationService.RELATION_CONFIGS[type];
        if (!config) throw new Error(`Invalid relation type: ${type}`);

        // Simplified: use the association if defined, or query the pivot model then the target model
        // Since associations might vary by 'as' name, we use the instance method to find related

        const relationMap = {
            tags: 'tags',
            categories: 'categories',
            gallery: 'galleries', // Assuming pluralization or specific 'as'
            drafts: 'drafts',
            faqs: 'faqs'
        };

        const associationAlias = relationMap[type] || type;

        if (instance[associationAlias] && typeof instance[`get${associationAlias.charAt(0).toUpperCase() + associationAlias.slice(1)}`] === 'function') {
            return await instance[`get${associationAlias.charAt(0).toUpperCase() + associationAlias.slice(1)}`](options);
        }

        // Fallback: Query via Pivot
        const Pivot = models[config.pivotModel];
        const pivotResults = await Pivot.findAll({
            where: {
                [config.idKey]: instance.id,
                [config.typeKey]: instance.constructor.name
            },
            attributes: [config.foreignKey]
        });

        const relatedIds = pivotResults.map(p => p[config.foreignKey]);
        if (relatedIds.length === 0) return [];

        const TargetModelName = type.charAt(0).toUpperCase() + type.slice(1).replace(/s$/, ''); // Very naive
        const TargetModel = models[TargetModelName] || models[type.charAt(0).toUpperCase() + type.slice(1)];

        if (!TargetModel) throw new Error(`Target model not found for type: ${type}`);

        return await TargetModel.findAll({
            where: { id: relatedIds },
            ...options
        });
    }
}

module.exports = new PolymorphicRelationService();
