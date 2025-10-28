# ResuOpti – 个人简历管理平台

ResuOpti 是一套"目标岗位驱动"的个人简历管理平台：针对不同岗位维护多份简历版本，记录投递状态，并提供快速验收脚本。**项目完全 Docker 化，一键启动所有服务（前端、后端、数据库），真正实现跨平台一致性。**

---

## 功能亮点

- **用户认证**：注册 / 登录、JWT 鉴权、登录速率限制。
- **目标岗位管理**：岗位信息、描述、统计数据，支持编辑 / 删除。
- **简历版本管理**：
  - 上传 PDF / Word 文件（最大 10 MB）。
  - 在线富文本编辑（Tiptap）。
  - 备注、标签、投递记录元数据。
- **投递记录追踪**：记录公司、状态、备注，支持状态更新。
- **Swagger API 文档**：`/api-docs` 自动挂载，规范文件位于 `specs/001-/contracts/api-spec.yaml`。
- **自动化验收脚本**：`acceptance-test.js` 覆盖 quickstart.md 中 6 个业务场景（详见 `ACCEPTANCE_TEST_REPORT.md`）。

---

## 技术栈

| 层       | 技术                                                         |
|----------|--------------------------------------------------------------|
| 后端     | Node.js 18/22、Express 5、Sequelize、PostgreSQL（默认）       |
| 前端     | Vue 3 + TypeScript、Vite 7、Element Plus、Pinia               |
| 测试     | Jest、Vitest、Cypress、Supertest                              |
| 其他     | Docker Compose、Swagger UI、Multer、Winston                   |

> 为了自动化验收脚本，后端在 `DB_DIALECT=sqlite` 时会自动创建本地数据库；生产与团队协作仍推荐使用 PostgreSQL。

---

## 目录结构

```
ResuOpti/
├── backend/                 # Express + Sequelize 后端
│   ├── src/
│   │   ├── api/             # REST 控制器
│   │   ├── services/        # 业务服务层
│   │   ├── models/          # Sequelize 模型
│   │   ├── middleware/      # 公共中间件
│   │   └── config/          # 数据库、Swagger、日志等配置
│   ├── tests/               # Jest / Supertest 测试
│   └── Dockerfile
├── frontend/                # Vue 3 + Vite 单页应用
│   ├── src/
│   │   ├── views/           # 页面
│   │   ├── components/      # 复用组件
│   │   ├── stores/          # Pinia 状态
│   │   └── services/        # API 封装
│   └── Dockerfile
├── shared/                  # 前后端共享类型
├── specs/                   # 设计文档与契约
├── docker-compose.yml       # 容器编排
├── acceptance-test.js       # 快速验收脚本
├── ACCEPTANCE_TEST_REPORT.md# 最近一次 T082 验收报告
└── README.md                # 本文档
```

---

## 快速启动（完全 Docker 化）

### 一键启动所有服务

```bash
npm start
```

这个命令会自动使用 Docker Compose 构建并启动所有服务（前端、后端、数据库）。

**首次启动或代码更新后**，建议使用：
```bash
npm start
```

**后台运行模式**（不显示日志）：
```bash
npm run start:detach
```

### 访问地址

启动后：
- 前端：<http://localhost:5174>
- 后端 API：<http://localhost:3001>
- Swagger：<http://localhost:3001/api-docs>
- PostgreSQL：`localhost:15432`（用户名/密码均为 `postgres`）

> 如需本机访问数据库，可连接 `localhost:15432/resumopti_dev`。

### 其他常用命令

```bash
npm run stop          # 停止所有服务
npm run restart       # 重启所有服务
npm run logs          # 查看所有服务日志
npm run logs:backend  # 只查看后端日志
npm run logs:frontend # 只查看前端日志
npm run logs:db       # 只查看数据库日志
npm run ps            # 查看服务状态
npm run info          # 显示服务访问地址
npm run clean         # 停止并删除所有容器和数据卷（慎用）
```

---

## 主要脚本

| 命令                       | 作用                               |
|----------------------------|------------------------------------|
| `npm start`                | 使用 Docker 启动所有服务（前台运行，显示日志） |
| `npm run start:detach`     | 使用 Docker 启动所有服务（后台运行） |
| `npm run stop`             | 停止所有 Docker 服务               |
| `npm run restart`          | 重启所有 Docker 服务               |
| `npm run logs`             | 查看所有服务的实时日志             |
| `npm run ps`               | 查看服务运行状态                   |
| `npm run clean`            | 停止并删除所有容器和数据卷（慎用） |
| `node acceptance-test.js`  | 运行验收测试（T082 场景）          |

---

## 环境变量

Docker Compose 会自动加载环境变量配置，无需手动配置。

如需自定义配置，可参考：
- 后端配置：`backend/.env.example`
- 前端配置：`frontend/.env`（可自定义 `VITE_API_BASE_URL`）

**注意**：使用 Docker 启动时，所有环境变量已在 `docker-compose.yml` 中预配置，通常无需修改。

---

## 验收与测试

- `acceptance-test.js` 覆盖 quickstart.md 的 6 个业务场景（注册登录 → 岗位管理 → 简历上传 / 在线创建 → 元数据 → 投递记录 → 持久化验证）。
- `ACCEPTANCE_TEST_REPORT.md` 记录最近一次回归结果：32 个断言全部通过。
- 单元测试（Jest、Vitest）与 E2E（Cypress）脚手架已配置，可按需补充。

-测试账号：wang22338014@gmail.com   密码：uZEZpCa5D6d2XcW
---

## 贡献指南

1. Fork 或创建新分支开发。
2. 提交前运行 `npm run lint`、相关测试及验收脚本。
3. 如果调整数据库结构，请提供 Sequelize migration 并同步更新契约文档。
4. PR 请说明影响范围和测试情况。

---

## 许可

项目目前未明确开源协议（`backend/package.json` 默认 ISC）。若计划对外发布，请补充 LICENSE 并更新 README。

---

欢迎使用 ResuOpti 管理你的求职简历，也期待你的 Issue / PR！
