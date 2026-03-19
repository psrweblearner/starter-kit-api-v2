'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('AdminSessions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            adminUserId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'AdminUsers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            refreshToken: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            finger: {
                type: Sequelize.STRING,
                allowNull: true
            },
            expiresAt: {
                type: Sequelize.DATE,
                allowNull: false
            },
            status: {
                type: Sequelize.INTEGER,
                defaultValue: 1
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add index for faster session lookups
        await queryInterface.addIndex('AdminSessions', ['adminUserId', 'status']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('AdminSessions');
    }
};
