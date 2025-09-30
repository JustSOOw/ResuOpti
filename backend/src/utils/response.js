/**
 * API响应格式化工具
 * 提供统一的API响应格式化函数，确保所有API返回一致的响应结构
 *
 * 功能:
 * - 成功响应格式化 (200, 201)
 * - 错误响应格式化 (4xx, 5xx)
 * - 分页响应格式化
 * - 无内容响应 (204)
 * - 支持链式调用
 * - 可选：将工具注入到res对象
 */

/**
 * 发送成功响应
 *
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据，可以是任意类型
 * @param {string} [message='操作成功'] - 成功消息
 * @param {number} [statusCode=200] - HTTP状态码
 * @returns {Object} Express响应对象（支持链式调用）
 *
 * @example
 * success(res, { userId: '123' }, '用户创建成功', 201);
 *
 * 响应格式:
 * {
 *   success: true,
 *   message: "操作成功",
 *   data: { ... }
 * }
 */
function success(res, data = null, message = '操作成功', statusCode = 200) {
  const response = {
    success: true,
    message
  };

  // 只有当data不为null/undefined时才添加data字段
  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * 发送错误响应
 *
 * @param {Object} res - Express响应对象
 * @param {string} [message='操作失败'] - 错误消息
 * @param {number} [statusCode=400] - HTTP状态码
 * @param {*} [error=undefined] - 可选的错误详情（仅在开发环境返回）
 * @returns {Object} Express响应对象（支持链式调用）
 *
 * @example
 * error(res, '用户不存在', 404);
 * error(res, '服务器错误', 500, err.message);
 *
 * 响应格式:
 * {
 *   success: false,
 *   message: "错误信息",
 *   error: "详细错误" // 仅在开发环境
 * }
 */
function error(res, message = '操作失败', statusCode = 400, error = undefined) {
  const response = {
    success: false,
    message
  };

  // 仅在开发环境且提供了error时才添加error字段
  if (error !== undefined && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
}

/**
 * 发送分页响应
 *
 * @param {Object} res - Express响应对象
 * @param {Array} items - 数据项数组
 * @param {number} page - 当前页码（从1开始）
 * @param {number} pageSize - 每页数量
 * @param {number} total - 总记录数
 * @param {string} [message='查询成功'] - 成功消息
 * @param {number} [statusCode=200] - HTTP状态码
 * @returns {Object} Express响应对象（支持链式调用）
 *
 * @example
 * paginate(res, users, 1, 20, 100, '用户列表查询成功');
 *
 * 响应格式:
 * {
 *   success: true,
 *   message: "查询成功",
 *   data: {
 *     items: [...],
 *     pagination: {
 *       page: 1,
 *       pageSize: 20,
 *       total: 100,
 *       totalPages: 5
 *     }
 *   }
 * }
 */
function paginate(res, items, page, pageSize, total, message = '查询成功', statusCode = 200) {
  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

  const response = {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: Number(total),
        totalPages
      }
    }
  };

  return res.status(statusCode).json(response);
}

/**
 * 发送创建成功响应 (201 Created)
 *
 * @param {Object} res - Express响应对象
 * @param {*} data - 创建的资源数据
 * @param {string} [message='创建成功'] - 成功消息
 * @returns {Object} Express响应对象（支持链式调用）
 *
 * @example
 * created(res, { id: '123', name: '新资源' }, '资源创建成功');
 *
 * 响应格式:
 * {
 *   success: true,
 *   message: "创建成功",
 *   data: { ... }
 * }
 */
function created(res, data, message = '创建成功') {
  return success(res, data, message, 201);
}

/**
 * 发送无内容响应 (204 No Content)
 * 用于删除成功或更新成功但不需要返回数据的场景
 *
 * @param {Object} res - Express响应对象
 * @returns {Object} Express响应对象（支持链式调用）
 *
 * @example
 * noContent(res);
 *
 * 响应: 204 No Content (无响应体)
 */
function noContent(res) {
  return res.status(204).send();
}

/**
 * Express中间件：将响应格式化函数注入到res对象
 * 使用此中间件后，可以直接调用 res.success(), res.error() 等方法
 *
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 *
 * @example
 * // 在app.js中注册中间件
 * app.use(injectResponseMethods);
 *
 * // 在路由处理器中使用
 * router.get('/users', (req, res) => {
 *   const users = getUsersFromDB();
 *   return res.success(users, '用户列表获取成功');
 * });
 *
 * router.post('/users', (req, res) => {
 *   try {
 *     const user = createUser(req.body);
 *     return res.created(user, '用户创建成功');
 *   } catch (err) {
 *     return res.error('创建失败', 400, err.message);
 *   }
 * });
 */
function injectResponseMethods(req, res, next) {
  // 将所有响应格式化函数绑定到res对象
  res.success = (data, message, statusCode) => success(res, data, message, statusCode);
  res.error = (message, statusCode, error) => error(res, message, statusCode, error);
  res.paginate = (items, page, pageSize, total, message, statusCode) =>
    paginate(res, items, page, pageSize, total, message, statusCode);
  res.created = (data, message) => created(res, data, message);
  res.noContent = () => noContent(res);

  next();
}

// 导出所有函数
module.exports = {
  success,
  error,
  paginate,
  created,
  noContent,
  injectResponseMethods
};