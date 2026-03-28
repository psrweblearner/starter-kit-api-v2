'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'EmailTemplates';
    const desc = await queryInterface.describeTable(table);
    if (!desc.triggerOn) {
      await queryInterface.addColumn(table, 'triggerOn', {
        type: Sequelize.ENUM('always', 'status_change', 'field_change', 'custom_condition'),
        allowNull: false,
        defaultValue: 'always'
      });
    }
    if (!desc.watchedFields) {
      await queryInterface.addColumn(table, 'watchedFields', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
    if (!desc.conditionRules) {
      await queryInterface.addColumn(table, 'conditionRules', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = 'EmailTemplates';
    const desc = await queryInterface.describeTable(table);
    if (desc.conditionRules) {
      await queryInterface.removeColumn(table, 'conditionRules');
    }
    if (desc.watchedFields) {
      await queryInterface.removeColumn(table, 'watchedFields');
    }
    if (desc.triggerOn) {
      await queryInterface.removeColumn(table, 'triggerOn');
    }
  }
};
