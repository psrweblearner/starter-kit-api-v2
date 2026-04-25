'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('cold_outreach_leads', ['rule_id', 'created_at'], {
      name: 'idx_cold_outreach_leads_rule_created_at',
    });

    await queryInterface.addIndex('cold_outreach_lead_contacts', ['lead_id'], {
      name: 'idx_cold_outreach_lead_contacts_lead_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('cold_outreach_lead_contacts', 'idx_cold_outreach_lead_contacts_lead_id');
    await queryInterface.removeIndex('cold_outreach_leads', 'idx_cold_outreach_leads_rule_created_at');
  },
};
