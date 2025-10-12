/**
 * authService 单元测试
 * 测试用户认证服务的各项功能
 */

const authService = require('../../../src/services/authService');
const User = require('../../../src/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock 依赖
jest.mock('../../../src/models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/cache', () => ({
  userCache: {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    wrap: jest.fn((key, fn) => fn())
  },
  LRUCache: {
    generateKey: jest.fn((...args) => args.join(':'))
  }
}));

describe('authService - 用户认证服务', () => {
  // 每个测试前清除所有 mock
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword - 密码哈希功能', () => {
    test('应该成功对密码进行哈希', async () => {
      // 准备测试数据
      const password = 'testPassword123';
      const hashedPassword = '$2b$10$hashedPasswordValue';

      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue(hashedPassword);

      // 执行测试
      const result = await authService.hashPassword(password);

      // 验证结果
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    test('当哈希失败时应该抛出错误', async () => {
      // Mock bcrypt.hash 失败
      bcrypt.hash.mockRejectedValue(new Error('Hash failed'));

      // 执行测试并验证错误
      await expect(authService.hashPassword('password')).rejects.toThrow('密码加密失败');
    });
  });

  describe('comparePassword - 密码比对功能', () => {
    test('当密码匹配时应该返回 true', async () => {
      // 准备测试数据
      const password = 'testPassword123';
      const hash = '$2b$10$hashedPasswordValue';

      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);

      // 执行测试
      const result = await authService.comparePassword(password, hash);

      // 验证结果
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    test('当密码不匹配时应该返回 false', async () => {
      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(false);

      // 执行测试
      const result = await authService.comparePassword('wrongPassword', 'hash');

      // 验证结果
      expect(result).toBe(false);
    });

    test('当比对失败时应该抛出错误', async () => {
      // Mock bcrypt.compare 失败
      bcrypt.compare.mockRejectedValue(new Error('Compare failed'));

      // 执行测试并验证错误
      await expect(authService.comparePassword('password', 'hash')).rejects.toThrow('密码比对失败');
    });
  });

  describe('generateToken - JWT 生成功能', () => {
    test('应该成功生成 JWT token', () => {
      // 准备测试数据
      const user = {
        id: '123',
        email: 'test@example.com'
      };
      const expectedToken = 'jwt.token.here';

      // Mock jwt.sign
      jwt.sign.mockReturnValue(expectedToken);

      // 执行测试
      const token = authService.generateToken(user);

      // 验证结果
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: user.id, email: user.email },
        expect.any(String),
        { expiresIn: '24h' }
      );
      expect(token).toBe(expectedToken);
    });

    test('当生成失败时应该抛出错误', () => {
      // Mock jwt.sign 失败
      jwt.sign.mockImplementation(() => {
        throw new Error('Sign failed');
      });

      // 执行测试并验证错误
      expect(() => authService.generateToken({ id: '123', email: 'test@example.com' })).toThrow(
        'Token生成失败'
      );
    });
  });

  describe('verifyToken - JWT 验证功能', () => {
    test('应该成功验证有效的 token', () => {
      // 准备测试数据
      const token = 'valid.jwt.token';
      const payload = { userId: '123', email: 'test@example.com' };

      // Mock jwt.verify
      jwt.verify.mockReturnValue(payload);

      // 执行测试
      const decoded = authService.verifyToken(token);

      // 验证结果
      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(decoded).toEqual(payload);
    });

    test('当 token 过期时应该抛出错误', () => {
      // Mock jwt.verify 抛出过期错误
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // 执行测试并验证错误
      expect(() => authService.verifyToken('expired.token')).toThrow('Token已过期');
    });

    test('当 token 无效时应该抛出错误', () => {
      // Mock jwt.verify 抛出无效错误
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      // 执行测试并验证错误
      expect(() => authService.verifyToken('invalid.token')).toThrow('Token无效');
    });

    test('当验证失败时应该抛出通用错误', () => {
      // Mock jwt.verify 抛出其他错误
      jwt.verify.mockImplementation(() => {
        throw new Error('Unknown error');
      });

      // 执行测试并验证错误
      expect(() => authService.verifyToken('token')).toThrow('Token验证失败');
    });
  });

  describe('register - 用户注册功能', () => {
    test('应该成功注册新用户', async () => {
      // 准备测试数据
      const email = 'newuser@example.com';
      const password = 'Password123';
      const hashedPassword = '$2b$10$hashedPasswordValue';
      const newUser = {
        id: '123',
        email: email,
        password_hash: hashedPassword,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock 依赖
      User.findOne.mockResolvedValue(null); // 邮箱不存在
      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.create.mockResolvedValue(newUser);

      // 执行测试
      const result = await authService.register(email, password);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email },
        attributes: ['id'] // 性能优化：只查询id字段
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(User.create).toHaveBeenCalledWith({
        email,
        password_hash: hashedPassword
      });
      expect(result).toEqual({
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      });
      expect(result.password_hash).toBeUndefined(); // 不应包含密码哈希
    });

    test('当邮箱格式不正确时应该抛出错误', async () => {
      // 执行测试并验证错误
      await expect(authService.register('invalid-email', 'Password123')).rejects.toThrow(
        '邮箱格式不正确'
      );
      await expect(authService.register('', 'Password123')).rejects.toThrow('邮箱格式不正确');
    });

    test('当密码长度不足时应该抛出错误', async () => {
      // 执行测试并验证错误
      await expect(authService.register('test@example.com', '1234567')).rejects.toThrow(
        '密码长度至少为8位'
      );
    });

    test('当密码不包含字母时应该抛出错误', async () => {
      // 执行测试并验证错误
      await expect(authService.register('test@example.com', '12345678')).rejects.toThrow(
        '密码必须同时包含字母和数字'
      );
    });

    test('当密码不包含数字时应该抛出错误', async () => {
      // 执行测试并验证错误
      await expect(authService.register('test@example.com', 'abcdefgh')).rejects.toThrow(
        '密码必须同时包含字母和数字'
      );
    });

    test('当邮箱已被注册时应该抛出错误', async () => {
      // Mock 邮箱已存在
      User.findOne.mockResolvedValue({ id: '123', email: 'existing@example.com' });

      // 执行测试并验证错误
      await expect(authService.register('existing@example.com', 'Password123')).rejects.toThrow(
        '该邮箱已被注册'
      );
    });
  });

  describe('login - 用户登录功能', () => {
    test('应该成功登录并返回用户信息和 token', async () => {
      // 准备测试数据
      const email = 'user@example.com';
      const password = 'Password123';
      const user = {
        id: '123',
        email: email,
        password_hash: '$2b$10$hashedPasswordValue',
        created_at: new Date(),
        updated_at: new Date()
      };
      const token = 'jwt.token.here';

      // Mock 依赖
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true); // 密码匹配
      jwt.sign.mockReturnValue(token);

      // 执行测试
      const result = await authService.login(email, password);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email },
        attributes: ['id', 'email', 'password_hash', 'created_at', 'updated_at'] // 性能优化：只查询需要的字段
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password_hash);
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      });
      expect(result.user.password_hash).toBeUndefined(); // 不应包含密码哈希
    });

    test('当邮箱或密码为空时应该抛出错误', async () => {
      // 执行测试并验证错误
      await expect(authService.login('', 'password')).rejects.toThrow('邮箱和密码不能为空');
      await expect(authService.login('email@example.com', '')).rejects.toThrow(
        '邮箱和密码不能为空'
      );
    });

    test('当用户不存在时应该抛出错误', async () => {
      // Mock 用户不存在
      User.findOne.mockResolvedValue(null);

      // 执行测试并验证错误
      await expect(authService.login('nonexistent@example.com', 'Password123')).rejects.toThrow(
        '用户不存在'
      );
    });

    test('当密码错误时应该抛出错误', async () => {
      // 准备测试数据
      const user = {
        id: '123',
        email: 'user@example.com',
        password_hash: '$2b$10$hashedPasswordValue'
      };

      // Mock 依赖
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false); // 密码不匹配

      // 执行测试并验证错误
      await expect(authService.login('user@example.com', 'WrongPassword')).rejects.toThrow(
        '密码错误'
      );
    });
  });
});
