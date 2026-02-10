import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TaskResourceGuard } from './task-resource.guard';
import { TasksService } from '../tasks.service';

describe('TaskResourceGuard', () => {
  let guard: TaskResourceGuard;
  let tasksService: jest.Mocked<TasksService>;

  const createContext = (params: Record<string, string> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ params }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    tasksService = {
      getOrganizationIdByTaskId: jest.fn(),
    } as any;
    guard = new TaskResourceGuard(tasksService);
    jest.clearAllMocks();
  });

  it('should allow through when params.id is missing', async () => {
    const context = createContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(tasksService.getOrganizationIdByTaskId).not.toHaveBeenCalled();
  });

  it('should set request.organizationId when task exists', async () => {
    (tasksService.getOrganizationIdByTaskId as jest.Mock).mockResolvedValue('org-123');
    const request = { params: { id: 'task-uuid' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request).toHaveProperty('organizationId', 'org-123');
    expect(tasksService.getOrganizationIdByTaskId).toHaveBeenCalledWith('task-uuid');
  });

  it('should throw ForbiddenException when task does not exist (avoid leaking resource existence)', async () => {
    (tasksService.getOrganizationIdByTaskId as jest.Mock).mockResolvedValue(null);
    const context = createContext({ id: 'missing-uuid' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Access denied');
  });
});
