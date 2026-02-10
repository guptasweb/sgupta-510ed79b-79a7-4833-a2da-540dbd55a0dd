import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { User } from '../auth/user.entity';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = { id: 'user-uuid', organizationId: 'org-uuid' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return logs with total, page, limit', async () => {
      const filter = { page: 1, limit: 10 };
      (auditService.findAll as jest.Mock).mockResolvedValue({
        logs: [{ id: 'log-1', action: 'create', resourceType: 'task' }],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll(filter, mockUser);

      expect(auditService.findAll).toHaveBeenCalledWith(filter, mockUser);
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
