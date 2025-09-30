/**
 * 示例目标岗位种子数据
 * 为演示用户创建几个目标岗位分类
 */

const { v4: uuidv4 } = require('uuid');

// 这些ID将在后续seeder中被引用
const positionIds = {
  frontendDev: uuidv4(),
  backendDev: uuidv4(),
  fullstackDev: uuidv4()
};

module.exports = {
  /**
   * 创建示例目标岗位
   */
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 查找演示用户ID
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'demo@resumopti.com' LIMIT 1;`
    );

    if (users.length === 0) {
      console.log('⚠️  警告: 未找到演示用户，请先运行 01-demo-user.js');
      return;
    }

    const userId = users[0].id;

    // 插入目标岗位数据
    await queryInterface.bulkInsert('target_positions', [
      {
        id: positionIds.frontendDev,
        user_id: userId,
        name: '前端开发工程师',
        description: '专注于 Vue.js、React 前端框架，熟悉现代前端工程化',
        created_at: now,
        updated_at: now
      },
      {
        id: positionIds.backendDev,
        user_id: userId,
        name: '后端开发工程师',
        description: '专注于 Node.js、Java 后端开发，熟悉微服务架构',
        created_at: now,
        updated_at: now
      },
      {
        id: positionIds.fullstackDev,
        user_id: userId,
        name: '全栈开发工程师',
        description: '前后端通吃，具备完整的项目开发能力',
        created_at: now,
        updated_at: now
      }
    ], {});

    console.log('✅ 示例目标岗位创建成功');
    console.log('📁 前端开发工程师');
    console.log('📁 后端开发工程师');
    console.log('📁 全栈开发工程师');
  },

  /**
   * 回滚操作：删除示例目标岗位
   */
  down: async (queryInterface, Sequelize) => {
    // 查找演示用户ID
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'demo@resumopti.com' LIMIT 1;`
    );

    if (users.length === 0) {
      return;
    }

    const userId = users[0].id;

    await queryInterface.bulkDelete('target_positions', {
      user_id: userId
    }, {});

    console.log('🗑️  示例目标岗位已删除');
  },

  // 导出岗位ID供其他seeder使用
  positionIds
};