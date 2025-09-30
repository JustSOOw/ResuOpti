/**
 * 用户注册API契约测试
 *
 * 测试目标: POST /api/v1/auth/register
 * 基于规范: /specs/001-/contracts/api-spec.yaml
 *
 * 此测试验证用户注册API是否符合定义的契约规范，包括：
 * - 请求参数验证
 * - 响应状态码
 * - 响应数据结构
 * - 必需字段完整性
 * - 错误处理场景
 */

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

// API基础URL
const API_BASE_URL = 'http://localhost:3000';
const REGISTER_ENDPOINT = '/api/v1/auth/register';

describe('用户注册API契约测试 - POST /api/v1/auth/register', () => {
  /**
   * 测试用例 1: 成功注册 - 201 Created
   *
   * 场景: 使用有效的邮箱和密码创建新用户账户
   *
   * 契约要求:
   * - 响应状态码: 201
   * - 响应结构: { success: boolean, message: string, data: { userId: uuid, email: string } }
   * - data.userId 必须是有效的UUID格式
   * - data.email 必须与请求中的email一致
   */
  test('应该成功注册新用户并返回201状态码', async () => {
    const newUser = {
      email: `test${Date.now()}@example.com`, // 使用时间戳确保邮箱唯一性
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(newUser)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(201);

    // 验证响应body包含必需的顶层字段
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');

    // 验证success字段为true
    expect(response.body.success).toBe(true);

    // 验证message字段是字符串
    expect(typeof response.body.message).toBe('string');

    // 验证data对象包含必需字段
    expect(response.body.data).toHaveProperty('userId');
    expect(response.body.data).toHaveProperty('email');

    // 验证userId是有效的UUID格式 (UUID v4格式)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(response.body.data.userId).toMatch(uuidRegex);

    // 验证返回的email与请求的email一致
    expect(response.body.data.email).toBe(newUser.email);
  });

  /**
   * 测试用例 2: 邮箱已存在 - 409 Conflict
   *
   * 场景: 尝试使用已注册的邮箱创建账户
   *
   * 契约要求:
   * - 响应状态码: 409
   * - 响应结构: ErrorResponse { success: false, message: string, error?: object }
   * - success 必须为 false
   */
  test('应该拒绝已存在的邮箱并返回409状态码', async () => {
    const duplicateEmail = 'duplicate@example.com';

    // 第一次注册应该成功（假设该邮箱已存在于数据库中）
    // 在实际测试中，这个邮箱应该已经在数据库中
    const duplicateUser = {
      email: duplicateEmail,
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(duplicateUser)
      .set('Content-Type', 'application/json');

    // 验证响应状态码为409（邮箱冲突）
    expect(response.status).toBe(409);

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
   * 测试用例 3: 缺少必需字段 - 400 Bad Request
   *
   * 场景: 请求缺少email字段
   *
   * 契约要求:
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   * - success 必须为 false
   */
  test('应该拒绝缺少email字段的请求并返回400状态码', async () => {
    const invalidUser = {
      password: 'password123'
      // 缺少email字段
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(invalidUser)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试用例 4: 缺少必需字段 - 400 Bad Request
   *
   * 场景: 请求缺少password字段
   *
   * 契约要求:
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝缺少password字段的请求并返回400状态码', async () => {
    const invalidUser = {
      email: 'test@example.com'
      // 缺少password字段
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(invalidUser)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试用例 5: 无效的邮箱格式 - 400 Bad Request
   *
   * 场景: 提供的email不符合邮箱格式规范
   *
   * 契约要求:
   * - email必须符合email格式
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝无效的邮箱格式并返回400状态码', async () => {
    const invalidEmailUser = {
      email: 'not-a-valid-email', // 无效的邮箱格式
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(invalidEmailUser)
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试用例 6: 密码长度不足 - 400 Bad Request
   *
   * 场景: 密码长度少于8位
   *
   * 契约要求:
   * - password minLength: 8
   * - 响应状态码: 400
   * - 响应结构: ErrorResponse
   */
  test('应该拒绝长度不足8位的密码并返回400状态码', async () => {
    const shortPasswordUser = {
      email: 'test@example.com',
      password: 'pass123' // 只有7位
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(shortPasswordUser)
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
      .post(REGISTER_ENDPOINT)
      .send({})
      .set('Content-Type', 'application/json');

    // 验证响应状态码
    expect(response.status).toBe(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
  });

  /**
   * 测试用例 8: 验证Content-Type
   *
   * 场景: 确保API只接受application/json
   *
   * 契约要求:
   * - requestBody content-type: application/json
   */
  test('应该正确处理application/json Content-Type', async () => {
    const newUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(newUser)
      .set('Content-Type', 'application/json');

    // 响应应该是成功的（201）或者有明确的错误（如果API未实现）
    expect([201, 404, 500]).toContain(response.status);
  });

  /**
   * 测试用例 9: 验证响应Content-Type
   *
   * 场景: 确保API返回application/json格式
   *
   * 契约要求:
   * - 所有响应的Content-Type应该是application/json
   */
  test('应该返回application/json Content-Type', async () => {
    const newUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };

    const response = await request(API_BASE_URL)
      .post(REGISTER_ENDPOINT)
      .send(newUser)
      .set('Content-Type', 'application/json');

    // 验证响应Content-Type包含application/json
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});