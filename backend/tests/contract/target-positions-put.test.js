/**
 * 更新目标岗位API契约测试
 * 测试端点: PUT /api/v1/target-positions/{id}
 *
 * 测试场景:
 * 1. 成功更新岗位名称
 * 2. 成功更新岗位描述
 * 3. 同时更新名称和描述
 * 4. 验证响应数据结构
 * 5. 验证字段长度限制
 * 6. 验证JWT认证要求
 * 7. 处理岗位不存在的情况
 * 8. 处理无效的UUID格式
 * 9. 验证只能更新自己的岗位
 */

const request = require('supertest');
const app = require('../../src/app');

describe('PUT /api/v1/target-positions/{id} - 更新目标岗位', () => {
  const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  const validPositionId = '123e4567-e89b-12d3-a456-426614174001';
  const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
  const invalidId = 'invalid-uuid-format';

  /**
   * 测试场景1: 成功更新岗位名称
   * 预期: 200状态码，返回更新后的岗位对象
   */
  test('应该返回200状态码并更新岗位名称', async () => {
    const updateData = {
      name: '高级前端开发工程师'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结构
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('目标岗位更新成功');
    expect(response.body).toHaveProperty('data');
  });

  /**
   * 测试场景2: 成功更新岗位描述
   * 预期: 200状态码，返回更新后的岗位对象
   */
  test('应该返回200状态码并更新岗位描述', async () => {
    const updateData = {
      description: '更新后的职位描述，专注于Vue3和TypeScript'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结构
    expect(response.body).toEqual({
      success: true,
      message: '目标岗位更新成功',
      data: expect.any(Object)
    });
  });

  /**
   * 测试场景3: 同时更新名称和描述
   * 预期: 200状态码，返回包含两个更新字段的岗位对象
   */
  test('应该返回200状态码并同时更新名称和描述', async () => {
    const updateData = {
      name: '全栈开发工程师',
      description: '负责前后端全栈开发，熟练掌握Vue3和Node.js'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect(200);

    const { data } = response.body;
    expect(data.name).toBe(updateData.name);
    expect(data.description).toBe(updateData.description);
  });

  /**
   * 测试场景4: 验证返回的岗位对象包含所有字段
   * 预期: 返回对象包含完整的TargetPosition schema
   */
  test('返回的岗位对象应该包含所有必需字段', async () => {
    const updateData = {
      name: '测试更新',
      description: '测试描述'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect(200);

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

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(data.id).toMatch(uuidRegex);
    expect(data.userId).toMatch(uuidRegex);

    // 验证updatedAt应该晚于或等于createdAt
    expect(new Date(data.updatedAt) >= new Date(data.createdAt)).toBe(true);
  });

  /**
   * 测试场景5: 空请求体（不更新任何字段）
   * 预期: 200状态码，返回未修改的岗位对象
   */
  test('应该返回200状态码（当请求体为空时，不修改任何字段）', async () => {
    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send({})
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });

  /**
   * 测试场景6: name字段超过最大长度限制（100字符）
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当name超过100字符时）', async () => {
    const updateData = {
      name: 'a'.repeat(101) // 101个字符
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证错误响应
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景7: name字段为空字符串
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当name为空字符串时）', async () => {
    const updateData = {
      name: ''
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景8: name字段在长度限制内（100字符）
   * 预期: 200状态码，成功更新
   */
  test('应该返回200状态码（当name正好为100字符时）', async () => {
    const updateData = {
      name: 'a'.repeat(100) // 正好100个字符
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(updateData.name);
  });

  /**
   * 测试场景9: 岗位不存在
   * 预期: 404状态码，错误消息
   */
  test('应该返回404状态码（当岗位不存在时）', async () => {
    const updateData = {
      name: '测试更新'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${nonExistentId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(404);

    // 验证错误响应
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景10: 无效的UUID格式
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当ID格式无效时）', async () => {
    const updateData = {
      name: '测试更新'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${invalidId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景11: 未提供认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当没有提供JWT token时）', async () => {
    const updateData = {
      name: '测试更新'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(401);

    // 验证错误响应
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景12: 提供无效的认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当JWT token无效时）', async () => {
    const updateData = {
      name: '测试更新'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', 'Bearer invalid.token.here')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  /**
   * 测试场景13: 尝试更新其他用户的岗位
   * 预期: 404状态码（安全考虑）
   */
  test('应该返回404状态码（当尝试更新其他用户的岗位时）', async () => {
    const otherUserPositionId = '123e4567-e89b-12d3-a456-426614174002';
    const updateData = {
      name: '测试更新'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${otherUserPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  /**
   * 测试场景14: 将description设置为null
   * 预期: 200状态码，description为null
   */
  test('应该返回200状态码（当将description设置为null时）', async () => {
    const updateData = {
      description: null
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.description).toBeNull();
  });

  /**
   * 测试场景15: 请求包含额外的未定义字段
   * 预期: 200状态码，额外字段应被忽略
   */
  test('应该返回200状态码（当请求包含额外字段时，额外字段应被忽略）', async () => {
    const updateData = {
      name: '测试更新',
      extraField: '这是一个额外字段',
      anotherField: 123
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect(200);

    const { data } = response.body;
    expect(data).not.toHaveProperty('extraField');
    expect(data).not.toHaveProperty('anotherField');
    expect(data.name).toBe(updateData.name);
  });

  /**
   * 测试场景16: 验证响应Content-Type
   * 预期: Content-Type为application/json
   */
  test('应该返回正确的Content-Type响应头', async () => {
    const updateData = {
      name: '测试更新'
    };

    const response = await request(app)
      .put(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .send(updateData)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});
