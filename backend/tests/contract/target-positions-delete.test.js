/**
 * 删除目标岗位API契约测试
 * 测试端点: DELETE /api/v1/target-positions/{id}
 *
 * 测试场景:
 * 1. 成功删除岗位（无简历版本）
 * 2. 验证响应数据结构
 * 3. 验证JWT认证要求
 * 4. 处理岗位不存在的情况
 * 5. 处理无效的UUID格式
 * 6. 验证只能删除自己的岗位
 * 7. 处理岗位下存在简历版本的情况（业务规则）
 */

const request = require('supertest');
const app = require('../../src/app');
const { generateQuickTestAuth } = require('../utils/auth-helper');
const { v4: uuidv4 } = require('uuid');

describe('DELETE /api/v1/target-positions/{id} - 删除目标岗位', () => {
  let validToken;
  let testUser;
  const validPositionId = uuidv4();
  const positionWithResumesId = uuidv4(); // 有简历的岗位
  const nonExistentId = uuidv4();
  const invalidId = 'invalid-uuid-format';

  beforeAll(() => {
    const auth = generateQuickTestAuth();
    testUser = auth.user;
    validToken = auth.token;
  });

  /**
   * 测试场景1: 成功删除岗位（无简历版本）
   * 预期: 200状态码，返回成功消息
   */
  test('应该返回200状态码并成功删除岗位（当岗位下没有简历时）', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结构
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('目标岗位删除成功');
  });

  /**
   * 测试场景2: 验证删除成功的响应结构
   * 预期: 包含success和message字段
   */
  test('删除成功的响应应该符合API规范', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    // 验证响应结构
    expect(response.body).toEqual({
      success: true,
      message: '目标岗位删除成功'
    });

    // 验证字段类型
    expect(typeof response.body.success).toBe('boolean');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试场景3: 岗位下存在简历版本
   * 预期: 400状态码，错误消息说明无法删除
   */
  test('应该返回400状态码（当岗位下存在简历版本时）', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${positionWithResumesId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');

    // 消息应该指示无法删除的原因
    expect(response.body.message).toMatch(/简历|版本|无法删除|不能删除/);
  });

  /**
   * 测试场景4: 岗位不存在
   * 预期: 404状态码，错误消息
   */
  test('应该返回404状态码（当岗位不存在时）', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${nonExistentId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(404);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景5: 无效的UUID格式
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当ID格式无效时）', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${invalidId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证错误响应
    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景6: 未提供认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当没有提供JWT token时）', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .expect('Content-Type', /json/)
      .expect(401);

    // 验证错误响应
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  /**
   * 测试场景7: 提供无效的认证token
   * 预期: 401状态码，错误消息
   */
  test('应该返回401状态码（当JWT token无效时）', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', 'Bearer invalid.token.here')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景8: 尝试删除其他用户的岗位
   * 预期: 404状态码（安全考虑，不应暴露资源是否存在）
   */
  test('应该返回404状态码（当尝试删除其他用户的岗位时）', async () => {
    const otherUserPositionId = '123e4567-e89b-12d3-a456-426614174002';

    const response = await request(app)
      .delete(`/api/v1/target-positions/${otherUserPositionId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  /**
   * 测试场景9: 验证错误响应包含error对象（详细错误信息）
   * 预期: 错误响应可能包含error对象
   */
  test('错误响应应该符合ErrorResponse schema', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${positionWithResumesId}`)
      .set('Authorization', validToken)
      .expect(400);

    // 验证基本错误结构
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');

    // 如果存在error对象，验证其结构
    if (Object.prototype.hasOwnProperty.call(response.body, 'error')) {
      expect(typeof response.body.error).toBe('object');

      // error对象可能包含code和details
      if (Object.prototype.hasOwnProperty.call(response.body.error, 'code')) {
        expect(typeof response.body.error.code).toBe('string');
      }

      if (Object.prototype.hasOwnProperty.call(response.body.error, 'details')) {
        expect(typeof response.body.error.details).toBe('object');
      }
    }
  });

  /**
   * 测试场景10: 验证响应Content-Type
   * 预期: Content-Type为application/json
   */
  test('应该返回正确的Content-Type响应头', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  /**
   * 测试场景11: 删除操作不应返回data字段
   * 预期: 响应中只有success和message，没有data
   */
  test('删除成功的响应不应包含data字段', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    expect(response.body).not.toHaveProperty('data');
    expect(Object.keys(response.body)).toEqual(['success', 'message']);
  });

  /**
   * 测试场景12: 验证删除的幂等性
   * 预期: 第二次删除同一个岗位应该返回404
   */
  test('应该返回404状态码（当尝试删除已删除的岗位时）', async () => {
    // 第一次删除
    await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    // 第二次尝试删除同一个岗位
    const response = await request(app)
      .delete(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  /**
   * 测试场景13: 验证400错误响应的详细信息
   * 预期: 当无法删除时，错误消息应该清晰说明原因
   */
  test('400错误响应应该包含清晰的错误原因', async () => {
    const response = await request(app)
      .delete(`/api/v1/target-positions/${positionWithResumesId}`)
      .set('Authorization', validToken)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message.length).toBeGreaterThan(0);

    // 可选: 验证是否包含error对象
    if (response.body.error) {
      expect(response.body.error).toHaveProperty('code');
      expect(typeof response.body.error.code).toBe('string');
    }
  });
});
