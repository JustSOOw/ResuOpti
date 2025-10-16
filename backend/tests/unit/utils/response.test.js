/**
 * response工具 单元测试
 * 测试API响应格式化工具函数
 */

const response = require('../../../src/utils/response');

describe('response - API响应格式化工具', () => {
  let mockRes;

  // 每个测试前创建mock的res对象
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('success - 成功响应', () => {
    test('应该返回标准的成功响应格式', () => {
      const data = { id: '123', name: '测试' };
      response.success(mockRes, data, '操作成功');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: data
      });
    });

    test('应该使用默认消息', () => {
      response.success(mockRes, { id: '123' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '操作成功',
        data: { id: '123' }
      });
    });

    test('应该支持自定义状态码', () => {
      response.success(mockRes, { id: '123' }, '成功', 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('当data为null时不应包含data字段', () => {
      response.success(mockRes, null, '成功');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '成功'
      });
    });

    test('当data为undefined时不应包含data字段', () => {
      response.success(mockRes, undefined, '成功');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '成功'
      });
    });
  });

  describe('error - 错误响应', () => {
    test('应该返回标准的错误响应格式', () => {
      response.error(mockRes, '操作失败', 400);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '操作失败'
      });
    });

    test('应该使用默认消息和状态码', () => {
      response.error(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '操作失败'
      });
    });

    test('在开发环境应该包含error详情', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      response.error(mockRes, '失败', 500, '详细错误信息');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '失败',
        error: '详细错误信息'
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('在生产环境不应包含error详情', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      response.error(mockRes, '失败', 500, '详细错误信息');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '失败'
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('paginate - 分页响应', () => {
    test('应该返回标准的分页响应格式', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      response.paginate(mockRes, items, 1, 20, 100, '查询成功');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '查询成功',
        data: {
          items: items,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 100,
            totalPages: 5
          }
        }
      });
    });

    test('应该正确计算总页数', () => {
      response.paginate(mockRes, [], 1, 20, 95);

      const call = mockRes.json.mock.calls[0][0];
      expect(call.data.pagination.totalPages).toBe(5); // Math.ceil(95/20) = 5
    });

    test('应该将page和pageSize转换为数字', () => {
      response.paginate(mockRes, [], '1', '20', '100');

      const call = mockRes.json.mock.calls[0][0];
      expect(typeof call.data.pagination.page).toBe('number');
      expect(typeof call.data.pagination.pageSize).toBe('number');
      expect(typeof call.data.pagination.total).toBe('number');
    });

    test('应该使用默认消息', () => {
      response.paginate(mockRes, [], 1, 20, 100);

      const call = mockRes.json.mock.calls[0][0];
      expect(call.message).toBe('查询成功');
    });
  });

  describe('created - 创建成功响应', () => {
    test('应该返回201状态码', () => {
      const data = { id: '123', name: '新资源' };
      response.created(mockRes, data, '创建成功');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '创建成功',
        data: data
      });
    });

    test('应该使用默认消息', () => {
      response.created(mockRes, { id: '123' });

      const call = mockRes.json.mock.calls[0][0];
      expect(call.message).toBe('创建成功');
    });
  });

  describe('noContent - 无内容响应', () => {
    test('应该返回204状态码且无响应体', () => {
      response.noContent(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalledWith();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('injectResponseMethods - 中间件注入', () => {
    test('应该将所有响应方法注入到res对象', () => {
      const mockNext = jest.fn();
      response.injectResponseMethods({}, mockRes, mockNext);

      expect(typeof mockRes.success).toBe('function');
      expect(typeof mockRes.error).toBe('function');
      expect(typeof mockRes.paginate).toBe('function');
      expect(typeof mockRes.created).toBe('function');
      expect(typeof mockRes.noContent).toBe('function');
      expect(mockNext).toHaveBeenCalled();
    });

    test('注入的方法应该正常工作', () => {
      const mockNext = jest.fn();
      response.injectResponseMethods({}, mockRes, mockNext);

      // 调用注入的success方法
      mockRes.success({ id: '123' }, '成功');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '成功',
        data: { id: '123' }
      });
    });
  });
});
