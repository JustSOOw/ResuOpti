/**
 * 演示用户种子数据
 * 创建一个测试用户账号，用于开发和测试环境
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  /**
   * 创建演示用户
   * 邮箱: demo@resumopti.com
   * 密码: Demo1234
   */
  up: async (queryInterface, Sequelize) => {
    // 生成密码哈希
    const passwordHash = await bcrypt.hash('Demo1234', 10);
    const userId = uuidv4();
    const now = new Date();

    // 插入用户数据
    await queryInterface.bulkInsert('users', [
      {
        id: userId,
        email: 'demo@resumopti.com',
        password_hash: passwordHash,
        created_at: now,
        updated_at: now
      }
    ], {});

    console.log('✅ 演示用户创建成功');
    console.log('📧 邮箱: demo@resumopti.com');
    console.log('🔑 密码: Demo1234');
  },

  /**
   * 回滚操作：删除演示用户
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'demo@resumopti.com'
    }, {});

    console.log('🗑️  演示用户已删除');
  }
};