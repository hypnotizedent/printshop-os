'use strict';

/**
 * file-event service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::file-event.file-event');
