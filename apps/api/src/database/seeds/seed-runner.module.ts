import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from '../../config/configuration';
import { DatabaseModule } from '../database.module';
import { SeedsModule } from './seeds.module';

/**
 * Minimal Nest module used only for running seeds.
 * Imports the same DatabaseModule as the API so TypeORM config is shared.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    SeedsModule,
  ],
})
export class SeedRunnerModule {}
