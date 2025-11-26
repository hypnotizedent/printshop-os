/**
 * sop controller
 * Simplified - using default Strapi 5 controller
 */

import { factories } from '@strapi/strapi';

// Use default controller - custom methods temporarily disabled due to TypeScript strictness
export default factories.createCoreController('api::sop.sop');
