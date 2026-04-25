'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cold_outreach_lead_contacts', 'email');
    await queryInterface.removeColumn('cold_outreach_lead_contacts', 'is_valid_mx');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('cold_outreach_lead_contacts', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('cold_outreach_lead_contacts', 'is_valid_mx', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });
  },
};
