import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './task.entity';
import { User } from '../auth/user.entity';
import { Organization } from '../permissions/entities/organization.entity';
import { CommonModule } from '../common/common.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { TaskResourceGuard } from './guards/task-resource.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Organization]),
    CommonModule,
    PermissionsModule,
    AuditModule,
  ],
  providers: [TasksService, TaskResourceGuard],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
