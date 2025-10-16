/**
 * upload API 控制器单元测试
 * 测试文件上传 API 的各项功能
 */

const request = require('supertest');
const express = require('express');
const uploadRouter = require('../../../src/api/upload/index');
const fileService = require('../../../src/services/fileService');
const resumeService = require('../../../src/services/resumeService');
const path = require('path');

// Mock services
jest.mock('../../../src/services/fileService');
jest.mock('../../../src/services/resumeService');

// Mock fs module with a proper mock function
jest.mock('fs', () => ({
  promises: {
    rename: jest.fn()
  }
}));

// Get the mocked rename function
const fs = require('fs');

// Mock multer
const mockMulterSingle = jest.fn();
const mockMulterInstance = {
  single: jest.fn(() => mockMulterSingle)
};

// 模拟认证中间件
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id-123' };
  req.userId = 'test-user-id-123';
  next();
};

describe('upload API 控制器', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    app.use('/api/v1/resumes/upload', uploadRouter);
    jest.clearAllMocks();

    // Mock fileService methods
    fileService.getMulterConfig = jest.fn(() => mockMulterInstance);
    fileService.validateFileType = jest.fn(() => true);
    fileService.validateFileSize = jest.fn(() => true);
    fileService.generateFilePath = jest.fn((userId, positionId, filename) => {
      return `/uploads/${userId}/${positionId}/${filename}`;
    });
    fileService.deleteFile = jest.fn();
    fileService.MAX_FILE_SIZE = 10485760; // 10MB
    fileService.ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
  });

  describe('POST /api/v1/resumes/upload - 文件上传', () => {
    test('应该成功上传简历文件', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        fieldname: 'file',
        originalname: 'resume.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400
      };
      const mockResume = {
        id: 'resume-123',
        target_position_id: positionId,
        type: 'file',
        title: '我的简历',
        file_path: `/uploads/test-user-id-123/${positionId}/upload_123.pdf`,
        file_name: 'resume.pdf',
        file_size: 102400,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: { notes: null, tags: [] }
      };

      // Mock multer 中间件成功处理
      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        next();
      });

      fs.promises.rename.mockResolvedValue();
      resumeService.createFileResume.mockResolvedValue(mockResume);

      const response = await request(app).post('/api/v1/resumes/upload').field('targetPositionId', positionId).field('title', '我的简历');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('文件上传成功');
      expect(response.body.data).toHaveProperty('file');
      expect(response.body.data.file).toHaveProperty('originalName', 'resume.pdf');
    });

    test('当未授权时应该返回 401 错误', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/resumes/upload', uploadRouter);

      const response = await request(noAuthApp).post('/api/v1/resumes/upload');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当文件大小超过限制时应该返回 400 错误', async () => {
      const error = new Error('File too large');
      error.code = 'LIMIT_FILE_SIZE';

      mockMulterSingle.mockImplementation((req, res, next) => {
        next(error);
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件大小超过限制');
    });

    test('当文件类型不支持时应该返回 400 错误', async () => {
      const error = new Error('Invalid file type');
      error.code = 'INVALID_FILE_TYPE';

      mockMulterSingle.mockImplementation((req, res, next) => {
        next(error);
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的文件类型');
    });

    test('当缺少目标岗位ID时应该返回 400 错误', async () => {
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { title: '简历标题' };
        next();
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '目标岗位ID是必需字段'
      });
    });

    test('当缺少简历标题时应该返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId };
        next();
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '简历标题是必需字段且不能为空'
      });
    });

    test('当标题为空字符串时应该返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '' };
        next();
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '简历标题是必需字段且不能为空'
      });
    });

    test('当岗位ID格式无效时应该返回 400 错误', async () => {
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: 'invalid-uuid', title: '简历标题' };
        next();
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的岗位ID格式'
      });
    });

    test('当没有选择文件时应该返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.body = { targetPositionId: positionId, title: '简历标题' };
        // req.file 未定义
        next();
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '请选择要上传的文件'
      });
    });

    test('当文件验证失败时应该删除文件并返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.exe',
        path: '/tmp/upload_123.exe',
        filename: 'upload_123.exe',
        size: 102400,
        mimetype: 'application/x-msdownload'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '简历标题' };
        next();
      });

      // Mock 文件类型验证失败
      fileService.validateFileType.mockReturnValue(false);

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不支持的文件类型');
      expect(fileService.deleteFile).toHaveBeenCalled();
    });

    test('当文件大小验证失败时应该删除文件并返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 20971520, // 20MB
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '简历标题' };
        next();
      });

      // Mock 文件大小验证失败
      fileService.validateFileSize.mockReturnValue(false);

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('文件大小超过限制');
      expect(fileService.deleteFile).toHaveBeenCalled();
    });

    test('当目标岗位不存在时应该返回 404 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '简历标题' };
        next();
      });

      fs.promises.rename.mockResolvedValue();
      resumeService.createFileResume.mockRejectedValue(new Error('目标岗位不存在'));

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('目标岗位不存在');
    });

    test('当无权限访问岗位时应该返回 403 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '简历标题' };
        next();
      });

      fs.promises.rename.mockResolvedValue();
      resumeService.createFileResume.mockRejectedValue(new Error('无权限访问该岗位'));

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('无权限访问该岗位');
    });

    test('当简历创建失败时应该清理上传的文件', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '简历标题' };
        next();
      });

      fs.promises.rename.mockResolvedValue();
      resumeService.createFileResume.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(500);
      expect(fileService.deleteFile).toHaveBeenCalledWith(mockFile.path);
    });

    test('当标题长度超过限制时应该返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '简历标题' };
        next();
      });

      fs.promises.rename.mockResolvedValue();
      resumeService.createFileResume.mockRejectedValue(
        new Error('简历标题长度不能超过200个字符')
      );

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('简历标题长度不能超过200个字符');
    });

    test('当 multer 发生未知错误时应该返回 500 错误', async () => {
      const unknownError = new Error('Unknown multer error');

      mockMulterSingle.mockImplementation((req, res, next) => {
        next(unknownError);
      });

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('文件上传失败');
    });

    test('应该正确处理标题前后的空格', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFile = {
        originalname: 'resume.pdf',
        path: '/tmp/upload_123.pdf',
        filename: 'upload_123.pdf',
        size: 102400,
        mimetype: 'application/pdf'
      };
      const mockResume = {
        id: 'resume-123',
        target_position_id: positionId,
        type: 'file',
        title: '我的简历',
        file_path: `/uploads/test-user-id-123/${positionId}/upload_123.pdf`,
        file_name: 'resume.pdf',
        file_size: 102400,
        created_at: new Date(),
        updated_at: new Date(),
        metadata: { notes: null, tags: [] }
      };

      mockMulterSingle.mockImplementation((req, res, next) => {
        req.file = mockFile;
        req.body = { targetPositionId: positionId, title: '  我的简历  ' };
        next();
      });

      fs.promises.rename.mockResolvedValue();
      resumeService.createFileResume.mockResolvedValue(mockResume);

      const response = await request(app).post('/api/v1/resumes/upload');

      expect(response.status).toBe(201);
      expect(resumeService.createFileResume).toHaveBeenCalledWith(
        positionId,
        'test-user-id-123',
        expect.objectContaining({
          title: '我的简历'
        })
      );
    });
  });
});
