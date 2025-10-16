# 环境变量配置指南

## 概述

ResuOpti项目使用环境变量来管理不同环境(开发、测试、生产)的配置。本文档说明如何配置和使用环境变量。

## 目录结构

```
ResuOpti/
├── backend/
│   ├── .env.example              # 后端开发环境示例
│   ├── .env.production.example   # 后端生产环境示例
│   ├── .env.test                 # 后端测试环境配置
│   └── .env                      # 本地开发配置 (不提交到Git)
└── frontend/
    ├── .env.example              # 前端开发环境示例
    ├── .env.production           # 前端生产环境配置
    └── .env                      # 本地开发配置 (不提交到Git)
```

## 快速开始

### 1. 后端环境配置

```bash
# 进入后端目录
cd backend

# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，修改数据库连接等配置
nano .env  # 或使用你喜欢的编辑器
```

**重要配置项**:

```env
# 数据库配置 - 确保PostgreSQL已安装并运行
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=resumopti_dev

# JWT密钥 - 生产环境必须修改!
JWT_SECRET=your-strong-random-secret-key

# CORS配置 - 前端地址
CORS_ORIGIN=http://localhost:5173
```

### 2. 前端环境配置

```bash
# 进入前端目录
cd frontend

# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

**重要配置项**:

```env
# API地址 - 指向后端服务
VITE_API_BASE_URL=http://localhost:3000/api/v1

# 应用标题
VITE_APP_TITLE=ResuOpti - 个人简历管理平台
```

## 环境变量说明

### 后端环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `development` | 是 |
| `PORT` | 服务端口 | `3000` | 是 |
| `DB_HOST` | 数据库地址 | `localhost` | 是 |
| `DB_PORT` | 数据库端口 | `5432` | 是 |
| `DB_USER` | 数据库用户名 | `postgres` | 是 |
| `DB_PASSWORD` | 数据库密码 | - | 是 |
| `DB_NAME` | 数据库名称 | `resumopti_dev` | 是 |
| `JWT_SECRET` | JWT密钥 | - | 是 |
| `JWT_EXPIRES_IN` | Token有效期 | `24h` | 否 |
| `CORS_ORIGIN` | 允许的前端地址 | `http://localhost:5173` | 是 |
| `MAX_FILE_SIZE` | 最大文件大小(字节) | `10485760` | 否 |
| `UPLOAD_DIR` | 上传目录 | `uploads` | 否 |

### 前端环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 后端API地址 | - | 是 |
| `VITE_API_TIMEOUT` | API超时时间(ms) | `10000` | 否 |
| `VITE_APP_TITLE` | 应用标题 | `ResuOpti` | 否 |
| `VITE_APP_VERSION` | 应用版本 | `1.0.0` | 否 |
| `VITE_ENABLE_DARK_MODE` | 启用暗黑模式 | `true` | 否 |
| `VITE_MAX_FILE_SIZE_MB` | 最大文件大小(MB) | `10` | 否 |

**注意**: Vite前端环境变量必须以 `VITE_` 开头才能在客户端代码中访问。

## 不同环境配置

### 开发环境 (Development)

使用 `.env` 或 `.env.development` 文件:

```bash
# 后端
NODE_ENV=development
PORT=3000

# 前端
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 测试环境 (Test)

使用 `.env.test` 文件:

```bash
# 后端
NODE_ENV=test
PORT=3001
DB_NAME=resumopti_test

# 前端
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

运行测试时会自动加载测试环境配置。

### 生产环境 (Production)

使用 `.env.production` 文件:

```bash
# 后端
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_SSL=true
JWT_SECRET=your-strong-production-secret

# 前端
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
VITE_SHOW_DEV_TOOLS=false
```

## 安全最佳实践

### 1. 不要提交敏感信息到Git

确保 `.gitignore` 包含以下内容:

```gitignore
# 环境变量文件
.env
.env.local
.env.*.local
backend/.env
frontend/.env
```

### 2. 使用强密码和密钥

生产环境的 `JWT_SECRET` 应该是强随机字符串:

```bash
# 生成强随机密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 限制数据库权限

生产环境数据库用户应该只有必要的权限:

```sql
-- 创建专用数据库用户
CREATE USER resumopti_app WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE resumopti_prod TO resumopti_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO resumopti_app;
```

### 4. 定期更新密钥

定期轮换JWT密钥和数据库密码，特别是在怀疑泄露时。

## 故障排查

### 问题1: 后端无法连接数据库

**检查项**:
- PostgreSQL服务是否运行: `sudo systemctl status postgresql`
- 数据库是否存在: `psql -U postgres -c "\l"`
- 用户名和密码是否正确
- 数据库端口是否正确 (默认5432)

### 问题2: 前端无法访问后端API

**检查项**:
- `VITE_API_BASE_URL` 是否正确
- 后端服务是否运行
- CORS配置是否包含前端地址
- 网络防火墙设置

### 问题3: JWT认证失败

**检查项**:
- `JWT_SECRET` 前后端是否一致
- Token是否过期 (检查 `JWT_EXPIRES_IN`)
- Token格式是否正确

## 环境变量加载顺序

### 后端 (Node.js)

1. `.env` 文件 (通过 `dotenv` 加载)
2. 系统环境变量 (优先级更高)

### 前端 (Vite)

1. `.env` - 所有环境加载
2. `.env.local` - 所有环境加载，但会被git忽略
3. `.env.[mode]` - 指定模式下加载 (如 `.env.production`)
4. `.env.[mode].local` - 指定模式下加载，但会被git忽略

优先级: `.env.[mode].local` > `.env.[mode]` > `.env.local` > `.env`

## 相关命令

```bash
# 查看当前环境变量
printenv | grep -E "(NODE_ENV|VITE_)"

# 使用指定环境运行
NODE_ENV=production node backend/src/server.js

# Vite构建时指定模式
npm run build --mode production
```

---

*最后更新: 2025-09-30*