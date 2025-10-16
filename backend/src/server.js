/**
 * 服务器启动文件
 */

const app = require('./app');
const { sequelize, testConnection } = require('./config');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }

    const shouldSync = process.env.DB_AUTO_SYNC !== 'false';
    if (shouldSync) {
      const syncOptions = {};
      if (process.env.DB_SYNC_FORCE === 'true') {
        syncOptions.force = true;
      } else if (process.env.DB_SYNC_ALTER === 'true') {
        syncOptions.alter = true;
      }

      await sequelize.sync(syncOptions);
      console.log('✅ 数据库结构同步完成');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 服务器运行在端口 ${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
      console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
      console.log(`📄 OpenAPI规范: http://localhost:${PORT}/api-docs.json\n`);
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error.message);
    process.exit(1);
  }
};

start();
