/**
 * 错误处理中间件单元测试
 * 测试所有错误类型和边界情况
 */

const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalError,
  errorHandler,
  asyncHandler,
  notFoundHandler
} = require('../../../src/middleware/error');

describe('Error Middleware - Error Classes', () => {
  describe('AppError', () => {
    it('应该创建带有默认状态码的错误', () => {
      const error = new AppError('测试错误');
      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('应该创建带有自定义状态码的错误', () => {
      const error = new AppError('测试错误', 418);
      expect(error.message).toBe('测试错误');
      expect(error.statusCode).toBe(418);
    });

    it('应该捕获堆栈跟踪', () => {
      const error = new AppError('测试错误');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('测试错误');
    });

    it('应该继承自Error类', () => {
      const error = new AppError('测试错误');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('ValidationError', () => {
    it('应该创建400状态码的验证错误', () => {
      const error = new ValidationError();
      expect(error.message).toBe('请求参数验证失败');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('应该接受自定义错误消息', () => {
      const error = new ValidationError('邮箱格式错误');
      expect(error.message).toBe('邮箱格式错误');
      expect(error.statusCode).toBe(400);
    });

    it('应该继承自AppError', () => {
      const error = new ValidationError();
      expect(error).toBeInstanceOf(AppError);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('AuthenticationError', () => {
    it('应该创建401状态码的认证错误', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('认证失败，请重新登录');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });

    it('应该接受自定义错误消息', () => {
      const error = new AuthenticationError('Token已过期');
      expect(error.message).toBe('Token已过期');
      expect(error.statusCode).toBe(401);
    });

    it('应该继承自AppError', () => {
      const error = new AuthenticationError();
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('AuthorizationError', () => {
    it('应该创建403状态码的授权错误', () => {
      const error = new AuthorizationError();
      expect(error.message).toBe('权限不足，无法访问该资源');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('AuthorizationError');
    });

    it('应该接受自定义错误消息', () => {
      const error = new AuthorizationError('无权访问此岗位');
      expect(error.message).toBe('无权访问此岗位');
      expect(error.statusCode).toBe(403);
    });

    it('应该继承自AppError', () => {
      const error = new AuthorizationError();
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('NotFoundError', () => {
    it('应该创建404状态码的资源不存在错误', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('请求的资源不存在');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('应该接受自定义错误消息', () => {
      const error = new NotFoundError('用户不存在');
      expect(error.message).toBe('用户不存在');
      expect(error.statusCode).toBe(404);
    });

    it('应该继承自AppError', () => {
      const error = new NotFoundError();
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('ConflictError', () => {
    it('应该创建409状态码的资源冲突错误', () => {
      const error = new ConflictError();
      expect(error.message).toBe('资源冲突，操作无法完成');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('应该接受自定义错误消息', () => {
      const error = new ConflictError('邮箱已被注册');
      expect(error.message).toBe('邮箱已被注册');
      expect(error.statusCode).toBe(409);
    });

    it('应该继承自AppError', () => {
      const error = new ConflictError();
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('InternalError', () => {
    it('应该创建500状态码的内部错误', () => {
      const error = new InternalError();
      expect(error.message).toBe('服务器内部错误，请稍后重试');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalError');
    });

    it('应该接受自定义错误消息', () => {
      const error = new InternalError('数据库连接失败');
      expect(error.message).toBe('数据库连接失败');
      expect(error.statusCode).toBe(500);
    });

    it('应该继承自AppError', () => {
      const error = new InternalError();
      expect(error).toBeInstanceOf(AppError);
    });
  });
});

describe('Error Middleware - errorHandler', () => {
  let req, res, next, consoleErrorSpy;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    req = {
      originalUrl: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
      body: { test: 'data' },
      params: { id: '123' },
      query: { page: '1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('AppError handling', () => {
    it('应该正确处理ValidationError', () => {
      const error = new ValidationError('邮箱格式错误');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '邮箱格式错误'
      });
    });

    it('应该正确处理AuthenticationError', () => {
      const error = new AuthenticationError('Token已过期');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token已过期'
      });
    });

    it('应该正确处理AuthorizationError', () => {
      const error = new AuthorizationError('无权访问此资源');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '无权访问此资源'
      });
    });

    it('应该正确处理NotFoundError', () => {
      const error = new NotFoundError('资源不存在');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '资源不存在'
      });
    });

    it('应该正确处理ConflictError', () => {
      const error = new ConflictError('资源已存在');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '资源已存在'
      });
    });

    it('应该正确处理InternalError', () => {
      const error = new InternalError('数据库连接失败');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据库连接失败'
      });
    });
  });

  describe('Database error handling', () => {
    it('应该处理唯一性约束违反错误(23505)', () => {
      const dbError = new Error('duplicate key value');
      dbError.code = '23505';
      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '该资源已存在，无法重复创建'
      });
    });

    it('应该处理外键约束违反错误(23503)', () => {
      const dbError = new Error('foreign key violation');
      dbError.code = '23503';
      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '关联的资源不存在'
      });
    });

    it('应该处理非空约束违反错误(23502)', () => {
      const dbError = new Error('not null violation');
      dbError.code = '23502';
      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '必需字段缺失'
      });
    });

    it('应该处理检查约束违反错误(23514)', () => {
      const dbError = new Error('check violation');
      dbError.code = '23514';
      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据不符合验证规则'
      });
    });

    it('应该处理未知数据库错误', () => {
      const dbError = new Error('unknown database error');
      dbError.code = '23999';
      errorHandler(dbError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据库操作失败'
      });
    });
  });

  describe('Generic error handling', () => {
    it('应该处理普通JavaScript错误', () => {
      const error = new Error('普通错误');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '普通错误'
      });
    });

    it('应该处理没有message的错误', () => {
      const error = new Error();
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误'
      });
    });

    it('应该处理null错误对象', () => {
      const error = { message: '自定义错误' };
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '自定义错误'
      });
    });
  });

  describe('Development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('应该在开发环境包含详细错误信息', () => {
      const error = new ValidationError('验证错误');
      error.stack = 'Error stack trace';
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '验证错误',
        error: 'ValidationError',
        stack: 'Error stack trace'
      });
    });

    it('应该记录所有错误的详细信息', () => {
      const error = new ValidationError('验证错误');
      errorHandler(error, req, res, next);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '错误详情:',
        expect.objectContaining({
          name: 'ValidationError',
          message: '验证错误',
          statusCode: 400,
          url: '/api/test',
          method: 'POST',
          body: { test: 'data' },
          params: { id: '123' },
          query: { page: '1' }
        })
      );
    });

    it('应该在500错误时显示实际错误信息', () => {
      const error = new InternalError('数据库连接失败');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '数据库连接失败',
        error: 'InternalError',
        stack: expect.any(String)
      });
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('应该不包含详细错误信息', () => {
      const error = new ValidationError('验证错误');
      error.stack = 'Error stack trace';
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '验证错误'
      });
      expect(res.json).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.anything(),
          stack: expect.anything()
        })
      );
    });

    it('应该隐藏500错误的详细信息', () => {
      const error = new InternalError('数据库连接失败');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误，请稍后重试'
      });
    });

    it('应该显示400级错误的实际信息', () => {
      const error = new ValidationError('邮箱格式错误');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '邮箱格式错误'
      });
    });

    it('应该只记录500级错误', () => {
      const error400 = new ValidationError('验证错误');
      errorHandler(error400, req, res, next);
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockClear();

      const error500 = new InternalError('内部错误');
      errorHandler(error500, req, res, next);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '服务器错误:',
        expect.objectContaining({
          message: '内部错误',
          url: '/api/test',
          method: 'POST'
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('应该处理没有statusCode的AppError', () => {
      const error = new AppError('测试错误');
      delete error.statusCode;
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('应该处理空字符串message', () => {
      const error = new AppError('');
      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误'
      });
    });

    it('应该处理非标准错误对象', () => {
      const error = { notAnError: true };
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '服务器内部错误'
      });
    });

    it('应该处理缺少req属性的情况', () => {
      const error = new ValidationError('测试');
      const minimalReq = { originalUrl: '/test', method: 'GET' };
      errorHandler(error, minimalReq, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
  });
});

describe('Error Middleware - asyncHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  it('应该正确处理成功的异步函数', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const handler = asyncHandler(asyncFn);

    await handler(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('应该捕获异步函数抛出的错误', async () => {
    const error = new Error('异步错误');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(asyncFn);

    await handler(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('应该捕获AppError类型的错误', async () => {
    const error = new ValidationError('验证失败');
    const asyncFn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(asyncFn);

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('应该支持同步返回Promise的函数', async () => {
    const asyncFn = () => Promise.resolve('success');
    const handler = asyncHandler(asyncFn);

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('应该支持async/await语法', async () => {
    const asyncFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'success';
    };
    const handler = asyncHandler(asyncFn);

    await handler(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it('应该正确传递多个参数', async () => {
    const asyncFn = jest.fn().mockResolvedValue('success');
    const handler = asyncHandler(asyncFn);

    await handler(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
  });
});

describe('Error Middleware - notFoundHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/api/nonexistent'
    };
    res = {};
    next = jest.fn();
  });

  it('应该创建NotFoundError并传递给next', () => {
    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '无法找到路径: /api/nonexistent',
        statusCode: 404,
        name: 'NotFoundError'
      })
    );
  });

  it('应该包含请求的URL路径', () => {
    req.originalUrl = '/api/users/123/profile';
    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '无法找到路径: /api/users/123/profile'
      })
    );
  });

  it('应该处理根路径', () => {
    req.originalUrl = '/';
    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '无法找到路径: /'
      })
    );
  });

  it('应该创建NotFoundError实例', () => {
    notFoundHandler(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(AppError);
  });
});
