'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cold_outreach_rules', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rule_name: { type: Sequelize.STRING(180), allowNull: false },
      filters: { type: Sequelize.JSON, allowNull: false },
      run_status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      last_run_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('cold_outreach_leads', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      rule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cold_outreach_rules', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      place_id: { type: Sequelize.STRING(255), allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: true },
      rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      review_count: { type: Sequelize.INTEGER, allowNull: true },
      phone: { type: Sequelize.STRING(80), allowNull: true },
      website: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.STRING(40), allowNull: true },
      lead_score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      tags: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('cold_outreach_leads', ['rule_id', 'place_id'], {
      unique: true,
      name: 'uniq_cold_outreach_rule_place',
    });

    await queryInterface.createTable('cold_outreach_lead_contacts', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      lead_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cold_outreach_leads', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(80), allowNull: true },
      source: {
        type: Sequelize.ENUM('scraped', 'manual', 'gmb'),
        allowNull: false,
        defaultValue: 'scraped',
      },
      is_valid_mx: { type: Sequelize.BOOLEAN, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cold_outreach_lead_contacts');
    await queryInterface.dropTable('cold_outreach_leads');
    await queryInterface.dropTable('cold_outreach_rules');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_cold_outreach_rules_run_status;').catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_cold_outreach_lead_contacts_source;').catch(() => {});
  },
};
