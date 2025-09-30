# Tasks: 个人简历管理平台

**功能**: 001-resume-management-platform
**日期**: 2025-09-29
**输入**: 设计文档来自 `/mnt/d/Users/JUSTsoo/Documents/aprojectCODE/ResuOpti/specs/001-/`
**前提条件**: plan.md（必需）、research.md、data-model.md、contracts/

## 技术栈概述
- **后端**: Node.js 18+ LTS、Express.js、PostgreSQL、Sequelize ORM
- **前端**: Vue 3 + TypeScript + Vite、Element Plus UI库、Pinia状态管理、Tiptap富文本编辑器
- **测试**: Jest（单元测试）、Cypress（E2E测试）、Vitest（Vue组件测试）
- **存储**: PostgreSQL（关系数据）、文件系统存储（简历文件）

## 项目结构
```
backend/
├── src/
│   ├── models/           # Sequelize数据模型
│   ├── services/         # 业务逻辑服务层
│   ├── api/              # REST API控制器
│   ├── middleware/       # Express中间件
│   ├── utils/            # 工具函数
│   └── config/           # 配置文件
├── tests/
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── contract/         # API契约测试
└── uploads/              # 文件上传存储目录

frontend/
├── src/
│   ├── components/       # Vue组件
│   ├── views/            # 页面组件
│   ├── composables/      # Composition API复用逻辑
│   ├── stores/           # Pinia状态管理
│   ├── services/         # API服务层
│   ├── utils/            # 前端工具函数
│   ├── styles/           # SCSS样式文件
│   ├── router/           # Vue Router配置
│   └── types/            # TypeScript类型定义
└── tests/
    ├── unit/             # 组件单元测试
    └── e2e/              # E2E测试
```

## Phase 3.1: 项目初始化与环境配置

- [X] T001 [P] 初始化后端项目结构，配置 Node.js + Express.js 基础架构 在 backend/
- [X] T002 [P] 初始化前端项目结构，配置 Vue 3 + Vite + TypeScript 在 frontend/
- [X] T003 [P] 配置 PostgreSQL 数据库连接和 Sequelize ORM 在 backend/src/config/database.js
- [X] T004 [P] 配置 ESLint + Prettier 代码规范工具 在 backend/ 和 frontend/
- [X] T005 [P] 配置测试框架：Jest（后端）、Vitest（前端）、Cypress（E2E）
- [X] T006 [P] 创建环境变量配置文件和 Docker 配置 在 根目录

## Phase 3.2: 数据库模型与迁移（TDD 优先）

- [X] T007 [P] 创建 User 模型迁移文件 在 backend/src/models/User.js
- [X] T008 [P] 创建 TargetPosition 模型迁移文件 在 backend/src/models/TargetPosition.js
- [X] T009 [P] 创建 ResumeVersion 模型迁移文件 在 backend/src/models/ResumeVersion.js
- [X] T010 [P] 创建 ResumeMetadata 模型迁移文件 在 backend/src/models/ResumeMetadata.js
- [X] T011 [P] 创建 ApplicationRecord 模型迁移文件 在 backend/src/models/ApplicationRecord.js
- [X] T012 配置模型关系和外键约束 在 backend/src/models/index.js

## Phase 3.3: API契约测试（必须在实现前失败）

**重要：这些测试必须写出并且失败，然后才能开始任何实现**

- [X] T013 [P] 用户认证API契约测试：POST /api/v1/auth/register 在 backend/tests/contract/auth-register.test.js
- [X] T014 [P] 用户认证API契约测试：POST /api/v1/auth/login 在 backend/tests/contract/auth-login.test.js
- [X] T015 [P] 目标岗位API契约测试：GET /api/v1/target-positions 在 backend/tests/contract/target-positions-get.test.js
- [X] T016 [P] 目标岗位API契约测试：POST /api/v1/target-positions 在 backend/tests/contract/target-positions-post.test.js
- [X] T017 [P] 目标岗位API契约测试：GET /api/v1/target-positions/{id} 在 backend/tests/contract/target-positions-get-by-id.test.js
- [X] T018 [P] 目标岗位API契约测试：PUT /api/v1/target-positions/{id} 在 backend/tests/contract/target-positions-put.test.js
- [X] T019 [P] 目标岗位API契约测试：DELETE /api/v1/target-positions/{id} 在 backend/tests/contract/target-positions-delete.test.js
- [X] T020 [P] 简历版本API契约测试：POST /api/v1/resumes 在 backend/tests/contract/resumes-post.test.js
- [X] T021 [P] 简历文件上传API契约测试：POST /api/v1/resumes/upload 在 backend/tests/contract/resumes-upload.test.js

## Phase 3.4: 后端业务逻辑服务层

