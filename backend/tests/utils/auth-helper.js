/**
 * 契约测试认证辅助工具
 *
 * 提供契约测试中常用的认证相关辅助函数
 * 包括创建测试用户、登录、获取token等
 */

const { generateTestToken, generateTestUser, generateMultipleTestUsers } = require('./token-generator');
const { User } = require('../../src/models');

/**
 * 在数据库中创建测试用户并返回token
 *
 * @param {Object} userData - 用户数据
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码（明文）
 * @returns {Promise<Object>} 包含user对象和token
 *
 * @example
 * const { user, token } = await createAuthenticatedUser({
 *   email: 'test@example.com',
 *   password: 'password123'
 * });
 */
async function createAuthenticatedUser(userData = {}) {
  const bcrypt = require('bcrypt');

  const email = userData.email || `test-${Date.now()}@example.com`;
  const password = userData.password || 'password123';

  // 创建用户（如果不存在）
  let user = await User.findOne({ where: { email } });

  if (!user) {
    const password_hash = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      password_hash
    });
  }

  // 生成token
  const token = generateTestToken({
    userId: user.id,
    email: user.email
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token,
    password // 返回明文密码以供测试使用
  };
}

/**
 * 创建多个已认证的测试用户
 *
 * @param {number} count - 用户数量
 * @returns {Promise<Array<Object>>} 用户数组
 *
 * @example
 * const users = await createMultipleAuthenticatedUsers(3);
 * // [{ user, token, password }, ...]
 */
async function createMultipleAuthenticatedUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const authUser = await createAuthenticatedUser({
      email: `test-user-${i}-${Date.now()}@example.com`
    });
    users.push(authUser);
  }
  return users;
}

/**
 * 清理测试用户（用于测试后清理）
 *
 * @param {Array<string>} userIds - 要删除的用户ID数组
 * @returns {Promise<number>} 删除的用户数量
 */
async function cleanupTestUsers(userIds) {
  if (!userIds || userIds.length === 0) {
    return 0;
  }

  const deletedCount = await User.destroy({
    where: {
      id: userIds
    }
  });

  return deletedCount;
}

/**
 * 清理所有测试邮箱的用户（email包含'test-'或'@example.com'）
 *
 * ⚠️  谨慎使用：仅在测试环境使用
 *
 * @returns {Promise<number>} 删除的用户数量
 */
async function cleanupAllTestUsers() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanupAllTestUsers只能在测试环境使用');
  }

  const deletedCount = await User.destroy({
    where: {
      email: {
        [require('sequelize').Op.or]: [
          { [require('sequelize').Op.like]: '%test-%' },
          { [require('sequelize').Op.like]: '%@example.com%' }
        ]
      }
    }
  });

  return deletedCount;
}

/**
 * 为现有用户生成token（不创建新用户）
 *
 * @param {string} userId - 用户ID
 * @param {string} email - 用户邮箱
 * @returns {string} Bearer token
 */
function getTokenForUser(userId, email) {
  return generateTestToken({ userId, email });
}

/**
 * 生成快速测试token（不需要数据库）
 *
 * 适用于不需要实际用户数据的契约测试
 *
 * @param {Object} customData - 自定义数据
 * @returns {Object} { user, token }
 */
function generateQuickTestAuth(customData = {}) {
  return generateTestUser(customData);
}

/**
 * 批量生成快速测试用户（不创建数据库记录）
 *
 * @param {number} count - 数量
 * @returns {Array<Object>} 用户数组
 */
function generateQuickTestUsers(count) {
  return generateMultipleTestUsers(count);
}

module.exports = {
  createAuthenticatedUser,
  createMultipleAuthenticatedUsers,
  cleanupTestUsers,
  cleanupAllTestUsers,
  getTokenForUser,
  generateQuickTestAuth,
  generateQuickTestUsers
};
