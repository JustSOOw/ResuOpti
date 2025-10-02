# ResuOpti – 个人简历管理平台

ResuOpti 是一套“目标岗位驱动”的个人简历管理平台：针对不同岗位维护多份简历版本，记录投递状态，并提供快速验收脚本。项目支持 Docker Compose 一键启动，也能在本地以 PostgreSQL 或 SQLite 模式开发。

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

## 快速启动

### 1. Docker Compose（推荐）

```bash
npm install                # 安装根目录脚本依赖（可选）
docker compose up --build -d
```

启动后：
- 前端：<http://localhost:5173>
- 后端 API：<http://localhost:3000>
- Swagger：<http://localhost:3000/api-docs>
- PostgreSQL：`localhost:15432`（用户名/密码均为 `postgres`）

> 如需本机访问数据库，可连接 `localhost:15432/resumopti_dev`。

### 2. 本地开发（使用 PostgreSQL）

1. 复制 `backend/.env.example` 为 `backend/.env`，填入真实数据库参数：
   ```ini
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=resumopti_dev
   ```
2. 初始化数据库：
   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run db:seed   # 可选
   ```
3. 安装前端依赖：
   ```bash
   cd ../frontend
   npm install
   ```
4. 回到根目录并启动：
   ```bash
   cd ..
   npm install          # 安装根脚本依赖
   npm start            # 并行启动 backend + frontend
   ```

> 若临时无法使用 PostgreSQL，可把 `DB_DIALECT` 改为 `sqlite` 体验功能，完成后再切回。

---

## 主要脚本

| 命令                       | 作用                               |
|----------------------------|------------------------------------|
| `npm start`                | 并行启动后端 `nodemon` 与前端 `vite` |
| `npm run start:backend`    | 单独启动后端开发服务               |
| `npm run start:frontend`   | 单独启动前端开发服务               |
| `docker compose up -d`     | 容器化部署                         |
| `node acceptance-test.js`  | 运行验收测试（T082 场景）          |
| `npm run test` (backend)   | Jest + Supertest                   |
| `npm run test:unit` (frontend) | Vitest 组件测试                |
| `npm run cypress:run`      | 前端 E2E（需额外配置）             |

---

## 环境变量

后端 `.env` 示例详见 `backend/.env.example`：

- `DB_DIALECT`：`postgres` / `sqlite`
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
- `DB_AUTO_SYNC` / `DB_SYNC_FORCE` 等自动建表开关
- `JWT_SECRET`、`JWT_EXPIRES_IN`
- `MAX_FILE_SIZE`（默认 10 MB）、`UPLOAD_DIR`
- `CORS_ORIGIN`

前端可在 `.env` 自定义 `VITE_API_BASE_URL`。

---

## 验收与测试

- `acceptance-test.js` 覆盖 quickstart.md 的 6 个业务场景（注册登录 → 岗位管理 → 简历上传 / 在线创建 → 元数据 → 投递记录 → 持久化验证）。
- `ACCEPTANCE_TEST_REPORT.md` 记录最近一次回归结果：32 个断言全部通过。
- 单元测试（Jest、Vitest）与 E2E（Cypress）脚手架已配置，可按需补充。

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
