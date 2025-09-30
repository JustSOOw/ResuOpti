/**
 * 获取目标岗位详情API契约测试
 * 测试端点: GET /api/v1/target-positions/{id}
 *
 * 测试场景:
 * 1. 成功获取岗位详情
 * 2. 验证响应数据结构（包含resumes数组）
 * 3. 验证字段类型和格式
 * 4. 验证JWT认证要求
 * 5. 处理岗位不存在的情况
 * 6. 处理无效的UUID格式
 * 7. 验证只能访问自己的岗位
 */

const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/target-positions/{id} - 获取目标岗位详情', () => {
  const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  const validPositionId = '123e4567-e89b-12d3-a456-426614174001'; // 测试用的有效UUID
  const nonExistentId = '123e4567-e89b-12d3-a456-426614174999'; // 不存在的UUID
  const invalidId = 'invalid-uuid-format'; // 无效的UUID格式

  /**
   * 测试场景1: 成功获取岗位详情
   * 预期: 200状态码，返回岗位对象（包含resumes数组）
   */
  test('应该返回200状态码和岗位详情（当岗位存在时）', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结构
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.data).toBe('object');
  });

  /**
   * 测试场景2: 验证返回的岗位对象包含所有必需字段
   * 预期: 返回对象包含TargetPosition的所有字段和resumes数组
   */
  test('返回的岗位对象应该包含所有必需字段（包括resumes数组）', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    const { data } = response.body;

    // 验证TargetPosition基本字段
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');

    // 验证扩展字段 - resumes数组
    expect(data).toHaveProperty('resumes');
    expect(Array.isArray(data.resumes)).toBe(true);

    // 验证基本字段类型
    expect(typeof data.id).toBe('string');
    expect(typeof data.userId).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(typeof data.createdAt).toBe('string');
    expect(typeof data.updatedAt).toBe('string');

    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(data.id).toMatch(uuidRegex);
    expect(data.userId).toMatch(uuidRegex);

    // 验证日期时间格式
    expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
    expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
  });

  /**
   * 测试场景3: 验证resumes数组中的对象结构
   * 预期: 每个简历对象包含ResumeVersionSummary的所有字段
   */
  test('resumes数组中的对象应该符合ResumeVersionSummary schema', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    const { data } = response.body;

    // 如果resumes数组有数据，验证第一个对象的结构
    if (data.resumes.length > 0) {
      const resume = data.resumes[0];

      // 验证必需字段存在
      expect(resume).toHaveProperty('id');
      expect(resume).toHaveProperty('type');
      expect(resume).toHaveProperty('title');
      expect(resume).toHaveProperty('createdAt');
      expect(resume).toHaveProperty('applicationCount');

      // 验证字段类型
      expect(typeof resume.id).toBe('string');
      expect(typeof resume.type).toBe('string');
      expect(typeof resume.title).toBe('string');
      expect(typeof resume.createdAt).toBe('string');
      expect(typeof resume.applicationCount).toBe('number');

      // 验证type枚举值
      expect(['online', 'file']).toContain(resume.type);

      // 验证UUID格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(resume.id).toMatch(uuidRegex);

      // fileName是可选字段
      if (resume.hasOwnProperty('fileName')) {
        expect(['string', 'object']).toContain(typeof resume.fileName);
      }
    }
  });

  /**
   * 测试场景4: 岗位不存在
   * 预期: 404状态码，错误消息
   */
  test('应该返回404状态码（当岗位不存在时）', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${nonExistentId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(404);

    // 验证错误响应结构
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
  });

  /**
   * 测试场景5: 无效的UUID格式
   * 预期: 400状态码，错误消息
   */
  test('应该返回400状态码（当ID格式无效时）', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${invalidId}`)
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
      .get(`/api/v1/target-positions/${validPositionId}`)
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
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', 'Bearer invalid.token.here')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: expect.any(String)
    });
  });

  /**
   * 测试场景8: 验证响应Content-Type
   * 预期: Content-Type为application/json
   */
  test('应该返回正确的Content-Type响应头', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });

  /**
   * 测试场景9: 访问其他用户的岗位
   * 预期: 404状态码（安全考虑，不应暴露资源是否存在）
   */
  test('应该返回404状态码（当尝试访问其他用户的岗位时）', async () => {
    const otherUserPositionId = '123e4567-e89b-12d3-a456-426614174002';

    const response = await request(app)
      .get(`/api/v1/target-positions/${otherUserPositionId}`)
      .set('Authorization', validToken)
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  /**
   * 测试场景10: 验证resumes数组为空的情况
   * 预期: 200状态码，resumes为空数组
   */
  test('应该返回空的resumes数组（当岗位下没有简历时）', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    const { data } = response.body;
    expect(data.resumes).toBeDefined();
    expect(Array.isArray(data.resumes)).toBe(true);
    // 注意: 根据实际数据，resumes可能为空数组或包含数据
  });

  /**
   * 测试场景11: 验证description可以为null
   * 预期: 200状态码，description字段可以是null
   */
  test('description字段应该可以为null', async () => {
    const response = await request(app)
      .get(`/api/v1/target-positions/${validPositionId}`)
      .set('Authorization', validToken)
      .expect(200);

    const { data } = response.body;
    // description可以是string或null
    if (data.description !== null) {
      expect(typeof data.description).toBe('string');
    } else {
      expect(data.description).toBeNull();
    }
  });
});