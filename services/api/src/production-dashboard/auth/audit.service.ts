/**
 * Audit Logging Service
 * Tracks sensitive actions for compliance and security
 */

export interface AuditLogEntry {
  userId: string;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  success?: boolean;
  errorMessage?: string;
}

/**
 * In-memory audit log store (in production, this would be a database)
 */
class AuditService {
  private logs: AuditLogEntry[] = [];

  /**
   * Log an audit entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date()
    };
    
    this.logs.push(logEntry);
    
    // In production, this would write to a database
    // For now, we'll keep it in memory for testing
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }

  /**
   * Query audit logs
   */
  async query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let results = [...this.logs];

    if (filters.userId) {
      results = results.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      results = results.filter(log => log.action === filters.action);
    }

    if (filters.resource) {
      results = results.filter(log => log.resource === filters.resource);
    }

    if (filters.startDate) {
      results = results.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get logs for a specific user
   */
  async getUserLogs(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.query({ userId, limit });
  }

  /**
   * Get recent logs
   */
  async getRecentLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    return this.query({ limit });
  }

  /**
   * Clear all logs (for testing)
   */
  async clear(): Promise<void> {
    this.logs = [];
  }

  /**
   * Get total log count
   */
  getLogCount(): number {
    return this.logs.length;
  }
}

// Export singleton instance
export const auditService = new AuditService();
