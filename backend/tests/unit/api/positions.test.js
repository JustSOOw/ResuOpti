/**
 * positions API 控制器单元测试
 * 测试目标岗位 API 的各项功能
 */

const request = require('supertest');
const express = require('express');
const positionsRouter = require('../../../src/api/positions/index');
const positionService = require('../../../src/services/positionService');

// Mock positionService
jest.mock('../../../src/services/positionService');

// 模拟认证中间件
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id-123' };
  req.userId = 'test-user-id-123';
  next();
};

describe('positions API 控制器', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    app.use('/api/v1/target-positions', positionsRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/v1/target-positions - 获取所有岗位', () => {
    test('应该成功返回用户的所有岗位', async () => {
      const mockPositions = [
        {
          id: 'position-1',
          user_id: 'test-user-id-123',
          name: '前端开发',
          description: '前端开发岗位',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'position-2',
          user_id: 'test-user-id-123',
          name: '后端开发',
          description: '后端开发岗位',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      positionService.getPositionsByUserId.mockResolvedValue(mockPositions);

      const response = await request(app).get('/api/v1/target-positions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title', '前端开发');
      expect(positionService.getPositionsByUserId).toHaveBeenCalledWith('test-user-id-123');
    });

    test('当没有岗位时应该返回空数组', async () => {
      positionService.getPositionsByUserId.mockResolvedValue([]);

      const response = await request(app).get('/api/v1/target-positions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('当未授权时应该返回 401 错误', async () => {
      const noAuthApp = express();
      noAuthApp.use(express.json());
      noAuthApp.use('/api/v1/target-positions', positionsRouter);

      const response = await request(noAuthApp).get('/api/v1/target-positions');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: '未授权访问，请先登录'
      });
    });

    test('当发生错误时应该返回 500 错误', async () => {
      positionService.getPositionsByUserId.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/v1/target-positions');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('获取岗位列表失败');
    });
  });

  describe('POST /api/v1/target-positions - 创建岗位', () => {
    test('应该成功创建新岗位', async () => {
      const requestBody = {
        name: '产品经理',
        description: '产品经理岗位描述'
      };
      const mockPosition = {
        id: 'position-123',
        user_id: 'test-user-id-123',
        name: requestBody.name,
        description: requestBody.description,
        created_at: new Date(),
        updated_at: new Date()
      };

      positionService.createPosition.mockResolvedValue(mockPosition);

      const response = await request(app).post('/api/v1/target-positions').send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('目标岗位创建成功');
      expect(response.body.data).toHaveProperty('title', requestBody.name);
      expect(positionService.createPosition).toHaveBeenCalledWith(
        'test-user-id-123',
        requestBody.name.trim(),
        requestBody.description
      );
    });

    test('应该支持使用 title 字段创建岗位', async () => {
      const requestBody = {
        title: '产品经理',
        description: '产品经理岗位描述'
      };
      const mockPosition = {
        id: 'position-123',
        user_id: 'test-user-id-123',
        name: requestBody.title,
        description: requestBody.description,
        created_at: new Date(),
        updated_at: new Date()
      };

      positionService.createPosition.mockResolvedValue(mockPosition);

      const response = await request(app).post('/api/v1/target-positions').send(requestBody);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(positionService.createPosition).toHaveBeenCalledWith(
        'test-user-id-123',
        requestBody.title.trim(),
        requestBody.description
      );
    });

    test('当缺少岗位名称时应该返回 400 错误', async () => {
      const response = await request(app)
        .post('/api/v1/target-positions')
        .send({ description: '描述' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '岗位名称是必需字段'
      });
      expect(positionService.createPosition).not.toHaveBeenCalled();
    });

    test('当岗位名称为空字符串时应该返回 400 错误', async () => {
      const response = await request(app).post('/api/v1/target-positions').send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '岗位名称是必需字段'
      });
      expect(positionService.createPosition).not.toHaveBeenCalled();
    });

    test('当岗位名称长度超过限制时应该返回 400 错误', async () => {
      positionService.createPosition.mockRejectedValue(new Error('岗位名称长度不能超过100个字符'));

      const response = await request(app)
        .post('/api/v1/target-positions')
        .send({ name: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('岗位名称长度不能超过100个字符');
    });

    test('当岗位名称已存在时应该返回 409 错误', async () => {
      positionService.createPosition.mockRejectedValue(new Error('该岗位名称已存在'));

      const response = await request(app)
        .post('/api/v1/target-positions')
        .send({ name: '前端开发' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        message: '该岗位名称已存在'
      });
    });

    test('应该正确处理名称前后的空格', async () => {
      const mockPosition = {
        id: 'position-123',
        user_id: 'test-user-id-123',
        name: '产品经理',
        created_at: new Date(),
        updated_at: new Date()
      };
      positionService.createPosition.mockResolvedValue(mockPosition);

      await request(app).post('/api/v1/target-positions').send({ name: '  产品经理  ' });

      expect(positionService.createPosition).toHaveBeenCalledWith(
        'test-user-id-123',
        '产品经理',
        undefined
      );
    });
  });

  describe('GET /api/v1/target-positions/:id - 获取岗位详情', () => {
    test('应该成功返回岗位详情', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPosition = {
        id: positionId,
        user_id: 'test-user-id-123',
        name: '前端开发',
        description: '前端开发岗位',
        resumeCount: 5,
        created_at: new Date(),
        updated_at: new Date()
      };

      positionService.getPositionById.mockResolvedValue(mockPosition);

      const response = await request(app).get(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', '前端开发');
      expect(response.body.data).toHaveProperty('resumeCount', 5);
      expect(positionService.getPositionById).toHaveBeenCalledWith(positionId, 'test-user-id-123', true);
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).get('/api/v1/target-positions/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的岗位ID格式'
      });
      expect(positionService.getPositionById).not.toHaveBeenCalled();
    });

    test('当岗位不存在时应该返回 404 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.getPositionById.mockRejectedValue(new Error('岗位不存在'));

      const response = await request(app).get(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('岗位不存在');
    });

    test('当无权限访问时应该返回 403 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.getPositionById.mockRejectedValue(new Error('无权限访问该岗位'));

      const response = await request(app).get(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权限访问该岗位');
    });
  });

  describe('PUT /api/v1/target-positions/:id - 更新岗位', () => {
    test('应该成功更新岗位', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        name: '高级前端开发',
        description: '更新后的描述'
      };
      const mockPosition = {
        id: positionId,
        user_id: 'test-user-id-123',
        name: requestBody.name,
        description: requestBody.description,
        created_at: new Date(),
        updated_at: new Date()
      };

      positionService.updatePosition.mockResolvedValue(mockPosition);

      const response = await request(app)
        .put(`/api/v1/target-positions/${positionId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('岗位更新成功');
      expect(response.body.data).toHaveProperty('title', requestBody.name);
      expect(positionService.updatePosition).toHaveBeenCalledWith(positionId, 'test-user-id-123', {
        name: requestBody.name.trim(),
        description: requestBody.description
      });
    });

    test('应该支持使用 title 字段更新岗位', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        title: '高级前端开发'
      };
      const mockPosition = {
        id: positionId,
        user_id: 'test-user-id-123',
        name: requestBody.title,
        created_at: new Date(),
        updated_at: new Date()
      };

      positionService.updatePosition.mockResolvedValue(mockPosition);

      const response = await request(app)
        .put(`/api/v1/target-positions/${positionId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(positionService.updatePosition).toHaveBeenCalledWith(positionId, 'test-user-id-123', {
        name: requestBody.title.trim()
      });
    });

    test('应该支持只更新描述', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const requestBody = {
        description: '更新后的描述'
      };
      const mockPosition = {
        id: positionId,
        user_id: 'test-user-id-123',
        name: '前端开发',
        description: requestBody.description,
        created_at: new Date(),
        updated_at: new Date()
      };

      positionService.updatePosition.mockResolvedValue(mockPosition);

      const response = await request(app)
        .put(`/api/v1/target-positions/${positionId}`)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(positionService.updatePosition).toHaveBeenCalledWith(positionId, 'test-user-id-123', {
        description: requestBody.description
      });
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app)
        .put('/api/v1/target-positions/invalid-uuid')
        .send({ name: '新名称' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的岗位ID格式'
      });
    });

    test('当没有提供任何更新字段时应该返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app).put(`/api/v1/target-positions/${positionId}`).send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    });

    test('当岗位不存在时应该返回 404 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.updatePosition.mockRejectedValue(new Error('岗位不存在'));

      const response = await request(app)
        .put(`/api/v1/target-positions/${positionId}`)
        .send({ name: '新名称' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('岗位不存在');
    });

    test('当无权限访问时应该返回 403 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.updatePosition.mockRejectedValue(new Error('无权限访问该岗位'));

      const response = await request(app)
        .put(`/api/v1/target-positions/${positionId}`)
        .send({ name: '新名称' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权限访问该岗位');
    });

    test('当新名称已存在时应该返回 409 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.updatePosition.mockRejectedValue(new Error('该岗位名称已存在'));

      const response = await request(app)
        .put(`/api/v1/target-positions/${positionId}`)
        .send({ name: '前端开发' });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('该岗位名称已存在');
    });
  });

  describe('DELETE /api/v1/target-positions/:id - 删除岗位', () => {
    test('应该成功删除岗位', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.deletePosition.mockResolvedValue({ deletedId: positionId });

      const response = await request(app).delete(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: '岗位删除成功',
        data: { deletedId: positionId }
      });
      expect(positionService.deletePosition).toHaveBeenCalledWith(positionId, 'test-user-id-123');
    });

    test('当 UUID 格式无效时应该返回 400 错误', async () => {
      const response = await request(app).delete('/api/v1/target-positions/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: '无效的岗位ID格式'
      });
      expect(positionService.deletePosition).not.toHaveBeenCalled();
    });

    test('当岗位不存在时应该返回 404 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.deletePosition.mockRejectedValue(new Error('岗位不存在'));

      const response = await request(app).delete(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('岗位不存在');
    });

    test('当无权限访问时应该返回 403 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.deletePosition.mockRejectedValue(new Error('无权限访问该岗位'));

      const response = await request(app).delete(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('无权限访问该岗位');
    });

    test('当岗位下有简历无法删除时应该返回 400 错误', async () => {
      const positionId = '123e4567-e89b-12d3-a456-426614174000';
      positionService.deletePosition.mockRejectedValue(
        new Error('该岗位下有简历,无法删除')
      );

      const response = await request(app).delete(`/api/v1/target-positions/${positionId}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('该岗位下有简历,无法删除');
    });
  });
});
