/**
 * JWT认证中间件
 * 提供JWT token验证和用户身份认证功能
 *
 * 中间件功能:
 * - authenticate: 必需的JWT认证，失败则返回401
 * - optionalAuth: 可选的JWT认证，失败也不阻止请求继续
 */

const authService = require('../services/authService');

/**
 * JWT认证中间件（必需认证）
 * 从Authorization请求头中提取Bearer token并验证
 *
 * 使用方式:
 * router.get('/protected', authenticate, (req, res) => {
 *   // req.user 包含解码后的用户信息
 *   console.log(req.user.userId, req.user.email);
 * });
 *
 * 请求头格式:
 * Authorization: Bearer <jwt_token>
 *
 * 成功时:
 * - 将解码的用户信息附加到 req.user
 * - req.user 包含: { userId, email, iat, exp }
 *
 * 失败时:
 * - 返回401状态码和错误信息
 *
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
function authenticate(req, res, next) {
  try {
    // 1. 获取Authorization请求头
    const authHeader = req.headers.authorization;

    // 2. 检查是否提供了Authorization头
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌，请先登录'
      });
    }

    // 3. 检查Authorization头格式是否为 "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: '认证令牌格式错误，应为: Bearer <token>'
      });
    }

    const token = parts[1];

    // 4. 检查token是否为空
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: '认证令牌不能为空'
      });
    }

    // 5. 使用authService验证token
    const decoded = authService.verifyToken(token);

    // 6. 将解码后的用户信息附加到请求对象
    req.user = decoded;

    // 7. 继续下一个中间件或路由处理器
    next();
  } catch (error) {
    // 处理token验证错误
    // authService.verifyToken会抛出以下错误:
    // - 'Token已过期'
    // - 'Token无效'
    // - 'Token验证失败'

    return res.status(401).json({
      success: false,
      message: error.message || '认证失败'
    });
  }
}

/**
 * 可选JWT认证中间件
 * 尝试验证token，但即使失败也不阻止请求继续
 *
 * 使用场景:
 * - 需要根据用户是否登录展示不同内容的接口
 * - 既支持游客访问也支持登录用户访问的接口
 *
 * 使用方式:
 * router.get('/posts', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // 用户已登录，可以访问 req.user
 *   } else {
 *     // 用户未登录或token无效
 *   }
 * });
 *
 * 成功时:
 * - 将解码的用户信息附加到 req.user
 *
 * 失败时:
 * - req.user 为 undefined
 * - 请求继续处理，不返回错误响应
 *
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
function optionalAuth(req, res, next) {
  try {
    // 1. 获取Authorization请求头
    const authHeader = req.headers.authorization;

    // 2. 如果没有提供Authorization头，直接继续
    if (!authHeader) {
      return next();
    }

    // 3. 检查Authorization头格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // 格式错误，但不阻止请求继续
      return next();
    }

    const token = parts[1];

    // 4. 检查token是否为空
    if (!token || token.trim() === '') {
      return next();
    }

    // 5. 尝试验证token
    const decoded = authService.verifyToken(token);

    // 6. 验证成功，附加用户信息
    req.user = decoded;

    // 7. 继续下一个中间件或路由处理器
    next();
  } catch (_error) {
    // token验证失败，但不阻止请求继续
    // req.user 保持为 undefined
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth
};
