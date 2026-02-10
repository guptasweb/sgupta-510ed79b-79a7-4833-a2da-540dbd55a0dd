import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TaskStatus, TaskCategory, TaskPriority } from '@task-management-system/data';
import { User } from '../auth/user.entity';
import { Organization } from '../permissions/entities/organization.entity';

export { TaskStatus, TaskCategory, TaskPriority };

@Entity('tasks')
@Unique(['organizationId', 'ownerId', 'order'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: TaskCategory | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.tasks)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.tasks)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
