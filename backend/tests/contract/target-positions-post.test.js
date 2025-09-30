/**
 * 创建目标岗位API契约测试
 * 测试端点: POST /api/v1/target-positions
 *
 * 测试场景:
 * 1. 成功创建岗位（仅name）
 * 2. 成功创建岗位（name + description）
 * 3. 验证响应数据结构和类型
 * 4. 验证必需字段校验
 * 5. 验证字段长度限制
 * 6. 验证JWT认证要求
 * 7. 验证响应状态码
 */

const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/target-positions - 创建目标岗位', () => {
  const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

  /**
   * 测试场景1: 成功创建岗位 - 仅提供必需字段name
   * 预期: 201状态码，返回创建的岗位对象
   */
  test('应该返回201状态码并创建岗位（仅提供name字段）', async () => {
    const newPosition = {
      name: '前端开发工程师'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(newPosition)
      .expect('Content-Type', /json/)
      .expect(201);

    // 验证响应结构
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('目标岗位创建成功');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试场景2: 成功创建岗位 - 提供所有字段
   * 预期: 201状态码，返回包含description的岗位对象
   */
  test('应该返回201状态码并创建岗位（提供name和description）', async () => {
    const newPosition = {
      name: '后端开发工程师',
      description: '专注于Node.js和PostgreSQL的后端开发职位'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(newPosition)
      .expect('Content-Type', /json/)
      .expect(201);

    // 验证响应结构
    expect(response.body).toEqual({
      success: true,
      message: '目标岗位创建成功',
      data: expect.any(Object)
    });
  });

  /**
   * 测试场景3: 验证返回的岗位对象包含所有必需字段
   * 预期: 返回对象包含id, userId, name, description, createdAt, updatedAt
   */
  test('返回的岗位对象应该包含所有必需字段并符合schema定义', async () => {
    const newPosition = {
      name: '全栈开发工程师',
      description: '负责前后端开发'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(newPosition)
      .expect(201);

    const { data } = response.body;

    // 验证所有必需字段存在
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');

    // 验证字段类型
    expect(typeof data.id).toBe('string');
    expect(typeof data.userId).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(typeof data.createdAt).toBe('string');
    expect(typeof data.updatedAt).toBe('string');

    // 验证字段值
    expect(data.name).toBe(newPosition.name);
    expect(data.description).toBe(newPosition.description);

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(data.id).toMatch(uuidRegex);
    expect(data.userId).toMatch(uuidRegex);

    // 验证日期时间格式
    expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
    expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
  });

  /**
   * 测试场景4: 缺少必需字段name
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当缺少必需字段name时）', async () => {
    const invalidPosition = {
      description: '这是一个没有name字段的岗位'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(invalidPosition)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试场景5: name字段为空字符串
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当name为空字符串时）', async () => {
    const invalidPosition = {
      name: '',
      description: '测试描述'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(invalidPosition)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证错误响应
    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景6: name字段超过最大长度限制（100字符）
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当name超过100字符时）', async () => {
    const invalidPosition = {
      name: 'a'.repeat(101), // 101个字符
      description: '测试描述'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(invalidPosition)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证错误响应
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景7: name字段在长度限制内（100字符）
   * 预期: 201状态码，成功创建
   */
  test('应该返回201状态码（当name正好为100字符时）', async () => {
    const validPosition = {
      name: 'a'.repeat(100), // 正好100个字符
      description: '测试描述'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(validPosition)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(validPosition.name);
  });

  /**
   * 测试场景8: 未提供认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当没有提供JWT token时）', async () => {
    const newPosition = {
      name: '测试岗位'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .send(newPosition)
      .expect('Content-Type', /json/)
      .expect(401);

    // 验证错误响应
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景9: 提供无效的认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当JWT token无效时）', async () => {
    const newPosition = {
      name: '测试岗位'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', 'Bearer invalid.token.here')
      .send(newPosition)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  /**
   * 测试场景10: 请求体为空对象
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当请求体为空对象时）', async () => {
    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景11: 请求体包含额外的未定义字段
   * 预期: 201状态码，额外字段应被忽略
   */
  test('应该返回201状态码（当请求包含额外字段时，额外字段应被忽略）', async () => {
    const positionWithExtraFields = {
      name: '测试岗位',
      description: '测试描述',
      extraField: '这是一个额外字段',
      anotherField: 123
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(positionWithExtraFields)
      .expect(201);

    const { data } = response.body;
    expect(data).not.toHaveProperty('extraField');
    expect(data).not.toHaveProperty('anotherField');
    expect(data.name).toBe(positionWithExtraFields.name);
  });

  /**
   * 测试场景12: description字段为null
   * 预期: 201状态码，description为null
   */
  test('应该返回201状态码（当description为null时）', async () => {
    const newPosition = {
      name: '测试岗位',
      description: null
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(newPosition)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.description).toBeNull();
  });

  /**
   * 测试场景13: 验证响应Content-Type
   * 预期: Content-Type为application/json
   */
  test('应该返回正确的Content-Type响应头', async () => {
    const newPosition = {
      name: '测试岗位'
    };

    const response = await request(app)
      .post('/api/v1/target-positions')
      .set('Authorization', validToken)
      .send(newPosition)
      .expect(201);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});