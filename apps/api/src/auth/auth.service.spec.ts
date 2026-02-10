import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    roleId: 'role-uuid',
    organizationId: 'org-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    role: { id: 'role-uuid', name: 'viewer' },
    organization: { id: 'org-uuid', name: 'Org' },
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        relations: ['role', 'organization'],
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        roleId: mockUser.roleId,
        organizationId: mockUser.organizationId,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password' })
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('register', () => {
    it('should register a new user and return access token and user', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        roleId: 'role-uuid',
        organizationId: 'org-uuid',
      };
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockReturnValue({ ...mockUser, ...registerDto });
      (userRepository.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...registerDto,
        id: 'new-user-uuid',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toBeDefined();
      expect(result.user?.password).toBeUndefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: registerDto.email } });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'role-uuid',
          organizationId: 'org-uuid',
        })
      ).rejects.toThrow(ConflictException);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'role-uuid',
          organizationId: 'org-uuid',
        })
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('getProfile', () => {
    it('should return user without password when user exists', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile('user-uuid');

      expect(result).toBeDefined();
      expect((result as Record<string, unknown>).password).toBeUndefined();
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        relations: ['role', 'organization'],
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(UnauthorizedException);
      await expect(service.getProfile('non-existent')).rejects.toThrow('User not found');
    });
  });
});
