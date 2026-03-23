'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [
      {
        module: 'Otp',
        operation: 'create',
        triggerOn: 'custom_condition',
        userSubject: 'Forget password OTP: {{otp}}',
        adminSubject: '[OTP] Forget OTP generated for {{email}}',
        description: 'Dummy - Otp create forget type',
        userBody: '<p>Hi {{name}},</p><p>Your forget-password OTP is <strong>{{otp}}</strong>.</p>',
        adminBody: '<p>Forget OTP generated for {{email}} / {{mobile}}.</p>',
        mailTo: 'all',
        mail: '1',
        status: '1',
        watchedFields: null,
        conditionRules: JSON.stringify([
          { field: 'type', operator: 'eq', value: 'admin-forget-password' }
        ]),
        attchment: null,
        attchmentTo: 'all',
        mailField: JSON.stringify({ user: { field: 'email' }, admin: { field: 'email' } }),
        createdBy: 1,
        modifiedBy: null,
        createdAt: now,
        updatedAt: now
      },
      {
        module: 'Otp',
        operation: 'create',
        triggerOn: 'custom_condition',
        userSubject: 'Login OTP: {{otp}}',
        adminSubject: '[OTP] Login OTP generated for {{email}}',
        description: 'Dummy - Otp create login type',
        userBody: '<p>Hi {{name}},</p><p>Your login OTP is <strong>{{otp}}</strong>.</p>',
        adminBody: '<p>Login OTP generated for {{email}} / {{mobile}}.</p>',
        mailTo: 'all',
        mail: '1',
        status: '1',
        watchedFields: null,
        conditionRules: JSON.stringify([
          { field: 'type', operator: 'eq', value: 'login-otp' }
        ]),
        attchment: null,
        attchmentTo: 'all',
        mailField: JSON.stringify({ user: { field: 'email' }, admin: { field: 'email' } }),
        createdBy: 1,
        modifiedBy: null,
        createdAt: now,
        updatedAt: now
      },
      {
        module: 'Blog',
        operation: 'create',
        triggerOn: 'always',
        userSubject: 'New blog created: {{title}}',
        adminSubject: '[Blog] Created: {{title}}',
        description: 'Dummy - Blog create always',
        userBody: '<p>New blog created with title: {{title}}</p>',
        adminBody: '<p>Blog created with slug: {{slug}}</p>',
        mailTo: 'all',
        mail: '1',
        status: '1',
        watchedFields: JSON.stringify(['status', 'title', 'slug']),
        conditionRules: null,
        attchment: null,
        attchmentTo: 'all',
        mailField: JSON.stringify({ user: { field: 'email' }, admin: { field: 'email' } }),
        createdBy: 1,
        modifiedBy: null,
        createdAt: now,
        updatedAt: now
      },
      {
        module: 'Blog',
        operation: 'update',
        triggerOn: 'custom_condition',
        userSubject: 'Blog published: {{title}}',
        adminSubject: '[Blog] Status ON for {{title}}',
        description: 'Dummy - Blog update status 1',
        userBody: '<p>Your blog {{title}} is now published.</p>',
        adminBody: '<p>Blog {{id}} status changed to 1.</p>',
        mailTo: 'all',
        mail: '1',
        status: '1',
        watchedFields: null,
        conditionRules: JSON.stringify([
          { field: 'status', operator: 'eq', value: '1' }
        ]),
        attchment: null,
        attchmentTo: 'all',
        mailField: JSON.stringify({ user: { field: 'email' }, admin: { field: 'email' } }),
        createdBy: 1,
        modifiedBy: null,
        createdAt: now,
        updatedAt: now
      },
      {
        module: 'Blog',
        operation: 'update',
        triggerOn: 'custom_condition',
        userSubject: 'Blog unpublished: {{title}}',
        adminSubject: '[Blog] Status OFF for {{title}}',
        description: 'Dummy - Blog update status 0',
        userBody: '<p>Your blog {{title}} is now unpublished.</p>',
        adminBody: '<p>Blog {{id}} status changed to 0.</p>',
        mailTo: 'all',
        mail: '1',
        status: '1',
        watchedFields: null,
        conditionRules: JSON.stringify([
          { field: 'status', operator: 'eq', value: '0' }
        ]),
        attchment: null,
        attchmentTo: 'all',
        mailField: JSON.stringify({ user: { field: 'email' }, admin: { field: 'email' } }),
        createdBy: 1,
        modifiedBy: null,
        createdAt: now,
        updatedAt: now
      },
      {
        module: 'Blog',
        operation: 'update',
        triggerOn: 'field_change',
        userSubject: 'Blog slug changed: {{title}}',
        adminSubject: '[Blog] Slug changed for {{title}}',
        description: 'Dummy - Blog update slug change',
        userBody: '<p>Blog slug changed for {{title}}.</p>',
        adminBody: '<p>Slug changed on blog {{id}}.</p>',
        mailTo: 'all',
        mail: '1',
        status: '1',
        watchedFields: JSON.stringify(['slug']),
        conditionRules: null,
        attchment: null,
        attchmentTo: 'all',
        mailField: JSON.stringify({ user: { field: 'email' }, admin: { field: 'email' } }),
        createdBy: 1,
        modifiedBy: null,
        createdAt: now,
        updatedAt: now
      }
    ];

    const existing = await queryInterface.sequelize.query(
      "SELECT description FROM EmailTemplates WHERE description LIKE 'Dummy - %';",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const have = new Set(existing.map((item) => item.description));
    const insertRows = rows.filter((item) => !have.has(item.description));

    if (insertRows.length) {
      await queryInterface.bulkInsert('EmailTemplates', insertRows, {});
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('EmailTemplates', {
      description: [
        'Dummy - Otp create forget type',
        'Dummy - Otp create login type',
        'Dummy - Blog create always',
        'Dummy - Blog update status 1',
        'Dummy - Blog update status 0',
        'Dummy - Blog update slug change'
      ]
    }, {});
  }
};
