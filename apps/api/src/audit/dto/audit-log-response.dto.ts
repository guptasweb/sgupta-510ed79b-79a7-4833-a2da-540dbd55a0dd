import { AuditLog } from '../audit-log.entity';

export class AuditLogResponseDto {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  timestamp: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };

  static fromEntity(auditLog: AuditLog): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = auditLog.id;
    dto.userId = auditLog.userId;
    dto.action = auditLog.action;
    dto.resource = auditLog.resource;
    dto.resourceId = auditLog.resourceId;
    dto.details = auditLog.details;
    dto.timestamp = auditLog.timestamp;

    if (auditLog.user) {
      dto.user = {
        id: auditLog.user.id,
        email: auditLog.user.email,
        firstName: auditLog.user.firstName,
        lastName: auditLog.user.lastName,
      };
    }

    return dto;
  }
}
