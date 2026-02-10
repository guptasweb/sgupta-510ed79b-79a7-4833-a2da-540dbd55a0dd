import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { Organization } from '../../permissions/entities/organization.entity';
import { Role } from '../../permissions/entities/role.entity';
import { User } from '../../auth/user.entity';
import { Task } from '../../tasks/task.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Organization, Role, User, Task]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedsModule {}
