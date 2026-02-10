import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import type { User } from '../../auth/user.entity';
import type { Task } from '../../tasks/task.entity';
import { Role } from './role.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Organization, (organization) => organization.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Organization | null;

  @OneToMany(() => Organization, (organization) => organization.parent)
  children: Organization[];

  @OneToMany(() => require('../../auth/user.entity').User, (user: User) => user.organization)
  users: User[];

  @OneToMany(() => Role, (role) => role.organization)
  roles: Role[];

  @OneToMany(() => require('../../tasks/task.entity').Task, (task: Task) => task.organization)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
