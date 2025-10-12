/**
 * auth API 控制器单元测试
 * 测试用户认证 API 的各项功能
 */

const request = require('supertest');
const express = require('express');
const authRouter = require('../../../src/api/auth/index');
const authService = require('../../../src/services/authService');

// Mock authService
jest.mock('../../../src/services/authService');

describe('auth API 控制器', () => {
  let app;

  // 每个测试前设置 Express 应用
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register - 用户注册', () => {
    test('应该成功注册新用户', async () => {
      // 准备测试数据
      const requestBody = {
        email: 'newuser@example.com',
        password: 'Password123'
      };
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: requestBody.email
      };

      // Mock authService.register
      authService.register.mockResolvedValue(mockUser);

      // 执行请求
      const response = await request(app).post('/api/v1/auth/register').send(requestBody);

      // 验证响应
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: '用户注册成功',
        data: {
          userId: mockUser.id,
          email: mockUser.email
        }
      });
      expect(authService.register).toHaveBeenCalledWith(
        requestBody.email.trim(),
        requestBody.password
      );
    });

    test('当缺少邮箱时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.register).not.toHaveBeenCalled();
    });

    test('当缺少密码时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.register).not.toHaveBeenCalled();
    });

    test('当邮箱为空字符串时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: '', password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.register).not.toHaveBeenCalled();
    });

    test('当密码为空字符串时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.register).not.toHaveBeenCalled();
    });

    test('当邮箱格式不正确时应该返回 400 错误', async () => {
      authService.register.mockRejectedValue(new Error('邮箱格式不正确'));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email', password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱格式不正确'
      });
    });

    test('当密码不符合要求时应该返回 400 错误', async () => {
      authService.register.mockRejectedValue(new Error('密码长度至少为8位'));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'pass' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '密码长度至少为8位'
      });
    });

    test('当邮箱已被注册时应该返回 409 错误', async () => {
      authService.register.mockRejectedValue(new Error('该邮箱已被注册'));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'existing@example.com', password: 'Password123' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        message: '该邮箱已被注册'
      });
    });

    test('当发生未知错误时应该返回 500 错误', async () => {
      authService.register.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'Password123' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '注册失败，请稍后重试');
    });

    test('应该正确处理邮箱前后的空格', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com'
      };
      authService.register.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: '  test@example.com  ', password: 'Password123' });

      expect(response.status).toBe(201);
      expect(authService.register).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });

  describe('POST /api/v1/auth/login - 用户登录', () => {
    test('应该成功登录并返回用户信息和 token', async () => {
      // 准备测试数据
      const requestBody = {
        email: 'user@example.com',
        password: 'Password123'
      };
      const mockResult = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: requestBody.email,
          created_at: new Date('2024-01-01T00:00:00Z')
        },
        token: 'jwt.token.here'
      };

      // Mock authService.login
      authService.login.mockResolvedValue(mockResult);

      // 执行请求
      const response = await request(app).post('/api/v1/auth/login').send(requestBody);

      // 验证响应
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: '登录成功',
        data: {
          token: mockResult.token,
          user: {
            id: mockResult.user.id,
            email: mockResult.user.email,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      });
      expect(authService.login).toHaveBeenCalledWith(requestBody.email.trim(), requestBody.password);
    });

    test('当缺少邮箱时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    test('当缺少密码时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    test('当邮箱为空字符串时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '', password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    test('当密码为空字符串时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱和密码是必需字段'
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    test('当用户不存在时应该返回 401 错误', async () => {
      authService.login.mockRejectedValue(new Error('用户不存在'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱或密码错误'
      });
    });

    test('当密码错误时应该返回 401 错误', async () => {
      authService.login.mockRejectedValue(new Error('密码错误'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com', password: 'WrongPassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱或密码错误'
      });
    });

    test('当邮箱格式不正确时应该返回 400 错误', async () => {
      authService.login.mockRejectedValue(new Error('邮箱格式不正确'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid-email', password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '邮箱格式不正确'
      });
    });

    test('当发生未知错误时应该返回 500 错误', async () => {
      authService.login.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', '登录失败，请稍后重试');
    });

    test('应该正确处理邮箱前后的空格', async () => {
      const mockResult = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          created_at: new Date()
        },
        token: 'jwt.token.here'
      };
      authService.login.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '  test@example.com  ', password: 'Password123' });

      expect(response.status).toBe(200);
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });
});
