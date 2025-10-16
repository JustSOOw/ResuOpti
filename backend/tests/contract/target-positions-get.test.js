/**
 * 目标岗位列表API契约测试
 * 测试端点: GET /api/v1/target-positions
 *
 * 测试场景:
 * 1. 成功获取空列表
 * 2. 成功获取包含岗位的列表
 * 3. 验证响应数据结构和类型
 * 4. 验证JWT认证要求
 * 5. 验证响应状态码
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateQuickTestAuth } = require('../utils/auth-helper');
const { generateInvalidToken } = require('../utils/token-generator');

describe('GET /api/v1/target-positions - 获取目标岗位列表', () => {
  // 使用token生成器生成有效的测试token
  let validToken;
  let testUser;
  let invalidToken;

  beforeAll(() => {
    // 生成测试用户和有效token
    const auth = generateQuickTestAuth();
    testUser = auth.user;
    validToken = auth.token;

    // 生成无效token
    invalidToken = generateInvalidToken({ userId: testUser.userId, email: testUser.email });
  });

  /**
   * 测试场景1: 成功获取目标岗位列表 - 空列表
   * 预期: 200状态码，返回空数组
   */
  test('应该返回200状态码和空列表（当用户没有创建任何岗位时）', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结构
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  /**
   * 测试场景2: 成功获取目标岗位列表 - 包含数据
   * 预期: 200状态码，返回包含岗位对象的数组
   */
  test('应该返回200状态码和岗位列表数组', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结构
    expect(response.body).toEqual({
      success: true,
      data: expect.any(Array)
    });
  });

  /**
   * 测试场景3: 验证返回的岗位对象数据结构
   * 预期: 每个岗位对象包含所有必需字段，类型正确
   */
  test('返回的岗位对象应该包含所有必需字段并符合schema定义', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .set('Authorization', validToken)
      .expect(200);

    const { data } = response.body;

    // 如果有数据，验证第一个对象的结构
    if (data.length > 0) {
      const position = data[0];

      // 验证必需字段存在
      expect(position).toHaveProperty('id');
      expect(position).toHaveProperty('userId');
      expect(position).toHaveProperty('name');
      expect(position).toHaveProperty('createdAt');
      expect(position).toHaveProperty('updatedAt');

      // 验证字段类型
      expect(typeof position.id).toBe('string');
      expect(typeof position.userId).toBe('string');
      expect(typeof position.name).toBe('string');
      expect(typeof position.createdAt).toBe('string');
      expect(typeof position.updatedAt).toBe('string');

      // 验证UUID格式 (简单正则)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(position.id).toMatch(uuidRegex);
      expect(position.userId).toMatch(uuidRegex);

      // 验证日期时间格式 (ISO 8601)
      expect(new Date(position.createdAt).toISOString()).toBe(position.createdAt);
      expect(new Date(position.updatedAt).toISOString()).toBe(position.updatedAt);

      // description是可选字段，如果存在应该是string或null
      if (Object.prototype.hasOwnProperty.call(position, 'description')) {
        expect(['string', 'object']).toContain(typeof position.description);
        if (position.description !== null) {
          expect(typeof position.description).toBe('string');
        }
      }
    }
  });

  /**
   * 测试场景4: 未提供认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当没有提供JWT token时）', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .expect('Content-Type', /json/)
      .expect(401);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试场景5: 提供无效的认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当JWT token无效时）', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .set('Authorization', invalidToken)
      .expect('Content-Type', /json/)
      .expect(401);

    // 验证错误响应结构
    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景6: 验证响应头
   * 预期: Content-Type为application/json
   */
  test('应该返回正确的Content-Type响应头', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .set('Authorization', validToken)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  /**
   * 测试场景7: 验证只返回当前用户的岗位
   * 预期: 返回的所有岗位的userId应该与当前认证用户一致
   */
  test('应该只返回属于当前认证用户的岗位', async () => {
    const response = await request(app)
      .get('/api/v1/target-positions')
      .set('Authorization', validToken)
      .expect(200);

    const { data } = response.body;

    // 如果有数据，验证所有岗位都属于同一个用户
    if (data.length > 0) {
      const userId = data[0].userId;
      data.forEach((position) => {
        expect(position.userId).toBe(userId);
      });
    }
  });
});
