'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('faqs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            question: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            ans: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: '0: Inactive, 1: Active'
            },
            sort_order: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true
            },
            is_global: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: '0: No, 1: Yes'
            },
            createdBy: {
                type: Sequelize.STRING,
                allowNull: true
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

        // Add indexes
        await queryInterface.addIndex('faqs', ['status']);
        await queryInterface.addIndex('faqs', ['is_global']);
        await queryInterface.addIndex('faqs', ['sort_order']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('faqs');
    }
};
