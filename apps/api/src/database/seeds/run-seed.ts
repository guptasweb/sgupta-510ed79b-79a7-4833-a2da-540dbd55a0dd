/**
 * Runs database seeding inside a Nest application context.
 * Uses the same TypeORM config and entities as the API so there is no duplicate DB config.
 *
 * Usage: npm run seed
 */
import { NestFactory } from '@nestjs/core';
import { SeedRunnerModule } from './seed-runner.module';
import { SeedService } from './seed.service';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(SeedRunnerModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seedService = app.get(SeedService);
    await seedService.run();
  } finally {
    await app.close();
  }
}

runSeed()
  .then(() => {
    console.log('Seed finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
