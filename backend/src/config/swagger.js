/**
 * Swagger/OpenAPI 文档配置
 * 集成现有的 api-spec.yaml 规范文件
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// 加载现有的 OpenAPI 规范文件
const swaggerDocument = YAML.load(
  path.join(__dirname, '../../../specs/001-/contracts/api-spec.yaml')
);

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
