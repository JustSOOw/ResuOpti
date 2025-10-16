/**
 * Swagger/OpenAPI 文档配置
 * 集成现有的 api-spec.yaml 规范文件
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

// 加载现有的 OpenAPI 规范文件
const candidates = [
  path.join(__dirname, '../../../specs/001-/contracts/api-spec.yaml'),
  path.join(process.cwd(), 'specs/001-/contracts/api-spec.yaml')
];

const specPath = candidates.find((file) => {
  try {
    return fs.existsSync(file);
  } catch (_err) {
    return false;
  }
});

if (!specPath) {
  throw new Error('未找到 API 规范文件 specs/001-/contracts/api-spec.yaml，请确认路径挂载');
}

const swaggerDocument = YAML.load(specPath);

// Swagger UI 自定义配置选项
const swaggerOptions = {
  // 自定义样式
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  `,

  // 自定义站点标题
  customSiteTitle: 'ResuOpti API 文档',

  // 自定义 favicon（可选）
  customfavIcon: '/favicon.ico',

  // Swagger UI 配置
  swaggerOptions: {
    // 持久化授权数据
    persistAuthorization: true,

    // 显示请求持续时间
    displayRequestDuration: true,

    // 默认展开深度
    docExpansion: 'list',

    // 过滤器
    filter: true,

    // 显示扩展
    showExtensions: true,

    // 显示通用扩展
    showCommonExtensions: true,

    // 尝试功能默认启用
    tryItOutEnabled: true
  }
};

module.exports = {
  swaggerUi,
  swaggerDocument,
  swaggerOptions
};
