/**
 * 测试环境专用的JWT Token生成工具
 *
 * 用于契约测试和集成测试中生成有效的JWT token
 * 避免hardcode token导致的认证失败问题
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// 从环境变量获取JWT密钥，如果没有则使用默认测试密钥
const JWT_SECRET = process.env.JWT_SECRET || 'resuopti-local-secret';
const JWT_EXPIRES_IN = '1h';

/**
 * 生成测试用的JWT token
 *
 * @param {Object} payload - Token载荷
 * @param {string} payload.userId - 用户ID (UUID)
 * @param {string} payload.email - 用户邮箱
 * @param {Object} options - 可选配置
 * @param {string} options.expiresIn - token过期时间，默认1小时
 * @returns {string} 完整的Bearer token字符串
 *
 * @example
 * const token = generateTestToken({
 *   userId: '123e4567-e89b-12d3-a456-426614174000',
 *   email: 'test@example.com'
 * });
 * // 返回: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
function generateTestToken(payload, options = {}) {
  const { userId, email } = payload;

  if (!userId || !email) {
    throw new Error('generateTestToken: userId and email are required');
  }

  const tokenPayload = {
    userId,
    email,
    // 添加标准JWT字段 - 不手动设置exp，让jwt.sign处理
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: options.expiresIn || JWT_EXPIRES_IN
  });

  return `Bearer ${token}`;
}

/**
 * 生成测试用的用户数据和对应的token
 *
 * @param {Object} customData - 自定义用户数据
 * @returns {Object} 包含用户信息和token的对象
 *
 * @example
 * const { user, token } = generateTestUser();
 * // user: { userId: '...', email: 'test-..@example.com' }
 * // token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
function generateTestUser(customData = {}) {
  const user = {
    userId: customData.userId || uuidv4(),
    email: customData.email || `test-${Date.now()}@example.com`,
    ...customData
  };

  const token = generateTestToken({
    userId: user.userId,
    email: user.email
  });

  return { user, token };
}

/**
 * 生成多个测试用户
 *
 * @param {number} count - 需要生成的用户数量
 * @returns {Array<Object>} 用户数组，每个用户包含user和token
 *
 * @example
 * const users = generateMultipleTestUsers(3);
 * // [{ user: {...}, token: '...' }, { user: {...}, token: '...' }, ...]
 */
function generateMultipleTestUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateTestUser({ email: `test-user-${i}-${Date.now()}@example.com` }));
  }
  return users;
}

/**
 * 生成过期的token（用于测试token过期场景）
 *
 * @param {Object} payload - Token载荷
 * @returns {string} 已过期的Bearer token
 */
function generateExpiredToken(payload) {
  const { userId, email } = payload;

  const tokenPayload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2小时前签发
    exp: Math.floor(Date.now() / 1000) - 3600  // 1小时前过期
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { noTimestamp: true });
  return `Bearer ${token}`;
}

/**
 * 生成无效签名的token（用于测试token验证失败场景）
 *
 * @param {Object} payload - Token载荷
 * @returns {string} 签名无效的Bearer token
 */
function generateInvalidToken(payload) {
  const { userId, email } = payload;

  const tokenPayload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000)
  };

  // 使用错误的密钥签名
  const token = jwt.sign(tokenPayload, 'wrong-secret-key');
  return `Bearer ${token}`;
}

/**
 * 验证token是否有效（用于测试验证）
 *
 * @param {string} token - Bearer token字符串或纯token
 * @returns {Object|null} 解码后的payload，如果无效返回null
 */
function verifyTestToken(token) {
  try {
    // 移除 'Bearer ' 前缀
    const pureToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(pureToken, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 解析过期时间字符串为秒数
 *
 * @param {string} expiresIn - 如 '1h', '30m', '7d'
 * @returns {number} 秒数
 */
function parseExpiry(expiresIn) {
  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

module.exports = {
  generateTestToken,
  generateTestUser,
  generateMultipleTestUsers,
  generateExpiredToken,
  generateInvalidToken,
  verifyTestToken,
  JWT_SECRET
};
