# ResuOpti API 使用指南

## 快速开始

本指南将帮助您快速上手 ResuOpti API，从注册账户到管理简历版本。

## 目录

1. [环境准备](#环境准备)
2. [用户认证](#用户认证)
3. [目标岗位管理](#目标岗位管理)
4. [简历版本管理](#简历版本管理)
5. [完整示例](#完整示例)
6. [错误处理](#错误处理)

## 环境准备

### API 基础 URL

- 本地开发环境：`http://localhost:3000/api/v1`
- 生产环境：`https://resumopti.railway.app/api/v1`

### 必需工具

- HTTP 客户端（Postman、Insomnia、curl 等）
- 或直接使用 Swagger UI：`http://localhost:3000/api-docs`

## 用户认证

### 1. 注册新用户

**端点：** `POST /auth/register`

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhangsan@example.com",
    "password": "password123"
  }'
```

**请求体：**

```json
{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**成功响应（201）：**

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "zhangsan@example.com"
  }
}
```

**注意事项：**
- 邮箱必须是有效格式
- 密码至少 8 位，包含字母和数字
- 邮箱不能重复注册

### 2. 用户登录

**端点：** `POST /auth/login`

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhangsan@example.com",
    "password": "password123"
  }'
```

**成功响应（200）：**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "zhangsan@example.com",
      "createdAt": "2025-09-30T10:00:00Z"
    }
  }
}
```

**重要：** 保存返回的 `token`，后续所有需要认证的请求都需要使用它。

### 3. 使用 Token 进行认证

在所有需要认证的请求中，添加以下 HTTP Header：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**示例：**

```bash
curl -X GET http://localhost:3000/api/v1/target-positions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 目标岗位管理

目标岗位是简历的分类标签，用于管理不同职位方向的简历版本。

### 1. 创建目标岗位

**端点：** `POST /target-positions`

**需要认证：** ✅

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/v1/target-positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "前端开发工程师",
    "description": "专注于 React 和 Vue 技术栈的前端开发职位"
  }'
```

**成功响应（201）：**

```json
{
  "success": true,
  "message": "目标岗位创建成功",
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "前端开发工程师",
    "description": "专注于 React 和 Vue 技术栈的前端开发职位",
    "createdAt": "2025-09-30T10:05:00Z",
    "updatedAt": "2025-09-30T10:05:00Z"
  }
}
```

### 2. 获取所有目标岗位

**端点：** `GET /target-positions`

**需要认证：** ✅

**请求示例：**

```bash
curl -X GET http://localhost:3000/api/v1/target-positions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**成功响应（200）：**

```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "name": "前端开发工程师",
      "description": "专注于 React 和 Vue 技术栈的前端开发职位",
      "createdAt": "2025-09-30T10:05:00Z",
      "updatedAt": "2025-09-30T10:05:00Z"
    }
  ]
}
```

### 3. 获取指定岗位详情（包含简历列表）

**端点：** `GET /target-positions/{id}`

**需要认证：** ✅

**请求示例：**

```bash
curl -X GET http://localhost:3000/api/v1/target-positions/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "name": "前端开发工程师",
    "description": "专注于 React 和 Vue 技术栈的前端开发职位",
    "resumes": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "type": "online",
        "title": "腾讯前端开发岗位简历",
        "fileName": null,
        "createdAt": "2025-09-30T10:10:00Z",
        "applicationCount": 2
      }
    ]
  }
}
```

### 4. 更新目标岗位

**端点：** `PUT /target-positions/{id}`

**需要认证：** ✅

**请求示例：**

```bash
curl -X PUT http://localhost:3000/api/v1/target-positions/456e7890-e89b-12d3-a456-426614174001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "高级前端开发工程师",
    "description": "更新后的职位描述"
  }'
```

### 5. 删除目标岗位

**端点：** `DELETE /target-positions/{id}`

**需要认证：** ✅

**注意：** 只能删除没有关联简历的岗位

**请求示例：**

```bash
curl -X DELETE http://localhost:3000/api/v1/target-positions/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 简历版本管理

### 1. 创建在线简历

**端点：** `POST /resumes`

**需要认证：** ✅

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/v1/resumes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "targetPositionId": "456e7890-e89b-12d3-a456-426614174001",
    "type": "online",
    "title": "腾讯前端开发岗位简历",
    "content": "<h1>个人信息</h1><p>姓名：张三</p><p>联系方式：123456789</p>"
  }'
```

**成功响应（201）：**

