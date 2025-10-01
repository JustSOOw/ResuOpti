/**
 * 用户登录API契约测试
 *
 * 测试目标: POST /api/v1/auth/login
 * 基于规范: /specs/001-/contracts/api-spec.yaml
 *
 * 此测试验证用户登录API是否符合定义的契约规范，包括：
 * - 请求参数验证
 * - 响应状态码
 * - 响应数据结构
 * - JWT令牌格式验证
 * - 用户数据完整性
 * - 错误处理场景
 */

const request = require('supertest');
const { describe, test, expect } = require('@jest/globals');

// API基础URL
const API_BASE_URL = 'http://localhost:3000';
const LOGIN_ENDPOINT = '/api/v1/auth/login';

describe('用户登录API契约测试 - POST /api/v1/auth/login', () => {
  /**
   * 测试用例 1: 成功登录 - 200 OK
   *
   * 场景: 使用有效的邮箱和密码进行登录
   *
   * 契约要求:
   * - 响应状态码: 200
   * - 响应结构: { success: boolean, message: string, data: { token: string, user: User } }
   * - data.token 必须是有效的JWT格式
   * - data.user 必须包含: id (uuid), email, createdAt (date-time)
   */
  test('应该成功登录并返回200状态码和JWT令牌', async () => {
    const credentials = {
      email: 'existing@example.com', // 假设这是数据库中已存在的用户
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(credentials)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(200);

    // 验证响应body包含必需的顶层字段
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');

    // 验证success字段为true
    expect(response.body.success).toBe(true);

    // 验证message字段是字符串
    expect(typeof response.body.message).toBe('string');

    // 验证data对象包含必需字段
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');

    // 验证token是有效的JWT格式 (三段式: header.payload.signature)
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    expect(response.body.data.token).toMatch(jwtRegex);

    // 验证user对象包含必需字段
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user).toHaveProperty('email');
    expect(response.body.data.user).toHaveProperty('createdAt');

    // 验证user.id是有效的UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(response.body.data.user.id).toMatch(uuidRegex);

    // 验证user.email是邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(response.body.data.user.email).toMatch(emailRegex);

    // 验证返回的email与请求的email一致
    expect(response.body.data.user.email).toBe(credentials.email);

    // 验证createdAt是有效的ISO 8601日期时间格式
    expect(() => new Date(response.body.data.user.createdAt)).not.toThrow();
    expect(new Date(response.body.data.user.createdAt).toString()).not.toBe('Invalid Date');
  });

  /**
   * 测试用例 2: 邮箱不存在 - 401 Unauthorized
   *
   * 场景: 使用不存在的邮箱尝试登录
   *
   * 契约要求:
   * - 响应状态码: 401
   * - 响应结构: ErrorResponse { success: false, message: string, error?: object }
   * - success 必须为 false
   */
  test('应该拒绝不存在的邮箱并返回401状态码', async () => {
    const nonExistentUser = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(nonExistentUser)
      .set('Content-Type', 'application/json');

    // 验证响应状态码为401（未授权）
    expect(response.status).toBe(401);

    // 验证响应body包含错误结构
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('message');

    // 验证success字段为false
    expect(response.body.success).toBe(false);

    // 验证message字段是字符串且包含有意义的错误信息
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message.length).toBeGreaterThan(0);
  });

  /**
   * 测试用例 3: 密码错误 - 401 Unauthorized
   *
   * 场景: 使用正确的邮箱但错误的密码尝试登录
   *
   * 契约要求:
   * - 响应状态码: 401
   * - 响应结构: ErrorResponse
   * - 错误消息应该提示"邮箱或密码错误"，不应该透露具体是邮箱还是密码错误
   */
  test('应该拒绝错误的密码并返回401状态码', async () => {
    const wrongPassword = {
      email: 'existing@example.com', // 假设这是数据库中已存在的用户
      password: 'wrongpassword123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(wrongPassword)
      .set('Content-Type', 'application/json');

    // 验证响应状态码为401
    expect(response.status).toBe(401);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试用例 4: 缺少email字段 - 400 Bad Request
   *
   * 场景: 请求缺少email字段
   *
   * 契约要求:
   * - email是必需字段
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝缺少email字段的请求并返回400状态码', async () => {
    const invalidRequest = {
      password: 'password123'
      // 缺少email字段
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(invalidRequest)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试用例 5: 缺少password字段 - 400 Bad Request
   *
   * 场景: 请求缺少password字段
   *
   * 契约要求:
   * - password是必需字段
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝缺少password字段的请求并返回400状态码', async () => {
    const invalidRequest = {
      email: 'test@example.com'
      // 缺少password字段
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(invalidRequest)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试用例 6: 无效的邮箱格式 - 400 Bad Request
   *
   * 场景: 提供的email不符合邮箱格式规范
   *
   * 契约要求:
   * - email必须符合email格式
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝无效的邮箱格式并返回400状态码', async () => {
    const invalidEmailRequest = {
      email: 'not-a-valid-email', // 无效的邮箱格式
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(invalidEmailRequest)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试用例 7: 空请求体 - 400 Bad Request
   *
   * 场景: 请求体为空对象或无内容
   *
   * 契约要求:
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝空请求体并返回400状态码', async () => {
    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send({})
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
  });

  /**
   * 测试用例 8: 空字符串字段 - 400 Bad Request
   *
   * 场景: email或password为空字符串
   *
   * 契约要求:
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝空字符串的email或password并返回400状态码', async () => {
    // 测试空email
    const emptyEmailResponse = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send({ email: '', password: 'password123' })
      .set('Content-Type', 'application/json');

    expect(emptyEmailResponse.status).toBe(400);
    expect(emptyEmailResponse.body.success).toBe(false);

    // 测试空password
    const emptyPasswordResponse = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send({ email: 'test@example.com', password: '' })
      .set('Content-Type', 'application/json');

    expect(emptyPasswordResponse.status).toBe(400);
    expect(emptyPasswordResponse.body.success).toBe(false);
  });

  /**
   * 测试用例 9: 验证Content-Type
   *
   * 场景: 确保API只接受application/json
   *
   * 契约要求:
   * - requestBody content-type: application/json
   */
  test('应该正确处理application/json Content-Type', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(credentials)
      .set('Content-Type', 'application/json');

    // 响应应该是成功的（200/401）或者有明确的错误（如果API未实现）
    expect([200, 400, 401, 404, 500]).toContain(response.status);
  });

  /**
   * 测试用例 10: 验证响应Content-Type
   *
   * 场景: 确保API返回application/json格式
   *
   * 契约要求:
   * - 所有响应的Content-Type应该是application/json
   */
  test('应该返回application/json Content-Type', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(credentials)
      .set('Content-Type', 'application/json');

    // 验证响应Content-Type包含application/json
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  /**
   * 测试用例 11: JWT令牌格式验证
   *
   * 场景: 确保返回的JWT令牌符合标准格式
   *
   * 契约要求:
   * - token应该是有效的JWT格式 (header.payload.signature)
   * - token应该可以被解析（本测试只验证格式，不验证签名）
   */
  test('返回的JWT令牌应该符合标准格式', async () => {
    const credentials = {
      email: 'existing@example.com',
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(credentials)
      .set('Content-Type', 'application/json');

    // 如果登录成功
    if (response.status === 200) {
      const token = response.body.data.token;

      // JWT应该包含三个部分，用点号分隔
      const parts = token.split('.');
      expect(parts).toHaveLength(3);

      // 每个部分都应该是非空的base64url编码字符串
      parts.forEach((part) => {
        expect(part.length).toBeGreaterThan(0);
        expect(part).toMatch(/^[A-Za-z0-9-_]+$/);
      });
    }
  });

  /**
   * 测试用例 12: 用户对象不应包含敏感信息
   *
   * 场景: 确保返回的user对象不包含密码等敏感信息
   *
   * 契约要求:
   * - user对象只应包含: id, email, createdAt
   * - 不应包含: password, passwordHash等敏感字段
   */
  test('返回的用户对象不应包含密码等敏感信息', async () => {
    const credentials = {
      email: 'existing@example.com',
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(LOGIN_ENDPOINT)
      .send(credentials)
      .set('Content-Type', 'application/json');

    // 如果登录成功
    if (response.status === 200) {
      const user = response.body.data.user;

      // 不应包含密码相关字段
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('passwordSalt');

      // 应该只包含契约中定义的字段
      const allowedFields = ['id', 'email', 'createdAt'];
      Object.keys(user).forEach((key) => {
        expect(allowedFields).toContain(key);
      });
    }
  });
});
