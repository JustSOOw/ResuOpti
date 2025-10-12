/**
 * resumes API 控制器单元测试
 * 测试简历版本 API 的各项功能
 */

const request = require('supertest');
const express = require('express');
const resumesRouter = require('../../../src/api/resumes/index');
const resumeService = require('../../../src/services/resumeService');
const metadataService = require('../../../src/services/metadataService');
const applicationService = require('../../../src/services/applicationService');

// Mock services
jest.mock('../../../src/services/resumeService');
jest.mock('../../../src/services/metadataService');
jest.mock('../../../src/services/applicationService');

// 模拟认证中间件
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id-123' };
  req.userId = 'test-user-id-123';
  next();
};

describe('resumes API 控制器', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    app.use('/api/v1/resumes', resumesRouter);
    app.use('/api/v1/target-positions', resumesRouter);
    jest.clearAllMocks();
  });

  describe('POST /api/v1/resumes - 创建简历', () => {
    test('应该成功创建在线简历', async () => {
      const requestBody = {
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        title: '前端开发简历',
        content: '<p>简历内容</p>'
      };
      const mockResume = {
        id: 'resume-123',
        target_position_id: requestBody.targetPositionId,
        type: 'online',
        title: requestBody.title,
        content: requestBody.content,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          notes: null,
          tags: []
        }
      };

      resumeService.createOnlineResume.mockResolvedValue(mockResume);

      const response = await request(app).post('/api/v1/resumes').send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('简历创建成功');
      expect(response.body.data).toHaveProperty('resumeType', 'online');
      expect(resumeService.createOnlineResume).toHaveBeenCalledWith(
        requestBody.targetPositionId,
        'test-user-id-123',
        {
          title: requestBody.title.trim(),
          content: requestBody.content
        }
      );
    });

    test('应该成功创建文件简历', async () => {
      const requestBody = {
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'file',
        title: '后端开发简历',
        filePath: '/uploads/resume.pdf',
        fileName: 'resume.pdf',
        fileSize: 102400
      };
      const mockResume = {
        id: 'resume-123',
        target_position_id: requestBody.targetPositionId,
        type: 'file',
        title: requestBody.title,
        file_path: requestBody.filePath,
        file_name: requestBody.fileName,
        file_size: requestBody.fileSize,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          notes: null,
          tags: []
        }
      };

      resumeService.createFileResume.mockResolvedValue(mockResume);

      const response = await request(app).post('/api/v1/resumes').send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('resumeType', 'file');
      expect(resumeService.createFileResume).toHaveBeenCalledWith(
        requestBody.targetPositionId,
        'test-user-id-123',
        {
          title: requestBody.title.trim(),
          filePath: requestBody.filePath,
          fileName: requestBody.fileName,
          fileSize: requestBody.fileSize
        }
      );
    });

    test('应该支持使用 resumeType 字段', async () => {
      const requestBody = {
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        resumeType: 'online',
        title: '产品经理简历',
        content: '<p>内容</p>'
      };
      const mockResume = {
        id: 'resume-123',
        target_position_id: requestBody.targetPositionId,
        type: 'online',
        title: requestBody.title,
        content: requestBody.content,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: { notes: null, tags: [] }
      };

      resumeService.createOnlineResume.mockResolvedValue(mockResume);

      const response = await request(app).post('/api/v1/resumes').send(requestBody);

      expect(response.status).toBe(201);
      expect(resumeService.createOnlineResume).toHaveBeenCalled();
    });

    test('当缺少目标岗位ID时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/resumes')
        .send({ type: 'online', title: '简历', content: '内容' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '目标岗位ID是必需字段'
      });
    });

    test('当缺少简历类型时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        title: '简历'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '简历类型是必需字段'
      });
    });

    test('当简历类型无效时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'invalid',
        title: '简历'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '简历类型必须是online或file'
      });
    });

    test('当缺少标题时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        content: '内容'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '简历标题是必需字段且不能为空'
      });
    });

    test('当在线简历缺少 content 时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        title: '简历'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '在线简历必须提供content字段'
      });
    });

    test('当文件简历缺少文件信息时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'file',
        title: '简历'
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '文件简历必须提供文件路径、文件名和文件大小'
      });
    });

    test('当目标岗位不存在时应该返回 404 错误', async () => {
      resumeService.createOnlineResume.mockRejectedValue(new Error('目标岗位不存在'));

      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        title: '简历',
        content: '内容'
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('目标岗位不存在');
    });

    test('当无权访问目标岗位时应该返回 403 错误', async () => {
      resumeService.createOnlineResume.mockRejectedValue(new Error('无权访问该岗位'));

      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        title: '简历',
        content: '内容'
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该岗位');
    });
  });

  describe('GET /api/v1/resumes?positionId=xxx - 获取岗位简历列表', () => {
    test('应该成功返回指定岗位的简历列表', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResumes = [
        {
          id: 'resume-1',
          target_position_id: positionId,
          type: 'online',
          title: '简历1',
          content: '内容1',
          created_at: new Date(),
          updated_at: new Date(),
          metadata: { notes: null, tags: [] }
        },
        {
          id: 'resume-2',
          target_position_id: positionId,
          type: 'file',
          title: '简历2',
          file_path: '/uploads/resume.pdf',
          file_name: 'resume.pdf',
          file_size: 102400,
          created_at: new Date(),
          updated_at: new Date(),
          metadata: { notes: '备注', tags: ['tag1'] }
        }
      ];

      resumeService.getResumesByPosition.mockResolvedValue(mockResumes);

      const response = await request(app).get(`/api/v1/resumes?positionId=${positionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('resumeType', 'online');
      expect(resumeService.getResumesByPosition).toHaveBeenCalledWith(
        positionId,
        'test-user-id-123'
      );
    });

    test('当缺少 positionId 参数时应该返回 400 错误', async () => {
      const response = await request(app).get('/api/v1/resumes');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '缺少必需的查询参数: positionId'
      });
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).get('/api/v1/resumes?positionId=invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的岗位ID格式'
      });
    });

    test('当岗位不存在时应该返回 404 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumesByPosition.mockRejectedValue(new Error('岗位不存在'));

      const response = await request(app).get(`/api/v1/resumes?positionId=${positionId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('岗位不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumesByPosition.mockRejectedValue(new Error('无权访问该岗位'));

      const response = await request(app).get(`/api/v1/resumes?positionId=${positionId}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该岗位');
    });
  });

  describe('GET /api/v1/resumes/:id - 获取简历详情', () => {
    test('应该成功返回简历详情', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResume = {
        id: resumeId,
        target_position_id: 'position-123',
        type: 'online',
        title: '前端开发简历',
        content: '<p>简历内容</p>',
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          notes: '这是备注',
          tags: ['技术', 'React']
        }
      };

      resumeService.getResumeById.mockResolvedValue(mockResume);

      const response = await request(app).get(`/api/v1/resumes/${resumeId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', resumeId);
      expect(response.body.data).toHaveProperty('notes', '这是备注');
      expect(response.body.data).toHaveProperty('tags');
      expect(response.body.data.tags).toEqual(['技术', 'React']);
      expect(resumeService.getResumeById).toHaveBeenCalledWith(resumeId, 'test-user-id-123');
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).get('/api/v1/resumes/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('当简历不存在时应该返回 404 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumeById.mockRejectedValue(new Error('简历不存在'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('简历不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumeById.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });
  });

  describe('PUT /api/v1/resumes/:id - 更新简历', () => {
    test('应该成功更新简历内容', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        title: '更新后的标题',
        content: '<p>更新后的内容</p>'
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        title: requestBody.title,
        content: requestBody.content,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: { notes: null, tags: [] }
      };

      resumeService.updateOnlineResume.mockResolvedValue(mockResume);

      const response = await request(app).put(`/api/v1/resumes/${resumeId}`).send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('简历更新成功');
      expect(resumeService.updateOnlineResume).toHaveBeenCalledWith(resumeId, 'test-user-id-123', {
        title: requestBody.title.trim(),
        content: requestBody.content
      });
    });

    test('应该成功更新简历元数据', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        notes: '新的备注',
        tags: ['新标签']
      };
      const mockResume = {
        id: resumeId,
        type: 'online',
        title: '简历标题',
        content: '内容',
        created_at: new Date(),
        updated_at: new Date(),
        metadata: {
          notes: requestBody.notes,
          tags: requestBody.tags
        }
      };

      resumeService.updateResumeMetadata.mockResolvedValue(null);
      resumeService.getResumeById.mockResolvedValue(mockResume);

      const response = await request(app).put(`/api/v1/resumes/${resumeId}`).send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(resumeService.updateResumeMetadata).toHaveBeenCalledWith(resumeId, 'test-user-id-123', {
        notes: requestBody.notes,
        tags: requestBody.tags
      });
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).put('/api/v1/resumes/invalid-uuid').send({ title: '新标题' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('当没有提供任何更新字段时应该返回 400 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app).put(`/api/v1/resumes/${resumeId}`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    });

    test('当简历不存在时应该返回 404 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.updateOnlineResume.mockRejectedValue(new Error('简历不存在'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}`)
        .send({ title: '新标题' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('简历不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.updateOnlineResume.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}`)
        .send({ title: '新标题' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });

    test('当尝试更新文件类型简历时应该返回 400 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.updateOnlineResume.mockRejectedValue(new Error('不支持更新file类型简历'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}`)
        .send({ content: '新内容' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('不支持更新file类型简历');
    });
  });

  describe('DELETE /api/v1/resumes/:id - 删除简历', () => {
    test('应该成功删除简历', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.deleteResume.mockResolvedValue();

      const response = await request(app).delete(`/api/v1/resumes/${resumeId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: '简历删除成功'
      });
      expect(resumeService.deleteResume).toHaveBeenCalledWith(resumeId, 'test-user-id-123');
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).delete('/api/v1/resumes/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('当简历不存在时应该返回 404 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.deleteResume.mockRejectedValue(new Error('简历不存在'));

      const response = await request(app).delete(`/api/v1/resumes/${resumeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('简历不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.deleteResume.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app).delete(`/api/v1/resumes/${resumeId}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });
  });

  describe('GET /api/v1/target-positions/:positionId/resumes - 获取岗位简历', () => {
    test('应该成功返回岗位下的所有简历', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResumes = [
        {
          id: 'resume-1',
          target_position_id: positionId,
          type: 'online',
          title: '简历1',
          content: '内容1',
          created_at: new Date(),
          updated_at: new Date(),
          metadata: { notes: null, tags: [] }
        }
      ];

      resumeService.getResumesByPosition.mockResolvedValue(mockResumes);

      const response = await request(app).get(`/api/v1/target-positions/${positionId}/resumes`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(resumeService.getResumesByPosition).toHaveBeenCalledWith(
        positionId,
        'test-user-id-123'
      );
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).get('/api/v1/target-positions/invalid-uuid/resumes');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的岗位ID格式'
      });
    });
  });

  describe('POST /api/v1/resumes/:id/applications - 创建投递记录', () => {
    test('应该成功创建投递记录', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        companyName: 'ABC公司',
        positionTitle: '前端开发工程师',
        applicationDate: '2024-01-01',
        status: '已投递',
        notes: '投递备注'
      };
      const mockApplication = {
        id: 'application-123',
        resume_id: resumeId,
        company_name: requestBody.companyName,
        position_title: requestBody.positionTitle,
        apply_date: '2024-01-01',
        status: requestBody.status,
        notes: requestBody.notes,
        created_at: new Date(),
        updated_at: new Date()
      };

      applicationService.createApplication.mockResolvedValue(mockApplication);
      applicationService.getApplicationById.mockResolvedValue(mockApplication);

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/applications`)
        .send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('投递记录创建成功');
      expect(applicationService.createApplication).toHaveBeenCalledWith(
        resumeId,
        'test-user-id-123',
        expect.objectContaining({
          companyName: requestBody.companyName.trim()
        })
      );
    });

    test('当公司名称为空时应该返回 400 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/applications`)
        .send({ companyName: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '公司名称不能为空'
      });
    });
  });

  describe('PUT /api/v1/resumes/:id/metadata - 更新简历元数据', () => {
    test('应该成功更新简历元数据', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        notes: '更新的备注',
        tags: ['新标签1', '新标签2']
      };
      const mockMetadata = {
        resume_id: resumeId,
        notes: requestBody.notes,
        tags: requestBody.tags
      };

      metadataService.updateMetadata.mockResolvedValue(mockMetadata);

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/metadata`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('元数据更新成功');
      expect(response.body.data).toHaveProperty('notes', requestBody.notes);
      expect(response.body.data).toHaveProperty('tags', requestBody.tags);
      expect(metadataService.updateMetadata).toHaveBeenCalledWith(resumeId, 'test-user-id-123', {
        notes: requestBody.notes,
        tags: requestBody.tags
      });
    });

    test('当没有提供更新字段时应该返回 400 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app).put(`/api/v1/resumes/${resumeId}/metadata`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    });
  });

  describe('GET /api/v1/resumes/:id/metadata - 获取简历元数据', () => {
    test('应该成功获取简历元数据', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const mockMetadata = {
        resume_id: resumeId,
        notes: '备注内容',
        tags: ['标签1', '标签2']
      };

      metadataService.getMetadataByResumeId.mockResolvedValue(mockMetadata);

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/metadata`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        resumeId: resumeId,
        notes: mockMetadata.notes,
        tags: mockMetadata.tags
      });
      expect(metadataService.getMetadataByResumeId).toHaveBeenCalledWith(
        resumeId,
        'test-user-id-123'
      );
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).get('/api/v1/resumes/invalid-uuid/metadata');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('当元数据不存在时应该返回 404 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.getMetadataByResumeId.mockRejectedValue(new Error('元数据不存在'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/metadata`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('元数据不存在');
    });

    test('当无权访问时应该返回 403 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.getMetadataByResumeId.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/metadata`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });

    test('当发生未知错误时应该返回 500 错误', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.getMetadataByResumeId.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/metadata`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取元数据失败');
    });
  });

  // 测试未授权访问的情况
  describe('未授权访问测试', () => {
    let noAuthApp;

    beforeEach(() => {
      noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/resumes', resumesRouter);
      noAuthApp.use('/api/v1/target-positions', resumesRouter);
    });

    test('POST /api/v1/resumes 未授权应该返回 401', async () => {
      const response = await request(noAuthApp)
        .post('/api/v1/resumes')
        .send({
          targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'online',
          title: '简历',
          content: '内容'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('GET /api/v1/resumes 未授权应该返回 401', async () => {
      const response = await request(noAuthApp).get(
        '/api/v1/resumes?positionId=123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('GET /api/v1/resumes/:id 未授权应该返回 401', async () => {
      const response = await request(noAuthApp).get(
        '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('PUT /api/v1/resumes/:id 未授权应该返回 401', async () => {
      const response = await request(noAuthApp)
        .put('/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000')
        .send({ title: '新标题' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('DELETE /api/v1/resumes/:id 未授权应该返回 401', async () => {
      const response = await request(noAuthApp).delete(
        '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('GET /api/v1/target-positions/:positionId/resumes 未授权应该返回 401', async () => {
      const response = await request(noAuthApp).get(
        '/api/v1/target-positions/123e4567-e89b-12d3-a456-426614174000/resumes'
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('POST /api/v1/resumes/:id/applications 未授权应该返回 401', async () => {
      const response = await request(noAuthApp)
        .post('/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000/applications')
        .send({ companyName: 'ABC公司' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('PUT /api/v1/resumes/:id/metadata 未授权应该返回 401', async () => {
      const response = await request(noAuthApp)
        .put('/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000/metadata')
        .send({ notes: '备注' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('GET /api/v1/resumes/:id/metadata 未授权应该返回 401', async () => {
      const response = await request(noAuthApp).get(
        '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000/metadata'
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });
  });

  // 测试 500 错误的情况
  describe('500 错误处理测试', () => {
    test('POST /api/v1/resumes 创建简历时的验证错误 - 长度限制', async () => {
      resumeService.createOnlineResume.mockRejectedValue(new Error('标题长度不能超过200个字符'));

      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        title: 'a'.repeat(201),
        content: '内容'
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('标题长度不能超过200个字符');
    });

    test('POST /api/v1/resumes 创建简历时发生未知错误应该返回 500', async () => {
      resumeService.createOnlineResume.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).post('/api/v1/resumes').send({
        targetPositionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'online',
        title: '简历',
        content: '内容'
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('创建简历失败');
    });

    test('GET /api/v1/resumes 查询简历列表时发生未知错误应该返回 500', async () => {
      resumeService.getResumesByPosition.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(
        '/api/v1/resumes?positionId=123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取简历列表失败');
    });

    test('GET /api/v1/resumes/:id 获取简历详情时发生未知错误应该返回 500', async () => {
      resumeService.getResumeById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(
        '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取简历详情失败');
    });

    test('PUT /api/v1/resumes/:id 更新简历时发生未知错误应该返回 500', async () => {
      resumeService.updateOnlineResume.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000')
        .send({ title: '新标题' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('更新简历失败');
    });

    test('PUT /api/v1/resumes/:id 更新简历标题为空应该返回 400', async () => {
      const response = await request(app)
        .put('/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000')
        .send({ title: '  ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '简历标题不能为空'
      });
    });

    test('DELETE /api/v1/resumes/:id 删除简历时发生未知错误应该返回 500', async () => {
      resumeService.deleteResume.mockRejectedValue(new Error('Database error'));

      const response = await request(app).delete(
        '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('删除简历失败');
    });

    test('GET /api/v1/target-positions/:positionId/resumes 获取岗位简历时的 404 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumesByPosition.mockRejectedValue(new Error('岗位不存在'));

      const response = await request(app).get(`/api/v1/target-positions/${positionId}/resumes`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('岗位不存在');
    });

    test('GET /api/v1/target-positions/:positionId/resumes 获取岗位简历时的 403 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumesByPosition.mockRejectedValue(new Error('无权访问该岗位'));

      const response = await request(app).get(`/api/v1/target-positions/${positionId}/resumes`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该岗位');
    });

    test('GET /api/v1/target-positions/:positionId/resumes 发生未知错误应该返回 500', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      resumeService.getResumesByPosition.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(`/api/v1/target-positions/${positionId}/resumes`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取岗位简历列表失败');
    });

    test('POST /api/v1/resumes/:id/applications UUID格式无效应该返回 400', async () => {
      const response = await request(app)
        .post('/api/v1/resumes/invalid-uuid/applications')
        .send({ companyName: 'ABC公司' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('POST /api/v1/resumes/:id/applications 简历不存在应该返回 404', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.createApplication.mockRejectedValue(new Error('简历不存在'));

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/applications`)
        .send({ companyName: 'ABC公司' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('简历不存在');
    });

    test('POST /api/v1/resumes/:id/applications 无权访问应该返回 403', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.createApplication.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/applications`)
        .send({ companyName: 'ABC公司' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });

    test('POST /api/v1/resumes/:id/applications 验证错误应该返回 400', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.createApplication.mockRejectedValue(
        new Error('公司名称长度不能超过100个字符')
      );

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/applications`)
        .send({ companyName: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('公司名称长度不能超过100个字符');
    });

    test('POST /api/v1/resumes/:id/applications 发生未知错误应该返回 500', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.createApplication.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/applications`)
        .send({ companyName: 'ABC公司' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('创建投递记录失败');
    });

    test('PUT /api/v1/resumes/:id/metadata UUID格式无效应该返回 400', async () => {
      const response = await request(app)
        .put('/api/v1/resumes/invalid-uuid/metadata')
        .send({ notes: '备注' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('PUT /api/v1/resumes/:id/metadata 元数据不存在应该返回 404', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.updateMetadata.mockRejectedValue(new Error('元数据不存在'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/metadata`)
        .send({ notes: '备注' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('元数据不存在');
    });

    test('PUT /api/v1/resumes/:id/metadata 无权访问应该返回 403', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.updateMetadata.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/metadata`)
        .send({ notes: '备注' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });

    test('PUT /api/v1/resumes/:id/metadata 发生未知错误应该返回 500', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.updateMetadata.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/metadata`)
        .send({ notes: '备注' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('更新元数据失败');
    });
  });

  // 测试添加标签功能
  describe('POST /api/v1/resumes/:id/metadata/tags - 添加标签', () => {
    test('应该成功添加标签', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = { tag: '新标签' };
      const mockMetadata = {
        resume_id: resumeId,
        notes: '备注',
        tags: ['旧标签', '新标签']
      };

      metadataService.addTag.mockResolvedValue(mockMetadata);

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/metadata/tags`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('标签添加成功');
      expect(response.body.data).toHaveProperty('tags');
      expect(response.body.data.tags).toContain('新标签');
      expect(metadataService.addTag).toHaveBeenCalledWith(resumeId, 'test-user-id-123', '新标签');
    });

    test('当未授权时应该返回 401', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/resumes', resumesRouter);

      const response = await request(noAuthApp)
        .post('/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000/metadata/tags')
        .send({ tag: '标签' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当 UUID 格式无效时应该返回 400', async () => {
      const response = await request(app)
        .post('/api/v1/resumes/invalid-uuid/metadata/tags')
        .send({ tag: '标签' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('当标签为空时应该返回 400', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/metadata/tags`)
        .send({ tag: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '标签不能为空'
      });
    });

    test('当简历不存在时应该返回 404', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.addTag.mockRejectedValue(new Error('简历不存在'));

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/metadata/tags`)
        .send({ tag: '标签' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('简历不存在');
    });

    test('当无权访问时应该返回 403', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.addTag.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/metadata/tags`)
        .send({ tag: '标签' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });

    test('当发生未知错误时应该返回 500', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      metadataService.addTag.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post(`/api/v1/resumes/${resumeId}/metadata/tags`)
        .send({ tag: '标签' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('添加标签失败');
    });
  });

  // 测试获取简历的投递记录
  describe('GET /api/v1/resumes/:id/applications - 获取简历的投递记录', () => {
    test('应该成功获取简历的所有投递记录', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const mockApplications = [
        {
          id: 'app-1',
          resume_id: resumeId,
          company_name: 'ABC公司',
          position_title: '前端工程师',
          apply_date: '2024-01-01',
          status: '已投递',
          notes: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'app-2',
          resume_id: resumeId,
          company_name: 'XYZ公司',
          position_title: '后端工程师',
          apply_date: '2024-01-02',
          status: '面试中',
          notes: '备注',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      applicationService.getApplicationsByResumeId.mockResolvedValue(mockApplications);

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/applications`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('companyName', 'ABC公司');
      expect(applicationService.getApplicationsByResumeId).toHaveBeenCalledWith(
        resumeId,
        'test-user-id-123'
      );
    });

    test('当未授权时应该返回 401', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/resumes', resumesRouter);

      const response = await request(noAuthApp).get(
        '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000/applications'
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当 UUID 格式无效时应该返回 400', async () => {
      const response = await request(app).get('/api/v1/resumes/invalid-uuid/applications');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的简历ID格式'
      });
    });

    test('当简历不存在时应该返回 404', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.getApplicationsByResumeId.mockRejectedValue(new Error('简历不存在'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/applications`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('简历不存在');
    });

    test('当无权访问时应该返回 403', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.getApplicationsByResumeId.mockRejectedValue(new Error('无权访问该简历'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/applications`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权访问该简历');
    });

    test('当发生未知错误时应该返回 500', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      applicationService.getApplicationsByResumeId.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get(`/api/v1/resumes/${resumeId}/applications`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取投递记录失败');
    });
  });

  // 测试更新投递记录
  describe('PUT /api/v1/resumes/:id/applications/:applicationId - 更新投递记录', () => {
    test('应该成功更新投递记录', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';
      const requestBody = {
        companyName: '更新的公司',
        status: '已通过'
      };
      const mockUpdated = {
        id: applicationId,
        resume_id: resumeId,
        company_name: requestBody.companyName,
        position_title: '前端工程师',
        apply_date: '2024-01-01',
        status: requestBody.status,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
        resume: {
          id: resumeId,
          type: 'online',
          title: '简历',
          created_at: new Date(),
          updated_at: new Date()
        }
      };

      applicationService.updateApplication.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('投递记录更新成功');
      expect(response.body.data).toHaveProperty('companyName', requestBody.companyName);
      expect(applicationService.updateApplication).toHaveBeenCalledWith(
        applicationId,
        'test-user-id-123',
        expect.objectContaining({
          companyName: requestBody.companyName,
          status: requestBody.status
        })
      );
    });

    test('当未授权时应该返回 401', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/resumes', resumesRouter);

      const response = await request(noAuthApp)
        .put(
          '/api/v1/resumes/123e4567-e89b-12d3-a456-426614174000/applications/456e7890-e12b-34c5-d678-901234567890'
        )
        .send({ status: '已通过' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当 UUID 格式无效时应该返回 400', async () => {
      const response = await request(app)
        .put('/api/v1/resumes/invalid-uuid/applications/also-invalid')
        .send({ status: '已通过' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的ID格式'
      });
    });

    test('当没有提供更新字段时应该返回 400', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    });

    test('当投递记录不属于指定简历时应该返回 404', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';
      const mockUpdated = {
        id: applicationId,
        resume_id: 'different-resume-id',
        company_name: '公司',
        created_at: new Date(),
        updated_at: new Date(),
        resume: {
          id: 'different-resume-id'
        }
      };

      applicationService.updateApplication.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        message: '投递记录不属于指定简历'
      });
    });

    test('当投递记录不存在时应该返回 404', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';
      applicationService.updateApplication.mockRejectedValue(new Error('投递记录不存在'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('投递记录不存在');
    });

    test('当无权访问时应该返回 403', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';
      applicationService.updateApplication.mockRejectedValue(new Error('无权访问该投递记录'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权访问该投递记录');
    });

    test('当验证错误时应该返回 400', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';
      applicationService.updateApplication.mockRejectedValue(
        new Error('公司名称长度不能超过100个字符')
      );

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send({ companyName: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('公司名称长度不能超过100个字符');
    });

    test('当发生未知错误时应该返回 500', async () => {
      const resumeId = '123e4567-e89b-12d3-a456-426614174000';
      const applicationId = '456e7890-e12b-34c5-d678-901234567890';
      applicationService.updateApplication.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/api/v1/resumes/${resumeId}/applications/${applicationId}`)
        .send({ status: '已通过' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('更新投递记录失败');
    });
  });
});