```json
{
  "success": true,
  "message": "简历版本创建成功",
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174002",
    "targetPositionId": "456e7890-e89b-12d3-a456-426614174001",
    "type": "online",
    "title": "腾讯前端开发岗位简历",
    "content": "<h1>个人信息</h1><p>姓名：张三</p><p>联系方式：123456789</p>",
    "filePath": null,
    "fileName": null,
    "fileSize": null,
    "createdAt": "2025-09-30T10:15:00Z",
    "updatedAt": "2025-09-30T10:15:00Z"
  }
}
```

### 2. 上传简历文件

**端点：** `POST /resumes/upload`

**需要认证：** ✅

**Content-Type：** `multipart/form-data`

**请求示例（使用 curl）：**

```bash
curl -X POST http://localhost:3000/api/v1/resumes/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/resume.pdf" \
  -F "targetPositionId=456e7890-e89b-12d3-a456-426614174001" \
  -F "title=阿里巴巴前端开发简历"
```

**表单字段：**

- `file`: 文件（PDF 或 Word，最大 10MB）
- `targetPositionId`: 所属目标岗位 ID
- `title`: 简历标题

**成功响应（201）：**

```json
{
  "success": true,
  "message": "简历文件上传成功",
  "data": {
    "id": "890e1234-e89b-12d3-a456-426614174003",
    "targetPositionId": "456e7890-e89b-12d3-a456-426614174001",
    "type": "file",
    "title": "阿里巴巴前端开发简历",
    "filePath": "/uploads/user123/position456/resume.pdf",
    "fileName": "resume.pdf",
    "fileSize": 2048576,
    "content": null,
    "createdAt": "2025-09-30T10:20:00Z",
    "updatedAt": "2025-09-30T10:20:00Z"
  }
}
```

## 完整示例

### 从注册到创建简历的完整流程

```bash
#!/bin/bash

# 1. 注册用户
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123"
  }')

echo "注册响应: $REGISTER_RESPONSE"

# 2. 登录获取 token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token: $TOKEN"

# 3. 创建目标岗位
POSITION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/target-positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "后端开发工程师",
    "description": "专注于 Node.js 和 Python 的后端开发职位"
  }')

POSITION_ID=$(echo $POSITION_RESPONSE | jq -r '.data.id')
echo "岗位ID: $POSITION_ID"

# 4. 创建在线简历
RESUME_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/resumes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"targetPositionId\": \"$POSITION_ID\",
    \"type\": \"online\",
    \"title\": \"字节跳动后端开发简历\",
    \"content\": \"<h1>张三</h1><p>5年后端开发经验</p>\"
  }")

echo "简历创建响应: $RESUME_RESPONSE"
```

## 错误处理

### 常见错误码

#### 400 Bad Request - 请求参数错误

```json
{
  "success": false,
  "message": "请求参数错误",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "邮箱格式不正确",
      "password": "密码至少8位"
    }
  }
}
```

#### 401 Unauthorized - 未授权

```json
{
  "success": false,
  "message": "未授权访问",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

**解决方案：**
- 检查是否已登录
- 检查 Token 是否正确
- 检查 Token 是否过期

#### 404 Not Found - 资源不存在

```json
{
  "success": false,
  "message": "资源不存在",
  "error": {
    "code": "NOT_FOUND"
  }
}
```

#### 409 Conflict - 资源冲突

```json
{
  "success": false,
  "message": "邮箱已被注册",
  "error": {
    "code": "CONFLICT"
  }
}
```

### 调试技巧

1. **使用 Swagger UI 测试**
   - 最直观的测试方式
   - 自动生成请求格式
   - 实时查看响应

2. **检查请求头**
   ```
   Content-Type: application/json
   Authorization: Bearer <token>
   ```

3. **查看服务器日志**
   - 服务器控制台会输出详细的请求信息
   - 包含错误堆栈跟踪

4. **验证 JSON 格式**
   - 确保请求体是有效的 JSON
   - 使用 JSON 验证工具检查

## 最佳实践

### 1. Token 管理

- 安全存储 Token（不要暴露在前端代码中）
- Token 过期后及时重新登录
- 不同环境使用不同的 Token

### 2. 错误处理

- 始终检查响应的 `success` 字段
- 根据 HTTP 状态码和错误码进行处理
- 向用户显示友好的错误信息

### 3. 性能优化

- 合理使用列表接口
- 避免频繁请求
- 适当使用缓存

### 4. 安全建议

- 使用 HTTPS（生产环境）
- 不要在 URL 中传递敏感信息
- 定期更换密码
- 不要将 Token 写入日志

## 相关资源

- [API 文档说明](./README.md)
- [Swagger UI](http://localhost:3000/api-docs)
- [OpenAPI 规范文件](../../specs/001-/contracts/api-spec.yaml)

## 技术支持

如有问题或建议，请联系开发团队。