'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cold_outreach_leads', 'source_keyword', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'status',
    });

    await queryInterface.addColumn('cold_outreach_leads', 'source_location', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'source_keyword',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cold_outreach_leads', 'source_location');
    await queryInterface.removeColumn('cold_outreach_leads', 'source_keyword');
  },
};
