/**
 * 主应用程序配置文件
 * 配置Express应用和中间件
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// 导入中间件
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error');

// 导入API路由
const authRoutes = require('./api/auth');
const positionRoutes = require('./api/positions');
const resumeRoutes = require('./api/resumes');
const uploadRoutes = require('./api/upload');

// 导入 Swagger 配置
const { swaggerUi, swaggerDocument, swaggerOptions } = require('./config/swagger');

const app = express();

// ==================== 安全和基础中间件 ====================

// 安全中间件
app.use(helmet());

// CORS配置
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  })
);

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 静态文件服务 - 提供上传文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== 健康检查端点 ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== API 文档 ====================

// Swagger API 文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// API 文档说明页面
app.get('/docs', (req, res) => {
  res.json({
    message: 'ResuOpti API 文档服务',
    documentation: {
      swagger: {
        url: '/api-docs',
        description: 'Swagger UI 交互式 API 文档'
      },
      openapi: {
        url: '/api-docs.json',
        description: 'OpenAPI 规范 JSON 格式'
      }
    },
    note: '访问 /api-docs 查看完整的 API 文档和在线测试功能'
  });
});

// 提供 OpenAPI 规范的 JSON 格式访问
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerDocument);
});

// ==================== API路由配置 ====================

// API根路径信息
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'ResuOpti API',
    version: '1.0.0',
    description: '个人简历管理平台 API',
    endpoints: {
      auth: '/api/v1/auth',
      targetPositions: '/api/v1/target-positions',
      resumes: '/api/v1/resumes',
      upload: '/api/v1/resumes/upload'
    }
  });
});

// 认证相关路由 (无需JWT认证)
app.use('/api/v1/auth', authRoutes);

// 文件上传路由 (需要JWT认证) - 必须在 /resumes 之前注册
app.use('/api/v1/resumes/upload', authenticate);
app.use('/api/v1/resumes/upload', uploadRoutes);

// 目标岗位路由 (需要JWT认证)
app.use('/api/v1/target-positions', authenticate);
app.use('/api/v1/target-positions', positionRoutes);

// 简历版本路由 (需要JWT认证)
app.use('/api/v1/resumes', authenticate);
app.use('/api/v1/resumes', resumeRoutes);

// ==================== 404处理 ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.path,
    method: req.method
  });
});

// ==================== 全局错误处理中间件 ====================

app.use(errorHandler);

module.exports = app;
