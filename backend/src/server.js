/**
 * 服务器启动文件
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在端口 ${PORT}`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI规范: http://localhost:${PORT}/api-docs.json\n`);
});
