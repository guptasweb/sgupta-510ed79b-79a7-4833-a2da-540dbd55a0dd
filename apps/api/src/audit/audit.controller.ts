import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { FilterAuditLogDto } from './dto/filter-audit-log.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, CurrentUser, Permissions } from '@task-management-system/auth';
import { User } from '../auth/user.entity';

@Controller('audit-log')
@UseGuards(PermissionsGuard)
@RequirePermissions(Permissions.AUDIT_READ)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query() filterDto: FilterAuditLogDto,
    @CurrentUser() user: User
  ): Promise<{
    logs: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.auditService.findAll(filterDto, user);

    return {
      logs: result.logs.map((log) => AuditLogResponseDto.fromEntity(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
