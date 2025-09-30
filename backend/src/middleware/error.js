/**
 * 统一错误处理中间件
 * 提供自定义错误类和全局错误处理功能
 */

/**
 * 基础应用错误类
 * 所有自定义错误的父类
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // 标记为可操作的错误（业务错误）
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误类 - 400
 * 用于请求参数验证失败
 */
class ValidationError extends AppError {
  constructor(message = '请求参数验证失败') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * 认证错误类 - 401
 * 用于用户认证失败（未登录或token无效）
 */
class AuthenticationError extends AppError {
  constructor(message = '认证失败，请重新登录') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权错误类 - 403
 * 用于用户权限不足
 */
class AuthorizationError extends AppError {
  constructor(message = '权限不足，无法访问该资源') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源不存在错误类 - 404
 * 用于请求的资源不存在
 */
class NotFoundError extends AppError {
  constructor(message = '请求的资源不存在') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 资源冲突错误类 - 409
 * 用于资源冲突（如邮箱已存在、重复提交等）
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突，操作无法完成') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 内部服务器错误类 - 500
 * 用于服务器内部错误
 */
class InternalError extends AppError {
  constructor(message = '服务器内部错误，请稍后重试') {
    super(message, 500);
    this.name = 'InternalError';
  }
}

/**
 * 处理数据库错误
 * 将数据库特定错误转换为应用错误
 *
 * @param {Error} error - 数据库错误对象
 * @returns {AppError} - 转换后的应用错误
 */
const handleDatabaseError = (error) => {
  // PostgreSQL唯一性约束违反 (unique_violation)
  if (error.code === '23505') {
    return new ConflictError('该资源已存在，无法重复创建');
  }

  // PostgreSQL外键约束违反 (foreign_key_violation)
  if (error.code === '23503') {
    return new ValidationError('关联的资源不存在');
  }

  // PostgreSQL非空约束违反 (not_null_violation)
  if (error.code === '23502') {
    return new ValidationError('必需字段缺失');
  }

  // PostgreSQL检查约束违反 (check_violation)
  if (error.code === '23514') {
    return new ValidationError('数据不符合验证规则');
  }

  // 默认返回内部错误
  return new InternalError('数据库操作失败');
};

/**
 * 全局错误处理中间件
 * 统一处理所有未捕获的错误，并返回标准化的错误响应
 *
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // 如果不是自定义的AppError，进行转换
  if (!(error instanceof AppError)) {
    // 处理数据库错误
    if (error.code && error.code.startsWith('23')) {
      error = handleDatabaseError(error);
    }
    // 处理其他未知错误
    else {
      error = new InternalError(error.message || '服务器内部错误');
    }
  }

  // 记录错误日志
  // 生产环境只记录非业务错误（500级错误）
  // 开发环境记录所有错误
  if (process.env.NODE_ENV === 'production') {
    if (error.statusCode >= 500) {
      console.error('服务器错误:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }

  // 构建错误响应对象
  const response = {
    success: false,
    message: error.message || '服务器内部错误'
  };

  // 开发环境下添加详细错误信息
  if (process.env.NODE_ENV === 'development') {
    response.error = error.name;
    response.stack = error.stack;
  }

  // 生产环境下，对500错误隐藏详细信息
  if (process.env.NODE_ENV === 'production' && error.statusCode >= 500) {
    response.message = '服务器内部错误，请稍后重试';
  }

  // 返回错误响应
  res.status(error.statusCode || 500).json(response);
};

/**
 * 异步错误捕获包装器
 * 用于包装异步路由处理函数，自动捕获异步错误并传递给错误处理中间件
 *
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function} - 包装后的函数
 *
 * @example
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   res.json({ success: true, data: user });
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404错误处理中间件
 * 处理所有未匹配的路由
 *
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`无法找到路径: ${req.originalUrl}`));
};

// 导出所有错误类和中间件
module.exports = {
  // 错误类
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalError,

  // 中间件
  errorHandler,
  asyncHandler,
  notFoundHandler
};