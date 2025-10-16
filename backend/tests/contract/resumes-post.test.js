/**
 * T020: POST /api/v1/resumes 契约测试
 *
 * 测试目标: 验证创建新简历版本API的契约合规性
 * API规范: /specs/001-/contracts/api-spec.yaml
 *
 * 测试范围:
 * - 创建在线简历 (type: online)
 * - 创建文件简历 (type: file)
 * - 请求参数验证
 * - JWT认证
 * - 响应数据结构验证
 */

const request = require('supertest');
const { describe, it, expect, beforeAll } = require('@jest/globals');
const { generateQuickTestAuth } = require('../utils/auth-helper');
const { v4: uuidv4 } = require('uuid');

// 测试配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';

describe('POST /api/v1/resumes - 创建新简历版本', () => {
  let authToken;
  let testUser;
  let testTargetPositionId = uuidv4(); // 使用UUID作为测试岗位ID

  /**
   * 测试前置条件设置
   */
  beforeAll(() => {
    // 使用token生成器生成有效的测试token
    const auth = generateQuickTestAuth();
    testUser = auth.user;
    authToken = auth.token.replace('Bearer ', ''); // 移除Bearer前缀，因为下面会手动添加
  });

  /**
   * 测试用例组1: 创建在线简历 (type: online)
   */
  describe('创建在线简历', () => {
    it('应该成功创建在线简历并返回201状态码', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: '腾讯前端开发岗位简历',
        content: '<p>这是一份测试简历内容</p><h2>教育背景</h2><p>某某大学计算机专业</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      // 验证响应状态码
      expect(response.status).toBe(201);

      // 验证响应数据结构
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('成功');
      expect(response.body).toHaveProperty('data');

      // 验证ResumeVersion schema字段
      const resumeData = response.body.data;
      expect(resumeData).toHaveProperty('id');
      expect(resumeData.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(resumeData).toHaveProperty('targetPositionId', requestBody.targetPositionId);
      expect(resumeData).toHaveProperty('type', 'online');
      expect(resumeData).toHaveProperty('title', requestBody.title);
      expect(resumeData).toHaveProperty('content', requestBody.content);
      expect(resumeData).toHaveProperty('filePath', null);
      expect(resumeData).toHaveProperty('fileName', null);
      expect(resumeData).toHaveProperty('fileSize', null);
      expect(resumeData).toHaveProperty('createdAt');
      expect(resumeData).toHaveProperty('updatedAt');

      // 验证时间戳格式
      expect(new Date(resumeData.createdAt).toISOString()).toBe(resumeData.createdAt);
      expect(new Date(resumeData.updatedAt).toISOString()).toBe(resumeData.updatedAt);
    });

    it('应该允许创建空内容的在线简历', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: '空内容占位简历',
        content: ''
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('content', requestBody.content);
    });

    it('应该在type=online时要求必填content字段', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: '缺少content的在线简历'
        // 缺少content字段
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      // 应该返回400错误
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/content/i);
    });

    it('应该验证title长度不超过200字符', async () => {
      const longTitle = 'a'.repeat(201);
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: longTitle,
        content: '<p>测试内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/title|长度/i);
    });
  });

  /**
   * 测试用例组2: 创建文件简历 (type: file)
   */
  describe('创建文件简历元数据', () => {
    it('应该成功创建文件类型简历(不含content)', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'file',
        title: '阿里巴巴后端开发岗位简历'
        // type=file时不需要content字段
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');

      const resumeData = response.body.data;
      expect(resumeData).toHaveProperty('type', 'file');
      expect(resumeData).toHaveProperty('title', requestBody.title);
      expect(resumeData).toHaveProperty('content', null);
    });
  });

  /**
   * 测试用例组3: 请求参数验证
   */
  describe('请求参数验证', () => {
    it('应该要求targetPositionId为必填字段', async () => {
      const requestBody = {
        // 缺少targetPositionId
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/targetPositionId/i);
    });

    it('应该要求type为必填字段', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        // 缺少type
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/type/i);
    });

    it('应该要求title为必填字段', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        // 缺少title
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/title/i);
    });

    it('应该验证type枚举值只能为online或file', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'invalid_type',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/type|online|file/i);
    });

    it('应该验证targetPositionId为有效的UUID格式', async () => {
      const requestBody = {
        targetPositionId: 'invalid-uuid',
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/uuid|格式/i);
    });

    it('应该在targetPositionId不存在时返回404错误', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-999999999999';
      const requestBody = {
        targetPositionId: nonExistentId,
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/目标岗位|不存在|未找到/i);
    });
  });

  /**
   * 测试用例组4: JWT认证测试
   */
  describe('JWT认证', () => {
    it('应该在没有Authorization header时返回401错误', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        // 不设置Authorization header
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/未授权|认证|token/i);
    });

    it('应该在token无效时返回401错误', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', 'Bearer invalid-token-12345')
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/无效|token/i);
    });

    it('应该在token格式错误时返回401错误', async () => {
      const requestBody = {
        targetPositionId: testTargetPositionId || '123e4567-e89b-12d3-a456-426614174001',
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', 'InvalidFormat token123')
        .send(requestBody)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  /**
   * 测试用例组5: 权限验证
   */
  describe('权限验证', () => {
    it('应该只允许用户创建属于自己的目标岗位下的简历', async () => {
      // 这个测试需要另一个用户的token和目标岗位
      // 验证用户A不能在用户B的目标岗位下创建简历
      const otherUserPositionId = '999e4567-e89b-12d3-a456-426614174001';
      const requestBody = {
        targetPositionId: otherUserPositionId,
        type: 'online',
        title: '测试简历',
        content: '<p>内容</p>'
      };

      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send(requestBody)
        .expect('Content-Type', /json/);

      // 可能是404(目标岗位不存在)或403(无权访问)
      expect([403, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  /**
   * 测试用例组6: 错误响应格式验证
   */
  describe('错误响应格式', () => {
    it('错误响应应该符合ErrorResponse schema', async () => {
      const response = await request(API_BASE_URL)
        .post(`${API_VERSION}/resumes`)
        .set('Authorization', `Bearer ${authToken || 'mock-token'}`)
        .send({}) // 发送空对象触发验证错误
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);

      // 验证ErrorResponse结构
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');

      // 可选的error对象
      if (response.body.error) {
        expect(response.body.error).toHaveProperty('code');
        expect(typeof response.body.error.code).toBe('string');
      }
    });
  });
});