- [X] T022 [P] 用户认证服务：密码哈希、JWT生成验证 在 backend/src/services/authService.js
- [X] T023 [P] 目标岗位管理服务：CRUD操作和验证 在 backend/src/services/positionService.js
- [X] T024 [P] 简历版本管理服务：在线/文件管理逻辑 在 backend/src/services/resumeService.js
- [X] T025 [P] 文件上传处理服务：Multer集成、验证、存储 在 backend/src/services/fileService.js
- [X] T026 [P] 简历元数据管理服务：备注和标签CRUD 在 backend/src/services/metadataService.js
- [X] T027 [P] 投递记录管理服务：状态跟踪和查询 在 backend/src/services/applicationService.js

## Phase 3.5: 后端API控制器实现

- [X] T028 实现用户认证API控制器：注册和登录端点 在 backend/src/api/auth/index.js
- [X] T029 实现目标岗位API控制器：完整CRUD端点 在 backend/src/api/positions/index.js
- [X] T030 实现简历版本API控制器：创建和管理端点 在 backend/src/api/resumes/index.js
- [X] T031 实现文件上传API控制器：Multer中间件集成 在 backend/src/api/upload/index.js

## Phase 3.6: 后端中间件和工具

- [X] T032 [P] JWT认证中间件：token验证和用户提取 在 backend/src/middleware/auth.js
- [X] T033 [P] 文件上传中间件：大小和格式验证 在 backend/src/middleware/upload.js
- [X] T034 [P] 请求数据验证中间件：Joi/express-validator 在 backend/src/middleware/validation.js
- [X] T035 [P] 错误处理中间件：统一错误响应格式 在 backend/src/middleware/error.js
- [X] T036 [P] 加密工具：密码哈希和JWT工具函数 在 backend/src/utils/crypto.js
- [X] T037 [P] 响应格式化工具：统一API响应结构 在 backend/src/utils/response.js
- [X] T038 [P] 日志工具：Winston配置和中间件 在 backend/src/utils/logger.js

## Phase 3.7: 前端状态管理和服务层

- [X] T039 [P] 用户认证状态管理：登录状态、token管理 在 frontend/src/stores/auth.ts
- [X] T040 [P] 目标岗位状态管理：岗位列表和选中状态 在 frontend/src/stores/positions.ts
- [X] T041 [P] 简历版本状态管理：简历列表和编辑状态 在 frontend/src/stores/resumes.ts
- [X] T042 [P] 主题状态管理：暗黑模式切换和持久化 在 frontend/src/stores/theme.ts
- [X] T043 [P] API服务基础配置：axios封装、拦截器 在 frontend/src/services/api.ts
- [X] T044 [P] 用户认证API服务：注册、登录接口调用 在 frontend/src/services/auth.ts
- [X] T045 [P] 目标岗位API服务：CRUD接口调用 在 frontend/src/services/positions.ts
- [X] T046 [P] 简历版本API服务：创建、编辑接口调用 在 frontend/src/services/resumes.ts

## Phase 3.8: 前端通用组件

- [X] T047 [P] 基础通用组件：Header、Sidebar、Loading 在 frontend/src/components/common/
- [X] T048 [P] 表单通用组件：LoginForm、PositionForm 在 frontend/src/components/forms/
- [X] T049 [P] 业务通用组件：ResumeCard、FileUpload 在 frontend/src/components/business/
- [X] T050 [P] Element Plus暗黑主题配置和自定义样式 在 frontend/src/styles/theme.scss

## Phase 3.9: 前端页面组件

- [X] T051 [P] 用户登录注册页面：表单验证和状态管理 在 frontend/src/views/auth/
- [X] T052 [P] 主仪表板页面：岗位列表和创建入口 在 frontend/src/views/dashboard/
- [X] T053 [P] 目标岗位管理页面：详情、简历列表 在 frontend/src/views/positions/
- [X] T054 实现Tiptap富文本编辑器页面：在线简历创建 在 frontend/src/views/editor/
- [X] T055 PDF导出功能：html2pdf.js集成 在 frontend/src/views/editor/ (需要T054完成)

## Phase 3.10: 前端Composition API和工具

- [X] T056 [P] 认证相关Composable：useAuth用户状态管理 在 frontend/src/composables/useAuth.ts
- [X] T057 [P] 文件上传Composable：useFileUpload进度管理 在 frontend/src/composables/useFileUpload.ts
- [X] T058 [P] 主题切换Composable：useTheme暗黑模式 在 frontend/src/composables/useTheme.ts
- [X] T059 [P] 前端工具函数：HTTP请求封装 在 frontend/src/utils/request.ts
- [X] T060 [P] 表单验证工具：validation规则 在 frontend/src/utils/validation.ts
- [X] T061 [P] 文件处理工具：类型检查、大小格式化 在 frontend/src/utils/file.ts

## Phase 3.11: 前端路由和类型定义

- [X] T062 [P] Vue Router配置：路由表和导航守卫 在 frontend/src/router/index.ts
- [X] T063 [P] TypeScript类型定义：API响应和业务实体 在 frontend/src/types/
- [X] T064 [P] 前后端共享类型定义：确保数据一致性 在 shared/types/

