/**
 * 种子数据执行脚本
 * 按顺序运行所有seeder，填充演示数据
 */

const { sequelize } = require('../config');

// 导入所有seeder
const demoUser = require('./01-demo-user');
const demoPositions = require('./02-demo-positions');
const demoResumes = require('./03-demo-resumes');
const demoApplications = require('./04-demo-applications');

/**
 * 执行所有种子数据
 */
async function runAllSeeders() {
  console.log('🌱 开始执行种子数据...\n');

  try {
    // 确保数据库连接正常
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 1. 创建演示用户
    console.log('📝 步骤 1/4: 创建演示用户');
    await demoUser.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('');

    // 2. 创建目标岗位
    console.log('📝 步骤 2/4: 创建目标岗位');
    await demoPositions.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('');

    // 3. 创建简历版本
    console.log('📝 步骤 3/4: 创建简历版本');
    await demoResumes.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('');

    // 4. 创建投递记录
    console.log('📝 步骤 4/4: 创建投递记录');
    await demoApplications.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('');

    console.log('🎉 所有种子数据执行完成！\n');
    console.log('═══════════════════════════════════════');
    console.log('  📋 演示账号信息');
    console.log('═══════════════════════════════════════');
    console.log('  邮箱: demo@resumopti.com');
    console.log('  密码: Demo1234');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 种子数据执行失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

/**
 * 回滚所有种子数据
 */
async function rollbackAllSeeders() {
  console.log('🔄 开始回滚种子数据...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 按相反顺序回滚
    console.log('📝 回滚投递记录');
    await demoApplications.down(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('📝 回滚简历版本');
    await demoResumes.down(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('📝 回滚目标岗位');
    await demoPositions.down(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('📝 回滚演示用户');
    await demoUser.down(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('\n✅ 所有种子数据已回滚\n');

  } catch (error) {
    console.error('❌ 回滚失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 命令行参数处理
const command = process.argv[2];

if (command === 'rollback' || command === 'down') {
  rollbackAllSeeders();
} else {
  runAllSeeders();
}

module.exports = {
  runAllSeeders,
  rollbackAllSeeders
};