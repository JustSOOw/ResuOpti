/**
 * applications API 控制器单元测试
 * 测试投递记录 API 的各项功能
 */

const request = require('supertest');
const express = require('express');
const applicationsRouter = require('../../../src/api/applications/index');
const applicationService = require('../../../src/services/applicationService');

// Mock applicationService
jest.mock('../../../src/services/applicationService');

// 模拟认证中间件
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id-123' };
  req.userId = 'test-user-id-123';
  next();
};

describe('applications API 控制器', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    app.use('/api/v1/applications', applicationsRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/v1/applications - 获取投递记录列表', () => {
    test('应该成功返回用户的所有投递记录', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          resume_id: 'resume-1',
          company_name: 'ABC公司',
          position_title: '前端工程师',
          apply_date: '2024-01-01',
          status: '已投递',
          notes: '备注1',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 'app-2',
          resume_id: 'resume-2',
          company_name: 'XYZ公司',
          position_title: '后端工程师',
          apply_date: '2024-01-02',
          status: '面试中',
          notes: null,
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02')
        }
      ];

      applicationService.getApplicationsByUserId.mockResolvedValue(mockApplications);

      const response = await request(app).get('/api/v1/applications');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('company_name', 'ABC公司');
      expect(response.body.data[1]).toHaveProperty('notes', null);
      expect(applicationService.getApplicationsByUserId).toHaveBeenCalledWith('test-user-id-123');
    });

    test('当没有投递记录时应该返回空数组', async () => {
      applicationService.getApplicationsByUserId.mockResolvedValue([]);

      const response = await request(app).get('/api/v1/applications');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('当未授权时应该返回 401 错误', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/applications', applicationsRouter);

      const response = await request(noAuthApp).get('/api/v1/applications');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当发生错误时应该返回 500 错误', async () => {
      applicationService.getApplicationsByUserId.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/applications');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取投递记录列表失败');
    });
  });

  describe('PUT /api/v1/applications/:id - 更新投递记录', () => {
    test('应该成功更新投递记录的所有字段', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        companyName: '新公司名称',
        positionTitle: '高级前端工程师',
        applicationDate: '2024-02-01',
        status: '已通过',
        notes: '更新的备注'
      };
      const mockUpdated = {
        id: applicationId,
        resume_id: 'resume-1',
        company_name: requestBody.companyName,
        position_title: requestBody.positionTitle,
        apply_date: '2024-02-01',
        status: requestBody.status,
        notes: requestBody.notes,
        created_at: new Date(),
        updated_at: new Date()
      };

      applicationService.updateApplication.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('投递记录更新成功');
      expect(response.body.data).toHaveProperty('company_name', requestBody.companyName);
      expect(applicationService.updateApplication).toHaveBeenCalledWith(
        applicationId,
        'test-user-id-123',
        expect.objectContaining({
          companyName: requestBody.companyName,
          positionTitle: requestBody.positionTitle,
          status: requestBody.status,
          notes: requestBody.notes
        })
      );
    });

    test('应该支持只更新公司名称', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = { companyName: '新公司' };
      const mockUpdated = {
        id: applicationId,
        resume_id: 'resume-1',
        company_name: requestBody.companyName,
        position_title: '前端工程师',
        apply_date: '2024-01-01',
        status: '已投递',
        notes: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      applicationService.updateApplication.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(applicationService.updateApplication).toHaveBeenCalledWith(
        applicationId,
        'test-user-id-123',
        { companyName: requestBody.companyName }
      );
    });

    test('应该支持只更新状态', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = { status: '面试中' };
      const mockUpdated = {
        id: applicationId,
        resume_id: 'resume-1',
        company_name: 'ABC公司',
        position_title: '前端工程师',
        apply_date: '2024-01-01',
        status: requestBody.status,
        notes: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      applicationService.updateApplication.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(applicationService.updateApplication).toHaveBeenCalledWith(
        applicationId,
        'test-user-id-123',
        { status: requestBody.status }
      );
    });

    test('应该支持更新备注为空', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = { notes: null };
      const mockUpdated = {
        id: applicationId,
        resume_id: 'resume-1',
        company_name: 'ABC公司',
        position_title: '前端工程师',
        apply_date: '2024-01-01',
        status: '已投递',
        notes: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      applicationService.updateApplication.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(applicationService.updateApplication).toHaveBeenCalledWith(
        applicationId,
        'test-user-id-123',
        { notes: null }
      );
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app)
        .put('/api/v1/applications/invalid-uuid')
        .send({ status: '已通过' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的投递记录ID格式'
      });
      expect(applicationService.updateApplication).not.toHaveBeenCalled();
    });

    test('当没有提供任何更新字段时应该返回 400 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '至少需要提供一个更新字段'
      });
      expect(applicationService.updateApplication).not.toHaveBeenCalled();
    });

    test('当投递记录不存在时应该返回 404 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(new Error('投递记录不存在'));

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('投递记录不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(new Error('无权访问该投递记录'));

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该投递记录');
    });

    test('当公司名称为空时应该返回 400 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(new Error('公司名称不能为空'));

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ companyName: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('公司名称不能为空');
    });

    test('当公司名称超过长度限制时应该返回 400 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(
        new Error('公司名称长度不能超过100个字符')
      );

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ companyName: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('公司名称长度不能超过100个字符');
    });

    test('当投递日期为未来日期时应该返回 400 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(
        new Error('投递日期不能为未来日期')
      );

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ applicationDate: '2999-12-31' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('投递日期不能为未来日期');
    });

    test('当状态值无效时应该返回 400 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(new Error('无效的状态值'));

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ status: '无效状态' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('无效的状态值');
    });

    test('当未授权时应该返回 401 错误', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/applications', applicationsRouter);

      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(noAuthApp)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当发生未知错误时应该返回 500 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.updateApplication.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('更新投递记录失败');
    });
  });

  describe('DELETE /api/v1/applications/:id - 删除投递记录', () => {
    test('应该成功删除投递记录', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.deleteApplication.mockResolvedValue();

      const response = await request(app).delete(`/api/v1/applications/${applicationId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: '投递记录删除成功'
      });
      expect(applicationService.deleteApplication).toHaveBeenCalledWith(
        applicationId,
        'test-user-id-123'
      );
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).delete('/api/v1/applications/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的投递记录ID格式'
      });
      expect(applicationService.deleteApplication).not.toHaveBeenCalled();
    });

    test('当投递记录不存在时应该返回 404 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.deleteApplication.mockRejectedValue(new Error('投递记录不存在'));

      const response = await request(app).delete(`/api/v1/applications/${applicationId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('投递记录不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.deleteApplication.mockRejectedValue(new Error('无权访问该投递记录'));

      const response = await request(app).delete(`/api/v1/applications/${applicationId}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该投递记录');
    });

    test('当未授权时应该返回 401 错误', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/applications', applicationsRouter);

      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(noAuthApp).delete(`/api/v1/applications/${applicationId}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当发生未知错误时应该返回 500 错误', async () => {
      const applicationId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.deleteApplication.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete(`/api/v1/applications/${applicationId}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('删除投递记录失败');
    });
  });
});
