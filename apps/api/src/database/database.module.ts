import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration, getTypeOrmOptions } from '../config/configuration';
import { User } from '../auth/user.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../permissions/entities/role.entity';
import { Organization } from '../permissions/entities/organization.entity';
import { Task } from '../tasks/task.entity';
import { AuditLog } from '../audit/audit-log.entity';

const entities = [User, Permission, Role, Organization, Task, AuditLog];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<ReturnType<typeof configuration>['database']>('database');
        const nodeEnv = configService.get<string>('nodeEnv') ?? 'development';
        return getTypeOrmOptions(dbConfig, entities, {
          synchronize: nodeEnv !== 'production',
          logging: nodeEnv === 'development',
        });
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