## Phase 3.12: 集成测试和E2E测试

- [X] T065 [P] 用户注册登录集成测试：完整认证流程 在 backend/tests/integration/auth.test.js
- [X] T066 [P] 目标岗位管理集成测试：CRUD操作流程 在 backend/tests/integration/positions.test.js
- [X] T067 [P] 简历版本管理集成测试：创建编辑流程 在 backend/tests/integration/resumes.test.js
- [X] T068 [P] 文件上传集成测试：多格式和大小验证 在 backend/tests/integration/upload.test.js
- [X] T069 [P] E2E用户场景测试：注册到创建简历完整流程 在 frontend/tests/e2e/user-journey.cy.ts
- [X] T070 [P] E2E简历管理测试：编辑导出投递记录流程 在 frontend/tests/e2e/resume-management.cy.ts

## Phase 3.13: 系统集成和配置

- [X] T071 数据库种子数据：测试用户和示例数据 在 backend/src/seeders/
- [X] T072 API路由整合：Express路由配置和中间件绑定 在 backend/src/app.js
- [X] T073 前端应用入口：Vue实例配置和插件注册 在 frontend/src/main.ts
- [X] T074 环境配置管理：开发、测试、生产环境变量 在 根目录/.env*
- [X] T075 错误边界和全局异常处理：前后端错误捕获 跨 backend/frontend

## Phase 3.14: 性能优化和Polish

- [ ] T076 [P] 前端性能优化：路由懒加载、组件异步加载 在 frontend/src/router/
- [ ] T077 [P] 后端性能优化：数据库查询优化和缓存策略 在 backend/src/services/
- [ ] T078 [P] 前端单元测试：关键组件测试覆盖 在 frontend/tests/unit/
- [ ] T079 [P] 后端单元测试：服务层和工具函数测试 在 backend/tests/unit/
- [ ] T080 代码质量检查：ESLint规则调优和重构优化 跨 backend/frontend
- [ ] T081 [P] API文档生成：Swagger/OpenAPI文档自动化 在 backend/docs/
- [ ] T082 quickstart.md用户验收测试：端到端场景验证 在 根目录

## 依赖关系图

### 关键依赖链
- 项目初始化 (T001-T006) → 数据库模型 (T007-T012) → 契约测试 (T013-T021) → 服务层 (T022-T027) → API控制器 (T028-T031)
- T012 (模型关系) 阻塞所有服务层任务 (T022-T027)
- T022-T027 (服务层) 阻塞 API控制器 (T028-T031)
- T043 (API基础配置) 阻塞所有前端API服务 (T044-T046)
- T054 (编辑器页面) 阻塞 T055 (PDF导出)
- T071-T075 (系统集成) 需要大部分核心功能完成

### 完全并行任务组
```bash
# 项目初始化可并行执行：
Task: "初始化后端项目结构，配置 Node.js + Express.js 基础架构 在 backend/"
Task: "初始化前端项目结构，配置 Vue 3 + Vite + TypeScript 在 frontend/"
Task: "配置 PostgreSQL 数据库连接和 Sequelize ORM 在 backend/src/config/database.js"
Task: "配置 ESLint + Prettier 代码规范工具 在 backend/ 和 frontend/"

# 数据模型可并行创建：
Task: "创建 User 模型迁移文件 在 backend/src/models/User.js"
Task: "创建 TargetPosition 模型迁移文件 在 backend/src/models/TargetPosition.js"
Task: "创建 ResumeVersion 模型迁移文件 在 backend/src/models/ResumeVersion.js"

# 契约测试可并行编写：
Task: "用户认证API契约测试：POST /api/v1/auth/register 在 backend/tests/contract/auth-register.test.js"
Task: "用户认证API契约测试：POST /api/v1/auth/login 在 backend/tests/contract/auth-login.test.js"
Task: "目标岗位API契约测试：GET /api/v1/target-positions 在 backend/tests/contract/target-positions-get.test.js"
```

## 验证检查清单

在开始实施前验证：
- [ ] 所有API契约都有对应的测试任务
- [ ] 所有数据模型实体都有创建任务
- [ ] 所有测试在实现任务之前
- [ ] 并行任务确实独立无依赖
- [ ] 每个任务都指定了确切的文件路径
- [ ] 没有任务修改与其他 [P] 任务相同的文件

## 成功标准

该功能的所有任务完成后应达到：
- [ ] 用户可以注册登录并管理个人简历
- [ ] 支持按目标岗位分类管理简历版本
- [ ] 支持文件上传（PDF/Word）和在线富文本编辑
- [ ] 支持简历元数据（备注、标签）和投递记录管理
- [ ] 界面采用暗黑主题设计，响应式布局
- [ ] 所有API响应时间 < 200ms (p95)
- [ ] 测试覆盖率 ≥ 80%
- [ ] 通过quickstart.md中的所有验收场景

---
*基于ResuOpti项目宪法v1.0.0和Phase 1设计文档生成的详细实施任务*