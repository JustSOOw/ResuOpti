# ResuOpti API 文档说明

## 概述

ResuOpti 提供完整的 RESTful API 文档，基于 OpenAPI 3.0 规范，通过 Swagger UI 提供交互式文档界面。

## 访问 API 文档

### Swagger UI 交互式文档

启动服务器后，访问以下 URL 查看交互式 API 文档：

```
http://localhost:3000/api-docs
```

Swagger UI 提供：
- 📖 完整的 API 端点列表
- 🔍 请求/响应模型详情
- 🧪 在线测试功能（Try it out）
- 🔐 JWT 认证支持
- 📝 请求示例和响应示例

### OpenAPI 规范文件

#### YAML 格式（源文件）
```
/mnt/d/Users/JUSTsoo/Documents/aprojectCODE/ResuOpti/specs/001-/contracts/api-spec.yaml
```

#### JSON 格式（运行时访问）
```
http://localhost:3000/api-docs.json
```

## 使用 Swagger UI

### 1. 浏览 API 端点

- 访问 `/api-docs` 页面
- 点击各个端点展开查看详细信息
- 查看请求参数、响应格式、状态码等

### 2. 在线测试 API

#### 无需认证的端点（如注册、登录）：

1. 点击端点展开
2. 点击 "Try it out" 按钮
3. 填写请求参数
4. 点击 "Execute" 执行请求
5. 查看响应结果

#### 需要认证的端点：

1. 先调用 `/auth/login` 获取 JWT token
2. 复制响应中的 `token` 值
3. 点击页面顶部的 "Authorize" 按钮
4. 在弹出框中输入：`Bearer <你的token>`
5. 点击 "Authorize" 确认
6. 现在可以测试需要认证的端点了

### 3. 查看数据模型

- 滚动到页面底部 "Schemas" 部分
- 查看所有数据模型的详细定义
- 了解各个字段的类型、格式和约束

## API 端点概览

### 认证相关 (Authentication)
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

### 目标岗位管理 (Target Positions)
- `GET /api/v1/target-positions` - 获取岗位列表
- `POST /api/v1/target-positions` - 创建新岗位
- `GET /api/v1/target-positions/{id}` - 获取岗位详情
- `PUT /api/v1/target-positions/{id}` - 更新岗位信息
- `DELETE /api/v1/target-positions/{id}` - 删除岗位

### 简历版本管理 (Resume Versions)
- `POST /api/v1/resumes` - 创建在线简历
- `POST /api/v1/resumes/upload` - 上传简历文件

## 认证机制

API 使用 JWT (JSON Web Token) 进行身份验证：

1. 调用 `/auth/login` 接口获取 token
2. 在后续请求的 Header 中添加：
   ```
   Authorization: Bearer <your_token_here>
   ```
3. Token 有效期根据配置而定
4. Token 失效后需要重新登录

## 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": {
      // 详细错误信息
    }
  }
}
```

## HTTP 状态码

- `200` - 请求成功
- `201` - 资源创建成功
- `400` - 请求参数错误
- `401` - 未授权（需要登录或 token 无效）
- `404` - 资源不存在
- `409` - 资源冲突（如邮箱已存在）
- `500` - 服务器内部错误

## 文件上传规范

### 支持的文件格式
- PDF (.pdf)
- Word (.doc, .docx)

### 文件大小限制
- 最大 10MB

### 上传方式
- 使用 `multipart/form-data` 格式
- 参见 `/resumes/upload` 端点文档

## 开发环境配置

### 环境变量

在 `.env` 文件中配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# CORS配置
CORS_ORIGIN=http://localhost:5173
```

### 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 访问文档

服务器启动后会显示文档访问地址：

```
🚀 服务器运行在端口 3000
📝 环境: development
🔗 健康检查: http://localhost:3000/health
📚 API文档: http://localhost:3000/api-docs
📄 OpenAPI规范: http://localhost:3000/api-docs.json
```

## 文档维护

### 更新 API 文档

1. 编辑源文件：
   ```
   /specs/001-/contracts/api-spec.yaml
   ```

2. 重启服务器：
   ```bash
   npm run dev
   ```

3. 刷新浏览器查看更新后的文档

### OpenAPI 规范参考

- [OpenAPI 3.0 规范](https://spec.openapis.org/oas/v3.0.3)
- [Swagger UI 文档](https://swagger.io/tools/swagger-ui/)

## 常见问题

### Q: 如何在 Swagger UI 中测试需要认证的接口？

A:
1. 先使用 `/auth/login` 接口获取 token
2. 点击页面顶部的 "Authorize" 绿色按钮
3. 输入 `Bearer <token>`（注意 Bearer 后面有空格）
4. 点击 "Authorize" 保存
5. 现在可以测试受保护的接口了

### Q: 如何测试文件上传接口？

A:
1. 在 Swagger UI 中找到 `/resumes/upload` 端点
2. 点击 "Try it out"
3. 点击 "Choose File" 选择要上传的文件
4. 填写其他必需参数
5. 点击 "Execute" 执行上传

### Q: 文档更新后为什么没有生效？

A:
1. 确认已保存 `api-spec.yaml` 文件
2. 重启后端服务器
3. 清除浏览器缓存或使用无痕模式访问
4. 检查服务器日志是否有错误信息

## 技术支持

如有问题或建议，请联系开发团队。

## 相关文档

- [API 使用指南](./api-guide.md) - 详细的 API 使用说明
- [项目 README](../../README.md) - 项目整体说明
- [OpenAPI 规范](../../specs/001-/contracts/api-spec.yaml) - API 接口规范源文件