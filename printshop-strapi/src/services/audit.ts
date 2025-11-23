/**
 * Audit Trail Service
 * Logs all workflow events and status changes
 */

import type { Core } from '@strapi/strapi';

export interface AuditLogEntry {
  entityType: 'quote' | 'order' | 'job';
  entityId: number;
  event: string;
  oldStatus?: string;
  newStatus?: string;
  metadata?: Record<string, any>;
  userId?: number;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  strapi: Core.Strapi,
  entry: AuditLogEntry
): Promise<any> {
  try {
    const auditLog = await strapi.documents('api::audit-log.audit-log').create({
      data: {
        ...entry,
        timestamp: new Date().toISOString(),
      },
    });

    strapi.log.info(`Audit log created: ${entry.event} for ${entry.entityType}:${entry.entityId}`);
    return auditLog;
  } catch (error) {
    strapi.log.error('Failed to create audit log:', error);
    throw error;
  }
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  strapi: Core.Strapi,
  entityType: 'quote' | 'order' | 'job',
  entityId: number
): Promise<any[]> {
  try {
    const logs = await strapi.documents('api::audit-log.audit-log').findMany({
      filters: {
        entityType,
        entityId,
      },
      sort: { timestamp: 'desc' },
    });

    return logs;
  } catch (error) {
    strapi.log.error('Failed to get audit logs:', error);
    return [];
  }
}

export default {
  createAuditLog,
  getAuditLogs,
};
