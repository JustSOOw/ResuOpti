/**
 * PUT /api/v1/resumes/:id (元数据更新) 契约测试
 *
 * 测试目标: 验证简历元数据更新API的字段映射和契约合规性
 * 重点: 确保前端发送的notes和tags字段正确映射到后端，并正确返回
 *
 * 测试范围:
 * - 更新简历备注 (notes)
 * - 更新简历标签 (tags)
 * - 同时更新备注和标签
 * - 清空元数据
 * - 字段命名验证（驼峰命名）
 * - 响应数据结构验证
 */

const request = require('supertest');
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

// 测试配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';

describe('PUT /api/v1/resumes/:id - 元数据更新字段映射验证', () => {
  let authToken;
  let testUserId;
  let testTargetPositionId;
  let testResumeId;

  /**
   * 测试前置条件设置
   */
  beforeAll(async () => {
    // 注册测试用户
    const registerResponse = await request(API_BASE_URL)
      .post(`${API_VERSION}/auth/register`)
      .send({
        email: `test-metadata-${Date.now()}@example.com`,
        password: 'Test123456'
      });

    testUserId = registerResponse.body.data?.userId;

    // 登录获取token
    const loginResponse = await request(API_BASE_URL)
      .post(`${API_VERSION}/auth/login`)
      .send({
        email: registerResponse.body.data?.email || `test-metadata-${Date.now()}@example.com`,
        password: 'Test123456'
      });

    authToken = loginResponse.body.data?.token;

    // 创建测试岗位
    const positionResponse = await request(API_BASE_URL)
      .post(`${API_VERSION}/target-positions`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: '测试岗位-元数据验证',
        description: '用于元数据API测试的岗位'
      });

    testTargetPositionId = positionResponse.body.data?.id;

    // 创建测试简历
    const resumeResponse = await request(API_BASE_URL)
      .post(`${API_VERSION}/resumes`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetPositionId: testTargetPositionId,
        type: 'online',
        title: '测试简历-元数据验证',
        content: '测试内容'
      });

    testResumeId = resumeResponse.body.data?.id;
  });

  /**
   * 测试后清理
   */
  afterAll(async () => {
    // 清理测试数据
    if (testResumeId && authToken) {
      await request(API_BASE_URL)
        .delete(`${API_VERSION}/resumes/${testResumeId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    if (testTargetPositionId && authToken) {
      await request(API_BASE_URL)
        .delete(`${API_VERSION}/target-positions/${testTargetPositionId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  /**
   * 测试1: 更新备注字段
   */
  it('应该正确更新简历备注（notes字段）', async () => {
    const updateData = {
      notes: '这是一条测试备注，用于验证字段映射'
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 验证响应状态
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证响应数据结构
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('notes');

    // 验证notes字段正确返回（驼峰命名）
    expect(response.body.data.notes).toBe(updateData.notes);

    // 确保没有下划线命名的字段
    expect(response.body.data).not.toHaveProperty('resume_notes');
    expect(response.body.data).not.toHaveProperty('metadata.notes');
  });

  /**
   * 测试2: 更新标签字段
   */
  it('应该正确更新简历标签（tags字段）', async () => {
    const updateData = {
      tags: ['技术重点', 'React专精', '前端开发']
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 验证响应状态
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证响应数据结构
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toHaveProperty('tags');

    // 验证tags字段正确返回（驼峰命名，数组类型）
    expect(Array.isArray(response.body.data.tags)).toBe(true);
    expect(response.body.data.tags).toHaveLength(3);
    expect(response.body.data.tags).toEqual(updateData.tags);

    // 确保没有下划线命名的字段
    expect(response.body.data).not.toHaveProperty('resume_tags');
    expect(response.body.data).not.toHaveProperty('metadata.tags');
  });

  /**
   * 测试3: 同时更新备注和标签
   */
  it('应该正确同时更新备注和标签', async () => {
    const updateData = {
      notes: '更新后的备注内容',
      tags: ['Vue', 'TypeScript', '全栈开发']
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 验证响应状态
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证两个字段都正确更新
    expect(response.body.data.notes).toBe(updateData.notes);
    expect(response.body.data.tags).toEqual(updateData.tags);
  });

  /**
   * 测试4: 清空备注（设置为null）
   */
  it('应该正确清空备注字段', async () => {
    const updateData = {
      notes: null
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 验证响应状态
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证notes字段为null
    expect(response.body.data.notes).toBeNull();
  });

  /**
   * 测试5: 清空标签（设置为空数组）
   */
  it('应该正确清空标签字段', async () => {
    const updateData = {
      tags: []
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 验证响应状态
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证tags字段为空数组
    expect(Array.isArray(response.body.data.tags)).toBe(true);
    expect(response.body.data.tags).toHaveLength(0);
  });

  /**
   * 测试6: 验证字段命名一致性（驼峰命名）
   */
  it('响应数据应该使用驼峰命名（camelCase）而不是下划线命名', async () => {
    const updateData = {
      notes: '验证字段命名',
      tags: ['测试标签']
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    expect(response.status).toBe(200);

    const data = response.body.data;

    // 验证所有字段都是驼峰命名
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('targetPositionId'); // 不是 target_position_id
    expect(data).toHaveProperty('createdAt'); // 不是 created_at
    expect(data).toHaveProperty('updatedAt'); // 不是 updated_at
    expect(data).toHaveProperty('notes'); // 不是 resume_notes
    expect(data).toHaveProperty('tags'); // 不是 resume_tags

    // 确保没有下划线命名的字段
    expect(data).not.toHaveProperty('target_position_id');
    expect(data).not.toHaveProperty('created_at');
    expect(data).not.toHaveProperty('updated_at');
    expect(data).not.toHaveProperty('file_path');
    expect(data).not.toHaveProperty('file_name');
    expect(data).not.toHaveProperty('file_size');
  });

  /**
   * 测试7: 验证GET请求也返回正确映射的元数据
   */
  it('GET请求应该返回正确映射的元数据字段', async () => {
    // 先更新元数据
    await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        notes: 'GET请求验证备注',
        tags: ['GET', '测试']
      });

    // 然后GET获取
    const response = await request(API_BASE_URL)
      .get(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('notes');
    expect(response.body.data).toHaveProperty('tags');
    expect(response.body.data.notes).toBe('GET请求验证备注');
    expect(response.body.data.tags).toEqual(['GET', '测试']);
  });

  /**
   * 测试8: 验证标签数组限制（最多20个）
   */
  it('应该拒绝超过20个标签的更新请求', async () => {
    const updateData = {
      tags: Array.from({ length: 21 }, (_, i) => `标签${i + 1}`)
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 应该返回错误（400或422或500）
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBe(false);
  });

  /**
   * 测试9: 验证备注长度限制（最多2000字符）
   */
  it('应该拒绝超过2000字符的备注', async () => {
    const updateData = {
      notes: 'a'.repeat(2001)
    };

    const response = await request(API_BASE_URL)
      .put(`${API_VERSION}/resumes/${testResumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);

    // 应该返回错误（400或422或500）
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBe(false);
  });
});
