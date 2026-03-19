'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('faqables', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            faq_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'faqs',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            faqable_id: {
                type: Sequelize.STRING(255),
                allowNull: false,
                comment: 'ID of the related model (blog, service, property, etc.)'
            },
            faqable_type: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Model name (Blog, Service, Property, etc.)'
            },
            sort_order: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add unique constraint
        await queryInterface.addConstraint('faqables', {
            fields: ['faq_id', 'faqable_id', 'faqable_type'],
            type: 'unique',
            name: 'unique_faqable'
        });

        // Add indexes
        await queryInterface.addIndex('faqables', ['faq_id']);
        await queryInterface.addIndex('faqables', ['faqable_id']);
        await queryInterface.addIndex('faqables', ['faqable_type']);
        await queryInterface.addIndex('faqables', ['faqable_id', 'faqable_type']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('faqables');
    }
};
