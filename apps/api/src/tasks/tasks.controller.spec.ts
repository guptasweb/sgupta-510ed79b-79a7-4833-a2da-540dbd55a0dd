import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { User } from '../auth/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: jest.Mocked<TasksService>;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    roleId: 'role-uuid',
    organizationId: 'org-uuid',
    role: { name: 'admin' },
  } as User;

  const mockTaskResponse: TaskResponseDto = {
    id: 'task-uuid',
    title: 'Test Task',
    description: null,
    status: 'pending' as any,
    category: null,
    priority: 'medium' as any,
    order: 0,
    ownerId: mockUser.id,
    organizationId: mockUser.organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            reorder: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get(TasksService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with dto and user', async () => {
      const dto: CreateTaskDto = {
        title: 'New Task',
        organizationId: 'org-uuid',
      };
      (tasksService.create as jest.Mock).mockResolvedValue(mockTaskResponse);

      const result = await controller.create(dto, mockUser);

      expect(tasksService.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockTaskResponse);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with filter and user', async () => {
      const filter: FilterTaskDto = { page: 1, limit: 10 };
      (tasksService.findAll as jest.Mock).mockResolvedValue({
        tasks: [mockTaskResponse],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await controller.findAll(filter, mockUser);

      expect(tasksService.findAll).toHaveBeenCalledWith(filter, mockUser);
      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and user', async () => {
      (tasksService.findOne as jest.Mock).mockResolvedValue(mockTaskResponse);

      const result = await controller.findOne('task-uuid', mockUser);

      expect(tasksService.findOne).toHaveBeenCalledWith('task-uuid', mockUser);
      expect(result).toEqual(mockTaskResponse);
    });
  });

  describe('update', () => {
    it('should call service.update with id, dto and user', async () => {
      const dto: UpdateTaskDto = { title: 'Updated Title' };
      (tasksService.update as jest.Mock).mockResolvedValue({
        ...mockTaskResponse,
        title: dto.title,
      });

      const result = await controller.update('task-uuid', dto, mockUser);

      expect(tasksService.update).toHaveBeenCalledWith('task-uuid', dto, mockUser);
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should call service.delete with id and user', async () => {
      (tasksService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete('task-uuid', mockUser);

      expect(tasksService.delete).toHaveBeenCalledWith('task-uuid', mockUser);
    });
  });

  describe('reorder', () => {
    it('should call service.reorder with id, dto and user', async () => {
      const dto: ReorderTaskDto = { order: 2 };
      (tasksService.reorder as jest.Mock).mockResolvedValue(mockTaskResponse);

      const result = await controller.reorder('task-uuid', dto, mockUser);

      expect(tasksService.reorder).toHaveBeenCalledWith('task-uuid', dto, mockUser);
      expect(result).toEqual(mockTaskResponse);
    });
  });
});
