'use strict';
const { Faq } = require('../../../models');
module.exports = async (req) => {
    const { id } = req.params;
    const faq = await Faq.findByPk(id);
    if (!faq) {
        throw new Error('FAQ not found', 404);
    }

    await faq.destroy();
    return { message: 'FAQ deleted successfully' };
};
