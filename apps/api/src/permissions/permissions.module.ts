import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { Organization } from './entities/organization.entity';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role, Organization])],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
