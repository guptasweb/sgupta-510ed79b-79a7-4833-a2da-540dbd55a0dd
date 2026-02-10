import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { SeedsModule } from '../src/database/seeds/seeds.module';
import { SeedService } from '../src/database/seeds/seed.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  const globalPrefix = 'api';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SeedsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();

    const seedService = moduleFixture.get(SeedService);
    await seedService.run();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  function login(email: string, password: string) {
    return request(app.getHttpServer())
      .post(`/${globalPrefix}/auth/login`)
      .send({ email, password })
      .expect((res) => {
        if (res.status !== 200) throw new Error(`Login failed: ${res.body?.message ?? res.text}`);
      })
      .then((res) => res.body.accessToken as string);
  }

  describe('auth', () => {
    it('returns 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post(`/${globalPrefix}/auth/login`)
        .send({ email: 'nobody@example.com', password: 'wrong' })
        .expect(401);
    });

    it('returns token for seeded viewer', () => {
      return request(app.getHttpServer())
        .post(`/${globalPrefix}/auth/login`)
        .send({ email: 'viewer@techcorp.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(typeof res.body.accessToken).toBe('string');
        });
    });
  });

  describe('tasks RBAC', () => {
    it('viewer can GET /tasks (has task:read)', async () => {
      const token = await login('viewer@techcorp.com', 'password123');
      await request(app.getHttpServer())
        .get(`/${globalPrefix}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('viewer cannot POST /tasks (no task:create)', async () => {
      const token = await login('viewer@techcorp.com', 'password123');
      await request(app.getHttpServer())
        .post(`/${globalPrefix}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Disallowed task',
          organizationId: '00000000-0000-0000-0000-000000000001',
        })
        .expect(403);
    });

    it('owner can POST /tasks (has task:create)', async () => {
      const token = await login('owner@techcorp.com', 'password123');
      const profile = await request(app.getHttpServer())
        .get(`/${globalPrefix}/auth/profile`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .then((r) => r.body);
      const orgId = profile.organizationId;
      await request(app.getHttpServer())
        .post(`/${globalPrefix}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E2E created task',
          organizationId: orgId,
        })
        .expect(201)
        .expect((r) => {
          expect(r.body).toHaveProperty('id');
          expect(r.body.title).toBe('E2E created task');
        });
    });
  });

  describe('audit RBAC', () => {
    it('viewer cannot GET /audit-log (no audit:read)', async () => {
      const token = await login('viewer@techcorp.com', 'password123');
      await request(app.getHttpServer())
        .get(`/${globalPrefix}/audit-log`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('owner can GET /audit-log (has audit:read)', async () => {
      const token = await login('owner@techcorp.com', 'password123');
      await request(app.getHttpServer())
        .get(`/${globalPrefix}/audit-log`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
