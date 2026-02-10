import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permissions, DEFAULT_PERMISSION_SPECS } from '@task-management-system/auth';
import { TaskStatus, TaskCategory, TaskPriority } from '@task-management-system/data';
import { Permission } from '../../permissions/entities/permission.entity';
import { Organization } from '../../permissions/entities/organization.entity';
import { Role } from '../../permissions/entities/role.entity';
import { User } from '../../auth/user.entity';
import { Task } from '../../tasks/task.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) {}

  async run(): Promise<void> {
    const permissions = await this.seedPermissions();
    const permissionMap = this.buildPermissionMap(permissions);

    const { parentOrg, childOrg, marketingOrg } = await this.seedOrganizations();

    const parentRoles = await this.seedRolesForOrganization(parentOrg.id, permissionMap);
    const childRoles = await this.seedRolesForOrganization(childOrg.id, permissionMap);
    const marketingRoles = await this.seedRolesForOrganization(marketingOrg.id, permissionMap);

    const createdUsers = await this.seedUsers(
      parentOrg,
      childOrg,
      marketingOrg,
      parentRoles,
      childRoles,
      marketingRoles
    );

    await this.seedTasks(parentOrg, childOrg, marketingOrg, createdUsers);

    this.logger.log('Database seeding completed successfully.');
    this.logger.log('RBAC test users (password: password123):');
    this.logger.log('  - owner@techcorp.com          (Owner, TechCorp)');
    this.logger.log('  - viewer@techcorp.com         (Viewer, TechCorp)');
    this.logger.log('  - admin-child@techcorp.com   (Admin, Engineering)');
    this.logger.log('  - admin-marketing@techcorp.com (Admin, Marketing)');
  }

  private async seedPermissions(): Promise<Permission[]> {
    this.logger.log('Seeding permissions...');
    const permissions: Permission[] = [];

    for (const spec of DEFAULT_PERMISSION_SPECS) {
      let permission = await this.permissionRepository.findOne({
        where: { resource: spec.resource, action: spec.action },
      });
      if (!permission) {
        permission = this.permissionRepository.create(spec);
        permission = await this.permissionRepository.save(permission);
        this.logger.log(`Created permission: ${spec.resource}:${spec.action}`);
      } else {
        this.logger.log(`Permission already exists: ${spec.resource}:${spec.action}`);
      }
      permissions.push(permission);
    }

    return permissions;
  }

  private buildPermissionMap(permissions: Permission[]): Record<string, Permission> {
    return {
      [Permissions.TASK_CREATE]: permissions.find((p) => p.resource === 'task' && p.action === 'create')!,
      [Permissions.TASK_READ]: permissions.find((p) => p.resource === 'task' && p.action === 'read')!,
      [Permissions.TASK_UPDATE]: permissions.find((p) => p.resource === 'task' && p.action === 'update')!,
      [Permissions.TASK_DELETE]: permissions.find((p) => p.resource === 'task' && p.action === 'delete')!,
      [Permissions.AUDIT_READ]: permissions.find((p) => p.resource === 'audit' && p.action === 'read')!,
    };
  }

  private async seedOrganizations(): Promise<{
    parentOrg: Organization;
    childOrg: Organization;
    marketingOrg: Organization;
  }> {
    this.logger.log('Seeding organizations...');

    let parentOrg = await this.organizationRepository.findOne({ where: { name: 'TechCorp' } });
    if (!parentOrg) {
      parentOrg = this.organizationRepository.create({ name: 'TechCorp', parentId: null });
      parentOrg = await this.organizationRepository.save(parentOrg);
      this.logger.log('Created parent organization: TechCorp');
    } else {
      this.logger.log('Parent organization already exists: TechCorp');
    }

    let childOrg = await this.organizationRepository.findOne({ where: { name: 'Engineering' } });
    if (!childOrg) {
      childOrg = this.organizationRepository.create({ name: 'Engineering', parentId: parentOrg.id });
      childOrg = await this.organizationRepository.save(childOrg);
      this.logger.log('Created child organization: Engineering');
    } else {
      this.logger.log('Child organization already exists: Engineering');
    }

    let marketingOrg = await this.organizationRepository.findOne({ where: { name: 'Marketing' } });
    if (!marketingOrg) {
      marketingOrg = this.organizationRepository.create({ name: 'Marketing', parentId: parentOrg.id });
      marketingOrg = await this.organizationRepository.save(marketingOrg);
      this.logger.log('Created child organization: Marketing');
    } else {
      this.logger.log('Child organization already exists: Marketing');
    }

    return { parentOrg, childOrg, marketingOrg };
  }

  private async seedRolesForOrganization(
    organizationId: string,
    permissionMap: Record<string, Permission>
  ): Promise<{ owner: Role; admin: Role; viewer: Role }> {
    const roles = ['Owner', 'Admin', 'Viewer'];
    const rolePermissions: Record<string, Permission[]> = {
      Owner: [
        permissionMap[Permissions.TASK_CREATE],
        permissionMap[Permissions.TASK_READ],
        permissionMap[Permissions.TASK_UPDATE],
        permissionMap[Permissions.TASK_DELETE],
        permissionMap[Permissions.AUDIT_READ],
      ],
      Admin: [
        permissionMap[Permissions.TASK_CREATE],
        permissionMap[Permissions.TASK_READ],
        permissionMap[Permissions.TASK_UPDATE],
        permissionMap[Permissions.TASK_DELETE],
        permissionMap[Permissions.AUDIT_READ],
      ],
      Viewer: [permissionMap[Permissions.TASK_READ]],
    };

    const createdRoles: Record<string, Role> = {};

    for (const roleName of roles) {
      let role = await this.roleRepository.findOne({
        where: { name: roleName, organizationId },
        relations: ['permissions'],
      });
      if (!role) {
        role = this.roleRepository.create({ name: roleName, organizationId });
        role = await this.roleRepository.save(role);
        this.logger.log(`Created role: ${roleName}`);
      } else {
        this.logger.log(`Role already exists: ${roleName}`);
      }
      role.permissions = rolePermissions[roleName];
      role = await this.roleRepository.save(role);
      this.logger.log(`Updated permissions for role: ${roleName}`);
      createdRoles[roleName.toLowerCase()] = role;
    }

    return {
      owner: createdRoles['owner'],
      admin: createdRoles['admin'],
      viewer: createdRoles['viewer'],
    };
  }

  private async seedUsers(
    parentOrg: Organization,
    childOrg: Organization,
    marketingOrg: Organization,
    parentRoles: { owner: Role; admin: Role; viewer: Role },
    childRoles: { owner: Role; admin: Role; viewer: Role },
    marketingRoles: { owner: Role; admin: Role; viewer: Role }
  ): Promise<User[]> {
    this.logger.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

    const usersData = [
      {
        email: 'owner@techcorp.com',
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'TechCorp',
        roleId: parentRoles.owner.id,
        organizationId: parentOrg.id,
      },
      {
        email: 'viewer@techcorp.com',
        password: hashedPassword,
        firstName: 'Viewer',
        lastName: 'TechCorp',
        roleId: parentRoles.viewer.id,
        organizationId: parentOrg.id,
      },
      {
        email: 'admin-child@techcorp.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Engineering',
        roleId: childRoles.admin.id,
        organizationId: childOrg.id,
      },
      {
        email: 'admin-marketing@techcorp.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Marketing',
        roleId: marketingRoles.admin.id,
        organizationId: marketingOrg.id,
      },
    ];

    const createdUsers: User[] = [];
    for (const data of usersData) {
      let user = await this.userRepository.findOne({ where: { email: data.email } });
      if (!user) {
        user = this.userRepository.create(data);
        user = await this.userRepository.save(user);
        this.logger.log(`Created user: ${data.email}`);
      } else {
        this.logger.log(`User already exists: ${data.email}`);
      }
      createdUsers.push(user);
    }

    return createdUsers;
  }

  private async seedTasks(
    parentOrg: Organization,
    childOrg: Organization,
    marketingOrg: Organization,
    createdUsers: User[]
  ): Promise<void> {
    this.logger.log('Seeding tasks...');
    const [owner, viewer, adminChild, adminMarketing] = createdUsers;

    const tasksToSeed = [
      { title: 'Complete project documentation', description: 'Write comprehensive documentation', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.HIGH, order: 0, ownerId: owner.id, organizationId: parentOrg.id },
      { title: 'Review code changes', description: 'Review pull requests from the team', status: TaskStatus.IN_PROGRESS, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 1, ownerId: owner.id, organizationId: parentOrg.id },
      { title: 'Team meeting preparation', description: 'Prepare agenda and materials', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 2, ownerId: owner.id, organizationId: parentOrg.id },
      { title: 'Gym workout', description: 'Weekly gym session', status: TaskStatus.PENDING, category: TaskCategory.PERSONAL, priority: TaskPriority.LOW, order: 3, ownerId: owner.id, organizationId: parentOrg.id },
      { title: 'Quarterly planning', description: 'Q1 strategy and goals', status: TaskStatus.COMPLETED, category: TaskCategory.WORK, priority: TaskPriority.HIGH, order: 4, ownerId: owner.id, organizationId: parentOrg.id },
      { title: 'Engineering roadmap review', description: 'Review engineering roadmap', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.HIGH, order: 0, ownerId: owner.id, organizationId: childOrg.id },
      { title: 'Cross-org initiative', description: 'Task created by owner in child org', status: TaskStatus.IN_PROGRESS, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 1, ownerId: owner.id, organizationId: childOrg.id },
      { title: 'Read onboarding docs', description: 'Complete onboarding documentation', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 0, ownerId: viewer.id, organizationId: parentOrg.id },
      { title: 'Training session', description: 'Attend safety training', status: TaskStatus.IN_PROGRESS, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 1, ownerId: viewer.id, organizationId: parentOrg.id },
      { title: 'Book vacation', description: 'Plan and book vacation', status: TaskStatus.PENDING, category: TaskCategory.PERSONAL, priority: TaskPriority.LOW, order: 2, ownerId: viewer.id, organizationId: parentOrg.id },
      { title: 'Sprint planning', description: 'Plan sprint for Engineering team', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.HIGH, order: 0, ownerId: adminChild.id, organizationId: childOrg.id },
      { title: 'Deploy staging', description: 'Deploy to staging environment', status: TaskStatus.IN_PROGRESS, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 1, ownerId: adminChild.id, organizationId: childOrg.id },
      { title: 'Fix critical bug', description: 'Address P0 production bug', status: TaskStatus.COMPLETED, category: TaskCategory.WORK, priority: TaskPriority.HIGH, order: 2, ownerId: adminChild.id, organizationId: childOrg.id },
      { title: 'Learning time', description: 'Block for learning new tech', status: TaskStatus.PENDING, category: TaskCategory.PERSONAL, priority: TaskPriority.LOW, order: 3, ownerId: adminChild.id, organizationId: childOrg.id },
      { title: 'Campaign launch', description: 'Launch Q1 marketing campaign', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.HIGH, order: 0, ownerId: adminMarketing.id, organizationId: marketingOrg.id },
      { title: 'Social media calendar', description: 'Plan social content for March', status: TaskStatus.IN_PROGRESS, category: TaskCategory.WORK, priority: TaskPriority.MEDIUM, order: 1, ownerId: adminMarketing.id, organizationId: marketingOrg.id },
      { title: 'Brand guidelines update', description: 'Update brand guidelines doc', status: TaskStatus.PENDING, category: TaskCategory.WORK, priority: TaskPriority.LOW, order: 2, ownerId: adminMarketing.id, organizationId: marketingOrg.id },
    ];

    for (const data of tasksToSeed) {
      const existing = await this.taskRepository.findOne({
        where: { title: data.title, ownerId: data.ownerId },
      });
      if (!existing) {
        const maxOrder = await this.taskRepository
          .createQueryBuilder('t')
          .select('MAX(t.order)', 'max')
          .where('t.ownerId = :ownerId', { ownerId: data.ownerId })
          .andWhere('t.organizationId = :organizationId', { organizationId: data.organizationId })
          .getRawOne<{ max: number | null }>();
        const order = (maxOrder?.max ?? -1) + 1;
        const task = this.taskRepository.create({ ...data, order });
        await this.taskRepository.save(task);
        this.logger.log(`Created task: ${data.title} (${data.category})`);
      } else {
        this.logger.log(`Task already exists: ${data.title}`);
      }
    }
  }
}
