/**
 * Audit Service
 * Handles audit logging for PrintShop OS
 */

interface Strapi {
  log: {
    info: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
  };
  documents: (type: string) => {
    findOne?: (params: { documentId: string; populate?: string[] }) => Promise<unknown>;
    findMany?: (params?: { filters?: Record<string, unknown>; sort?: Record<string, string>; pagination?: { page: number; pageSize: number } }) => Promise<unknown[]>;
    create?: (params: { data: Record<string, unknown> }) => Promise<unknown>;
  };
}

export interface AuditLogEntry {
  id?: number;
  documentId?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  user_name?: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp?: string;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  strapi: Strapi,
  entry: Omit<AuditLogEntry, 'id' | 'documentId' | 'timestamp'>
): Promise<AuditLogEntry> {
  const auditData = {
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    user_id: entry.user_id,
    user_name: entry.user_name,
    changes: entry.changes,
    ip_address: entry.ip_address,
    user_agent: entry.user_agent,
    timestamp: new Date().toISOString(),
  };

  const documents = strapi.documents('api::audit-log.audit-log');
  
  if (!documents.create) {
    throw new Error('Create method not available');
  }
  
  const auditLog = await documents.create({ data: auditData }) as AuditLogEntry;
  
  strapi.log.info(`Audit log created: ${entry.action} on ${entry.entity_type}:${entry.entity_id}`);
  
  return auditLog;
}

/**
 * Get audit logs with filters and pagination
 */
export async function getAuditLogs(
  strapi: Strapi,
  filters?: AuditLogFilters,
  pagination?: PaginationOptions
): Promise<{ data: AuditLogEntry[]; pagination: { page: number; pageSize: number; total: number } }> {
  const documents = strapi.documents('api::audit-log.audit-log');
  
  if (!documents.findMany) {
    throw new Error('FindMany method not available');
  }

  const queryFilters: Record<string, unknown> = {};
  
  if (filters?.action) {
    queryFilters.action = { $eq: filters.action };
  }
  if (filters?.entity_type) {
    queryFilters.entity_type = { $eq: filters.entity_type };
  }
  if (filters?.entity_id) {
    queryFilters.entity_id = { $eq: filters.entity_id };
  }
  if (filters?.user_id) {
    queryFilters.user_id = { $eq: filters.user_id };
  }
  if (filters?.start_date || filters?.end_date) {
    queryFilters.timestamp = {};
    if (filters.start_date) {
      (queryFilters.timestamp as Record<string, string>).$gte = filters.start_date;
    }
    if (filters.end_date) {
      (queryFilters.timestamp as Record<string, string>).$lte = filters.end_date;
    }
  }

  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;

  const logs = await documents.findMany({
    filters: queryFilters,
    sort: { timestamp: 'desc' },
    pagination: { page, pageSize },
  }) as AuditLogEntry[];

  return {
    data: logs,
    pagination: {
      page,
      pageSize,
      total: logs.length, // In real implementation, would be separate count query
    },
  };
}

/**
 * Create audit log for entity creation
 */
export async function logCreate(
  strapi: Strapi,
  entityType: string,
  entityId: string,
  userId?: string,
  userName?: string
): Promise<AuditLogEntry> {
  return createAuditLog(strapi, {
    action: 'CREATE',
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    user_name: userName,
  });
}

/**
 * Create audit log for entity update
 */
export async function logUpdate(
  strapi: Strapi,
  entityType: string,
  entityId: string,
  changes: Record<string, unknown>,
  userId?: string,
  userName?: string
): Promise<AuditLogEntry> {
  return createAuditLog(strapi, {
    action: 'UPDATE',
    entity_type: entityType,
    entity_id: entityId,
    changes,
    user_id: userId,
    user_name: userName,
  });
}

/**
 * Create audit log for entity deletion
 */
export async function logDelete(
  strapi: Strapi,
  entityType: string,
  entityId: string,
  userId?: string,
  userName?: string
): Promise<AuditLogEntry> {
  return createAuditLog(strapi, {
    action: 'DELETE',
    entity_type: entityType,
    entity_id: entityId,
    user_id: userId,
    user_name: userName,
  });
}
