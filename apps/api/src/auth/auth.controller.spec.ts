import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return access token', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      (authService.login as jest.Mock).mockResolvedValue({ accessToken: 'jwt-token' });

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ accessToken: 'jwt-token' });
    });
  });

  describe('register', () => {
    it('should call authService.register and return access token and user', async () => {
      const dto: RegisterDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        roleId: 'role-uuid',
        organizationId: 'org-uuid',
      };
      (authService.register as jest.Mock).mockResolvedValue({
        accessToken: 'jwt-token',
        user: { id: 'user-uuid', email: dto.email },
      });

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).toBeDefined();
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile with user id from request', async () => {
      const req = { user: { id: 'user-uuid' } };
      (authService.getProfile as jest.Mock).mockResolvedValue({
        id: 'user-uuid',
        email: 'test@example.com',
      });

      const result = await controller.getProfile(req);

      expect(authService.getProfile).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual({ id: 'user-uuid', email: 'test@example.com' });
    });
  });
});
