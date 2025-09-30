# ResuOpti 共享类型定义

前后端共享的TypeScript类型定义和常量模块。

## 目录结构

```
shared/
├── types/              # 类型定义
│   ├── index.ts       # 统一导出
│   ├── api.ts         # API通用类型
│   ├── user.ts        # 用户类型
│   ├── position.ts    # 岗位类型
│   └── resume.ts      # 简历类型
├── constants/         # 常量定义
│   ├── index.ts      # 统一导出
│   ├── api.ts        # API端点常量
│   └── validation.ts # 验证规则常量
├── index.ts          # 主入口文件
├── package.json      # 包配置
├── tsconfig.json     # TypeScript配置
└── README.md         # 说明文档
```

## 使用方法

### 在后端使用

```typescript
// 导入类型
import { User, CreateTargetPositionRequest, ApiResponse } from '../../shared/types'

// 导入常量
import { POSITION_VALIDATION, API_BASE } from '../../shared/constants'

// 使用类型定义
const user: User = {
  id: 'uuid',
  email: 'user@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 使用验证常量
if (name.length > POSITION_VALIDATION.NAME_MAX_LENGTH) {
  throw new Error('岗位名称过长')
}
```

### 在前端使用

```typescript
// 导入类型
import type { User, TargetPosition, ApiResponse } from '../../shared/types'

// 导入常量
import { AUTH_ENDPOINTS, RESUME_VALIDATION } from '../../shared/constants'

// API请求
const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

// 类型检查
const data: ApiResponse<User> = await response.json()
```

## 命名规范

### 字段命名

- **共享类型统一使用 camelCase**（驼峰命名）
- 前端直接使用，符合JavaScript/TypeScript规范
- 后端需要进行 camelCase ↔ snake_case 转换

### 示例映射

| 共享类型 (camelCase) | 后端数据库 (snake_case) |
|---------------------|------------------------|
| userId              | user_id                |
| targetPositionId    | target_position_id     |
| createdAt           | created_at             |
| updatedAt           | updated_at             |

## 类型说明

### API通用类型 (api.ts)

- `ApiResponse<T>`: 成功响应格式
- `ApiErrorResponse`: 错误响应格式
- `PaginationParams`: 分页参数
- `PaginatedResponse<T>`: 分页响应格式

### 用户类型 (user.ts)

- `User`: 用户实体
- `RegisterRequest`: 注册请求
- `LoginRequest`: 登录请求
- `AuthResponse`: 认证响应

### 岗位类型 (position.ts)

- `TargetPosition`: 目标岗位实体
- `CreateTargetPositionRequest`: 创建岗位请求
- `UpdateTargetPositionRequest`: 更新岗位请求

### 简历类型 (resume.ts)

- `ResumeVersion`: 简历版本实体
- `ResumeMetadata`: 简历元数据
- `ApplicationRecord`: 投递记录
- `ResumeType`: 简历类型枚举
- `ApplicationStatus`: 投递状态枚举

## 验证规则

所有验证规则常量定义在 `constants/validation.ts` 中：

- `USER_VALIDATION`: 用户相关验证
- `POSITION_VALIDATION`: 岗位相关验证
- `RESUME_VALIDATION`: 简历相关验证
- `METADATA_VALIDATION`: 元数据相关验证
- `APPLICATION_VALIDATION`: 投递记录相关验证

## API端点

所有API端点常量定义在 `constants/api.ts` 中：

- `AUTH_ENDPOINTS`: 认证相关端点
- `USER_ENDPOINTS`: 用户相关端点
- `POSITION_ENDPOINTS`: 岗位相关端点
- `RESUME_ENDPOINTS`: 简历相关端点
- `APPLICATION_ENDPOINTS`: 投递记录相关端点

## 维护指南

### 添加新类型

1. 在对应的类型文件中定义类型
2. 在 `types/index.ts` 中导出
3. 更新本文档

### 添加新常量

1. 在对应的常量文件中定义
2. 在 `constants/index.ts` 中导出
3. 更新本文档

### 修改现有类型

1. 评估影响范围（前端/后端）
2. 同步更新相关代码
3. 更新数据模型文档

## 注意事项

1. **类型一致性**：修改类型定义时必须同时考虑前后端影响
2. **命名转换**：后端使用时注意进行字段名转换
3. **验证同步**：前后端验证规则应使用相同常量
4. **版本控制**：类型修改应谨慎，避免破坏性变更
5. **文档更新**：任何修改都应更新相关文档