import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../user.entity';
import { JwtPayload } from '@task-management-system/auth';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: { findOne: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    roleId: 'role-uuid',
    organizationId: 'org-uuid',
    role: { name: 'viewer' },
    organization: {},
  } as User;

  const payload: JwtPayload = {
    userId: 'user-uuid',
    email: 'test@example.com',
    roleId: 'role-uuid',
    organizationId: 'org-uuid',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => (key === 'jwt' ? { secret: 'test-secret' } : undefined)),
  };

  beforeEach(async () => {
    userRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.userId },
        relations: ['role', 'organization'],
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(payload)).rejects.toThrow(/User not found|Session may be invalid/);
    });
  });
});
