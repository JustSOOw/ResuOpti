/**
 * 数据库同步脚本
 * 用于创建或更新数据库表结构
 * 仅在开发和测试环境使用，生产环境应使用迁移
 */

const { sequelize } = require('../models');

/**
 * 同步数据库
 * @param {Object} options - Sequelize sync选项
 */
async function syncDatabase(options = {}) {
  try {
    console.log('开始同步数据库...');
    console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`数据库: ${sequelize.config.database}`);

    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功');

    // 同步模型到数据库
    const syncOptions = {
      force: process.env.DB_FORCE_SYNC === 'true', // 是否强制重建表（会删除现有数据）
      alter: process.env.DB_ALTER_SYNC === 'true', // 是否修改表结构以匹配模型
      ...options
    };

    if (syncOptions.force) {
      console.warn('⚠ 警告: 启用force模式，将删除所有现有数据！');
    }

    await sequelize.sync(syncOptions);
    console.log('✓ 数据库同步完成');

    // 显示所有表
    const tables = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'', {
      type: sequelize.QueryTypes.SELECT
    });

    if (tables && tables.length > 0) {
      console.log('\n已创建的表:');
      tables.forEach(({ table_name }) => {
        console.log(`  - ${table_name}`);
      });
    }

    await sequelize.close();
    console.log('\n数据库同步成功完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库同步失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncDatabase();
}

module.exports = { syncDatabase };
