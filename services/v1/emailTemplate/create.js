// services/v1/emailTemplate/create.js
'use strict';
const { EmailTemplate } = require('../../../models');
module.exports = async (req) => {
    const { module,operation,userBody,adminBody,userSubject,adminSubject,description,mail,attchment,attchmentTo,mailTo,mailField } = req.body;
    const user = req.user?.id || 'system';
    await EmailTemplate.create({ module,operation,userBody,adminBody,userSubject,adminSubject,description,mail,attchment,attchmentTo,mailTo,mailField,createdBy:user});
    return;
};
