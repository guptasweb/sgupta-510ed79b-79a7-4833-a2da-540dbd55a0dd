import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { Organization } from '../permissions/entities/organization.entity';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';

export interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>
  ) {}

  async log(data: AuditLogData): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        details: data.details || null,
      });

      const saved = await this.auditLogRepository.save(auditLog);
      this.logger.debug(`Audit log created: ${data.action} on ${data.resource}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async logAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, any> | string | null
  ): Promise<AuditLog> {
    const detailsString =
      typeof details === 'string' ? details : details ? JSON.stringify(details) : null;

    return this.log({
      userId,
      action,
      resource,
      resourceId,
      details: detailsString,
    });
  }

  async logCreate(
    userId: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, any> | string | null
  ): Promise<AuditLog> {
    return this.logAction(userId, 'create', resource, resourceId, details);
  }

  async logRead(
    userId: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, any> | string | null
  ): Promise<AuditLog> {
    return this.logAction(userId, 'read', resource, resourceId, details);
  }

  async logUpdate(
    userId: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, any> | string | null
  ): Promise<AuditLog> {
    return this.logAction(userId, 'update', resource, resourceId, details);
  }

  async logDelete(
    userId: string,
    resource: string,
    resourceId?: string | null,
    details?: Record<string, any> | string | null
  ): Promise<AuditLog> {
    return this.logAction(userId, 'delete', resource, resourceId, details);
  }

  async findAll(
    filterDto: FilterAuditLogDto,
    user: { id: string; organizationId: string; role?: { name?: string } }
  ): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;
    const roleName = user.role?.name?.toLowerCase() || 'viewer';
    const isOwner = roleName === 'owner';
    const isViewer = roleName === 'viewer';

    // Scope by role: viewer = own logs only; admin = same org; owner = org tree
    let accessibleOrgIds: string[] = [user.organizationId];
    if (isOwner) {
      accessibleOrgIds = await this.getAccessibleOrganizationIds(user.organizationId);
    }

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .leftJoin('user.organization', 'organization')
      .where('organization.id IN (:...orgIds)', { orgIds: accessibleOrgIds });

    if (isViewer) {
      queryBuilder.andWhere('auditLog.userId = :currentUserId', { currentUserId: user.id });
    }

    // Apply filters
    if (filterDto.userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId: filterDto.userId });
    }

    if (filterDto.action) {
      queryBuilder.andWhere('auditLog.action = :action', { action: filterDto.action });
    }

    if (filterDto.resource) {
      queryBuilder.andWhere('auditLog.resource = :resource', { resource: filterDto.resource });
    }

    if (filterDto.resourceId) {
      queryBuilder.andWhere('auditLog.resourceId = :resourceId', {
        resourceId: filterDto.resourceId,
      });
    }

    if (filterDto.startDate) {
      queryBuilder.andWhere('auditLog.timestamp >= :startDate', {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere('auditLog.timestamp <= :endDate', {
        endDate: filterDto.endDate,
      });
    }

    // Order by timestamp descending (most recent first)
    queryBuilder.orderBy('auditLog.timestamp', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const logs = await queryBuilder.getMany();

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all accessible organization IDs (including child organizations)
   */
  private async getAccessibleOrganizationIds(organizationId: string): Promise<string[]> {
    const orgIds: string[] = [organizationId];

    const getChildOrganizations = async (parentId: string): Promise<void> => {
      const children = await this.organizationRepository.find({
        where: { parentId },
        select: ['id'],
      });

      for (const child of children) {
        orgIds.push(child.id);
        await getChildOrganizations(child.id);
      }
    };

    await getChildOrganizations(organizationId);
    return orgIds;
  }
}
