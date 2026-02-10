import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './task.entity';
import { User } from '../auth/user.entity';
import { Organization } from '../permissions/entities/organization.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { ReorderTaskDto } from './dto/reorder-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly permissionsService: PermissionsService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Resolve task's organizationId by id (for resource-based guards). Returns null if not found.
   */
  async getOrganizationIdByTaskId(taskId: string): Promise<string | null> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      select: ['organizationId'],
    });
    return task?.organizationId ?? null;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<TaskResponseDto> {
    const roleName = user.role?.name?.toLowerCase() || 'viewer';

    // Admin: can only create in their own organization (no parent or child orgs)
    if (roleName === 'admin') {
      if (createTaskDto.organizationId !== user.organizationId) {
        throw new ForbiddenException('Admins can only create tasks in their own organization');
      }
    } else {
      // Owner: org or child orgs; Viewer: guarded by task:create permission
      const hasAccess = await this.permissionsService.hasOrganizationAccess(
        user.organizationId,
        createTaskDto.organizationId
      );
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this organization');
      }
    }

    // Use a transaction to prevent race conditions when calculating order
    return await this.taskRepository.manager.transaction(async (transactionalEntityManager) => {
      // Get the maximum order value for the organization (use find to avoid query-builder locking, which SQLite does not support)
      const existing = await transactionalEntityManager.find(Task, {
        where: { organizationId: createTaskDto.organizationId },
        order: { order: 'DESC' },
        take: 1,
        select: ['order'],
      });
      const maxOrder = existing.length > 0 ? existing[0].order : -1;
      const newOrder = Math.max(0, maxOrder + 1);

      const task = transactionalEntityManager.create(Task, {
        title: createTaskDto.title,
        description: createTaskDto.description ?? null,
        status: createTaskDto.status || TaskStatus.PENDING,
        category: createTaskDto.category ?? null,
        priority: createTaskDto.priority || TaskPriority.MEDIUM,
        organizationId: createTaskDto.organizationId,
        ownerId: user.id,
        order: newOrder,
      });

      const savedTask = await transactionalEntityManager.save(Task, task);
      this.logger.log(`Task ${savedTask.id} created by user ${user.id} with order ${newOrder}`);

      // Reload with owner so response includes creator display name
      const withOwner = await transactionalEntityManager.findOne(Task, {
        where: { id: savedTask.id },
        relations: ['owner'],
      });
      this.auditService
        .logCreate(user.id, 'task', savedTask.id, { title: createTaskDto.title })
        .catch((err) => this.logger.warn(`Audit log failed: ${err?.message}`));
      return TaskResponseDto.fromEntity(withOwner ?? savedTask);
    });
  }

  async findAll(filterDto: FilterTaskDto, user: User): Promise<{
    tasks: TaskResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const skip = (page - 1) * limit;

    // Get user's role name
    const roleName = user.role?.name?.toLowerCase() || 'viewer';

    // Build query based on role
    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (roleName === 'owner') {
      // Owner: all tasks in organization and child organizations
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(user.organizationId);
      queryBuilder.where('task.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds });
    } else if (roleName === 'admin') {
      // Admin: all tasks in organization
      queryBuilder.where('task.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    } else {
      // Viewer: only own tasks
      queryBuilder.where('task.ownerId = :ownerId', { ownerId: user.id });
    }

    // Apply filters
    if (filterDto.status) {
      queryBuilder.andWhere('task.status = :status', { status: filterDto.status });
    }

    if (filterDto.category) {
      queryBuilder.andWhere('task.category = :category', { category: filterDto.category });
    }

    if (filterDto.priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority: filterDto.priority });
    }

    if (filterDto.ownerId) {
      // Only allow filtering by ownerId if user has permission
      if (roleName === 'owner' || roleName === 'admin') {
        queryBuilder.andWhere('task.ownerId = :ownerId', { ownerId: filterDto.ownerId });
      } else if (filterDto.ownerId !== user.id) {
        throw new ForbiddenException('You can only filter by your own tasks');
      }
    }

    if (filterDto.organizationId) {
      // Admin: cannot filter by parent or child orgs — own org only
      if (roleName === 'admin') {
        if (filterDto.organizationId !== user.organizationId) {
          throw new ForbiddenException('Admins can only access tasks in their own organization');
        }
      } else {
        const hasAccess = await this.permissionsService.hasOrganizationAccess(
          user.organizationId,
          filterDto.organizationId
        );
        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this organization');
        }
      }
      queryBuilder.andWhere('task.organizationId = :organizationId', {
        organizationId: filterDto.organizationId,
      });
    }

    // Order by order field, then by createdAt
    queryBuilder.orderBy('task.order', 'ASC').addOrderBy('task.createdAt', 'DESC');

    // Load owner for creator display
    queryBuilder.leftJoinAndSelect('task.owner', 'owner');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const tasks = await queryBuilder.getMany();
    const taskDtos = tasks.map((task) => TaskResponseDto.fromEntity(task));

    return {
      tasks: taskDtos,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, user: User): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check access control
    await this.checkTaskAccess(task, user);

    return TaskResponseDto.fromEntity(task);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check access control
    await this.checkTaskAccess(task, user);

    // Viewer has read-only access (no task:update); guard blocks before this
    const roleName = user.role?.name?.toLowerCase() || 'viewer';
    if (roleName === 'viewer') {
      throw new ForbiddenException('Viewers have read-only access and cannot update tasks');
    }

    // Strip organizationId so task org is never changed via update
    const { organizationId: _omit, ...payload } = updateTaskDto as UpdateTaskDto & { organizationId?: string };
    Object.assign(task, payload);
    await this.taskRepository.save(task);

    this.logger.log(`Task ${id} updated by user ${user.id}`);

    // Reload with owner so response always includes creator display name
    const withOwner = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    this.auditService
      .logUpdate(user.id, 'task', id, { fields: Object.keys(payload) })
      .catch((err) => this.logger.warn(`Audit log failed: ${err?.message}`));
    return TaskResponseDto.fromEntity(withOwner ?? task);
  }

  async delete(id: string, user: User): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check access control
    await this.checkTaskAccess(task, user);

    const roleName = user.role?.name?.toLowerCase() || 'viewer';
    if (roleName === 'viewer') {
      throw new ForbiddenException('Viewers have read-only access and cannot delete tasks');
    }

    await this.taskRepository.remove(task);
    this.logger.log(`Task ${id} deleted by user ${user.id}`);
    this.auditService
      .logDelete(user.id, 'task', id, { title: task.title })
      .catch((err) => this.logger.warn(`Audit log failed: ${err?.message}`));
  }

  async reorder(
    taskId: string,
    reorderDto: ReorderTaskDto,
    user: User
  ): Promise<TaskResponseDto> {
    return await this.taskRepository.manager.transaction(async (transactionalEntityManager) => {
      const task = await transactionalEntityManager.findOne(Task, {
        where: { id: taskId },
        relations: ['owner', 'organization'],
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }

      // Check access control
      await this.checkTaskAccess(task, user);

      const organizationId = task.organizationId;
      const ownerId = task.ownerId;

      // Load all tasks for this owner in this organization in current order
      const tasksForOwner = await transactionalEntityManager.find(Task, {
        where: { organizationId, ownerId },
        order: { order: 'ASC', createdAt: 'ASC' },
      });

      const currentIndex = tasksForOwner.findIndex((t) => t.id === taskId);
      if (currentIndex === -1) {
        throw new NotFoundException(`Task with ID ${taskId} not found in owner's task list`);
      }

      // Clamp target index to valid range. Allow length so "drop after last" works (CDK can send currentIndex === length).
      let targetIndex = reorderDto.order;
      if (targetIndex < 0) {
        targetIndex = 0;
      }
      if (targetIndex > tasksForOwner.length) {
        targetIndex = tasksForOwner.length;
      }

      if (currentIndex === targetIndex) {
        const withOwner = await transactionalEntityManager.findOne(Task, {
          where: { id: taskId },
          relations: ['owner'],
        });
        return TaskResponseDto.fromEntity(withOwner ?? task);
      }

      // Reorder in-memory (indices within this owner's list)
      const [moved] = tasksForOwner.splice(currentIndex, 1);
      tasksForOwner.splice(targetIndex, 0, moved);

      // Build a map from task id to its final index (0..n-1) in this owner's list
      const finalIndexById = new Map<string, number>();
      tasksForOwner.forEach((t, index) => {
        finalIndexById.set(t.id, index);
      });

      // Phase 1: move all tasks for this owner/org into a "safe" range above any existing order
      const existingOrders = tasksForOwner.map((t) => t.order ?? 0);
      const maxExistingOrder = existingOrders.length
        ? Math.max(...existingOrders)
        : 0;
      const offset = maxExistingOrder + tasksForOwner.length + 10;

      for (const t of tasksForOwner) {
        const finalIndex = finalIndexById.get(t.id)!;
        // Put each task into a unique high range value so we never collide
        t.order = offset + finalIndex;
        await transactionalEntityManager.save(Task, t);
      }

      // Phase 2: assign final contiguous order values 0..n-1 within this owner's list
      for (const t of tasksForOwner) {
        const finalIndex = finalIndexById.get(t.id)!;
        t.order = finalIndex;
        await transactionalEntityManager.save(Task, t);
      }

      this.logger.log(
        `Task ${taskId} reordered from index ${currentIndex} to ${targetIndex} by user ${user.id}`
      );

      // Reload with owner so response always includes creator display name
      const withOwner = await transactionalEntityManager.findOne(Task, {
        where: { id: taskId },
        relations: ['owner'],
      });
      return TaskResponseDto.fromEntity(withOwner ?? task);
    });
  }

  /**
   * Check if user has access to a task based on role and organization
   */
  private async checkTaskAccess(task: Task, user: User): Promise<void> {
    const roleName = user.role?.name?.toLowerCase() || 'viewer';

    if (roleName === 'owner') {
      // Owner: check if task is in organization or child organizations
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(user.organizationId);
      if (!accessibleOrgIds.includes(task.organizationId)) {
        throw new ForbiddenException('You do not have access to this task');
      }
    } else if (roleName === 'admin') {
      // Admin: check if task is in same organization
      if (task.organizationId !== user.organizationId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    } else {
      // Viewer: can only access own tasks
      if (task.ownerId !== user.id) {
        throw new ForbiddenException('You can only access your own tasks');
      }
    }
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

  /**
   * Fix duplicate order numbers within each organization
   * This method should be run once to fix existing data before the unique constraint is applied
   */
  async fixDuplicateOrders(): Promise<void> {
    this.logger.log('Starting to fix duplicate order numbers...');

    // Get all organizations
    const organizations = await this.organizationRepository.find({
      select: ['id'],
    });

    for (const org of organizations) {
      // Get all tasks for this organization ordered by createdAt (to preserve creation order)
      const tasks = await this.taskRepository.find({
        where: { organizationId: org.id },
        order: { createdAt: 'ASC' },
      });

      // Reassign order numbers sequentially starting from 0
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].order !== i) {
          tasks[i].order = i;
          await this.taskRepository.save(tasks[i]);
        }
      }

      this.logger.log(`Fixed orders for organization ${org.id}: ${tasks.length} tasks reordered`);
    }

    this.logger.log('Finished fixing duplicate order numbers');
  }
}
