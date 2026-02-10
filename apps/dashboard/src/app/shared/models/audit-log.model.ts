/**
 * Audit log entry from the API (GET /api/audit-log).
 * Used by the audit feature and can be reused if other features need to display audit data.
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  timestamp: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}
