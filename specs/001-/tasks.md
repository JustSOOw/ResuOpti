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

- [X] T076 [P] 前端性能优化：路由懒加载、组件异步加载 在 frontend/src/router/
- [X] T077 [P] 后端性能优化：数据库查询优化和缓存策略 在 backend/src/services/
- [X] T078 [P] 前端单元测试：关键组件测试覆盖 在 frontend/tests/unit/
- [X] T079 [P] 后端单元测试：服务层和工具函数测试 在 backend/tests/unit/
- [X] T080 代码质量检查：ESLint规则调优和重构优化 跨 backend/frontend
- [X] T081 [P] API文档生成：Swagger/OpenAPI文档自动化 在 backend/docs/
- [X] T082 quickstart.md用户验收测试：端到端场景验证 在 根目录

## Phase 3.15: 简历元数据编辑功能增强

**背景**: 当前简历元数据（备注、标签）的显示功能已实现，但缺少编辑UI界面。用户无法在前端界面中添加或修改简历的备注和标签信息。

**目标**: 为所有类型的简历（文件和在线）提供完整的元数据编辑功能，包括独立的编辑对话框和快捷编辑入口。

- [X] T083 修复后端API响应字段映射：将下划线字段转换为驼峰命名 在 backend/src/api/resumes/index.js
- [X] T084 [P] 创建简历元数据编辑对话框组件：ResumeMetadataDialog.vue 在 frontend/src/components/business/ResumeMetadataDialog.vue
- [X] T085 [P] 编写元数据编辑对话框单元测试：表单验证和提交逻辑 在 frontend/tests/unit/ResumeMetadataDialog.spec.ts
- [X] T086 在PositionDetailView中集成元数据编辑功能：添加编辑入口和对话框调用 在 frontend/src/views/positions/PositionDetailView.vue
- [X] T087 更新ResumeCard组件：添加标签和备注的快捷编辑按钮 在 frontend/src/components/business/ResumeCard.vue
- [X] T088 [P] 验证元数据更新API的前后端集成：确保字段映射正确 在 frontend/src/services/resumes.ts
- [X] T089 [P] E2E测试：简历元数据完整编辑流程测试 在 frontend/tests/e2e/resume-metadata.cy.ts
- [X] T090 更新用户文档：添加元数据编辑功能使用说明 在 specs/001-/quickstart.md

## Phase 3.16: 测试质量提升和问题修复

**背景**: 2025-10-07测试报告显示：测试用例完整但通过率不足（后端49%，前端92.5%），代码覆盖率仅30%（目标80%），存在严重的认证和权限隔离问题。

**目标**: 修复所有测试失败问题，提升代码覆盖率至80%，确保系统安全性和稳定性。

### 3.16.1 认证机制修复（阻塞性）

- [X] T091 修复契约测试的JWT token生成机制 在 backend/tests/utils/auth-helper.js
- [X] T092 [P] 创建测试环境专用的token工具函数 在 backend/tests/utils/token-generator.js
- [X] T093 [P] 更新所有契约测试使用新的token生成器 在 backend/tests/contract/
- [X] T094 验证所有契约测试能够正确通过认证 在 backend/tests/contract/

### 3.16.2 权限隔离实施（安全关键）

- [X] T095 在positionService中实施严格的用户资源所有权验证 在 backend/src/services/positionService.js
- [X] T096 在resumeService中实施用户资源所有权验证 在 backend/src/services/resumeService.js
- [X] T097 [P] 在metadataService中实施用户资源所有权验证 在 backend/src/services/metadataService.js
- [X] T098 [P] 在applicationService中实施用户资源所有权验证 在 backend/src/services/applicationService.js
- [X] T099 添加权限验证的集成测试 在 backend/tests/integration/permissions.test.js
- [X] T100 运行所有权限相关测试并验证通过 在 backend/tests/integration/

### 3.16.3 单元测试Mock修复

- [ ] T101 [P] 修复authService单元测试的Sequelize mock配置 在 backend/tests/unit/services/authService.test.js
- [ ] T102 [P] 修复positionService单元测试的mock配置 在 backend/tests/unit/services/positionService.test.js
- [ ] T103 [P] 修复前端Header组件的Element Plus mock 在 frontend/tests/unit/common/Header.spec.ts
- [ ] T104 优化前端测试工具的mock配置 在 frontend/tests/unit/utils/test-utils.ts
- [ ] T105 验证所有单元测试100%通过 在 backend/tests/unit/ 和 frontend/tests/unit/

### 3.16.4 提升API层测试覆盖率

- [ ] T106 [P] 补充auth API控制器的单元测试 在 backend/tests/unit/api/auth.test.js
- [ ] T107 [P] 补充positions API控制器的单元测试 在 backend/tests/unit/api/positions.test.js
- [ ] T108 [P] 补充resumes API控制器的单元测试 在 backend/tests/unit/api/resumes.test.js
- [ ] T109 [P] 补充upload API控制器的单元测试 在 backend/tests/unit/api/upload.test.js
- [ ] T110 验证API层测试覆盖率达到80% 在 backend/src/api/

### 3.16.5 服务层测试补充

- [ ] T111 补充metadataService完整测试（当前0%覆盖率） 在 backend/tests/unit/services/metadataService.test.js
- [ ] T112 补充applicationService完整测试（当前4.85%覆盖率） 在 backend/tests/unit/services/applicationService.test.js
- [ ] T113 补充resumeService完整测试（当前3.41%覆盖率） 在 backend/tests/unit/services/resumeService.test.js
- [ ] T114 补充fileService测试覆盖边界情况 在 backend/tests/unit/services/fileService.test.js
- [ ] T115 验证服务层测试覆盖率达到80% 在 backend/src/services/

### 3.16.6 中间件测试补充

- [ ] T116 补充validation中间件完整测试（当前0%覆盖率） 在 backend/tests/unit/middleware/validation.test.js
- [ ] T117 补充error中间件边界情况测试 在 backend/tests/unit/middleware/error.test.js
- [ ] T118 补充auth中间件的权限测试场景 在 backend/tests/unit/middleware/auth.test.js
- [ ] T119 验证中间件测试覆盖率达到80% 在 backend/src/middleware/

### 3.16.7 集成测试修复和增强

- [ ] T120 修复文件上传集成测试的ECONNRESET错误 在 backend/tests/integration/upload.test.js
- [ ] T121 修复positions集成测试的resumeCount字段问题 在 backend/tests/integration/positions.test.js
- [ ] T122 补充简历元数据更新的集成测试 在 backend/tests/integration/metadata.test.js
- [ ] T123 补充投递记录管理的集成测试 在 backend/tests/integration/applications.test.js
- [ ] T124 验证所有集成测试通过率达到90% 在 backend/tests/integration/

### 3.16.8 E2E测试执行

- [ ] T125 配置E2E测试环境（前后端同时运行） 在 根目录/docker-compose.test.yml
- [ ] T126 执行用户完整流程E2E测试 在 frontend/tests/e2e/user-journey.cy.ts
- [ ] T127 执行简历管理E2E测试 在 frontend/tests/e2e/resume-management.cy.ts
- [ ] T128 执行元数据编辑E2E测试 在 frontend/tests/e2e/resume-metadata.cy.ts
- [ ] T129 验证所有E2E测试通过 在 frontend/tests/e2e/

### 3.16.9 测试覆盖率验证

- [ ] T130 生成后端完整测试覆盖率报告 在 backend/coverage/
- [ ] T131 生成前端完整测试覆盖率报告 在 frontend/coverage/
- [ ] T132 验证后端代码覆盖率≥80% 在 backend/
- [ ] T133 验证前端代码覆盖率≥80% 在 frontend/
- [ ] T134 更新测试报告文档 在 specs/001-/test-report-final.md

## 依赖关系图

### 关键依赖链
- 项目初始化 (T001-T006) → 数据库模型 (T007-T012) → 契约测试 (T013-T021) → 服务层 (T022-T027) → API控制器 (T028-T031)
- T012 (模型关系) 阻塞所有服务层任务 (T022-T027)
- T022-T027 (服务层) 阻塞 API控制器 (T028-T031)
- T043 (API基础配置) 阻塞所有前端API服务 (T044-T046)
- T054 (编辑器页面) 阻塞 T055 (PDF导出)
- T071-T075 (系统集成) 需要大部分核心功能完成
- **T083 (字段映射修复) 阻塞 T084-T090 (元数据编辑功能)**
- **T084 (元数据对话框组件) 阻塞 T086 (PositionDetailView集成)**
- **T086 (PositionDetailView集成) 和 T087 (ResumeCard快捷入口) 可并行开发**
- **Phase 3.16测试质量提升依赖关系**:
  - **T091 (token机制修复) 阻塞 T093-T094 (契约测试更新)**
  - **T095-T098 (权限验证实施) 阻塞 T099-T100 (权限测试)**
  - **T101-T104 (Mock修复) 阻塞 T105 (单元测试验证)**
  - **所有API/服务测试任务可并行开发 (T106-T119)**
  - **T120-T123 (集成测试修复) 必须在T091-T100完成后执行**
  - **T125-T129 (E2E测试) 依赖所有功能和测试修复完成**
  - **T130-T134 (覆盖率验证) 必须在所有测试任务完成后执行**

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

# 元数据编辑功能可并行开发：
Task: "创建简历元数据编辑对话框组件：ResumeMetadataDialog.vue 在 frontend/src/components/business/ResumeMetadataDialog.vue"
Task: "编写元数据编辑对话框单元测试：表单验证和提交逻辑 在 frontend/tests/unit/ResumeMetadataDialog.spec.ts"
Task: "验证元数据更新API的前后端集成：确保字段映射正确 在 frontend/src/services/resumes.ts"
Task: "E2E测试：简历元数据完整编辑流程测试 在 frontend/tests/e2e/resume-metadata.cy.ts"

# Phase 3.16测试质量提升可并行任务：
Task: "创建测试环境专用的token工具函数 在 backend/tests/utils/token-generator.js"
Task: "更新所有契约测试使用新的token生成器 在 backend/tests/contract/"
Task: "在metadataService中实施用户资源所有权验证 在 backend/src/services/metadataService.js"
Task: "在applicationService中实施用户资源所有权验证 在 backend/src/services/applicationService.js"
Task: "修复authService单元测试的Sequelize mock配置 在 backend/tests/unit/services/authService.test.js"
Task: "修复positionService单元测试的mock配置 在 backend/tests/unit/services/positionService.test.js"
Task: "修复前端Header组件的Element Plus mock 在 frontend/tests/unit/common/Header.spec.ts"
Task: "补充auth API控制器的单元测试 在 backend/tests/unit/api/auth.test.js"
Task: "补充positions API控制器的单元测试 在 backend/tests/unit/api/positions.test.js"
Task: "补充resumes API控制器的单元测试 在 backend/tests/unit/api/resumes.test.js"
Task: "补充upload API控制器的单元测试 在 backend/tests/unit/api/upload.test.js"
```

## 验证检查清单

在开始实施前验证：
- [X] 所有API契约都有对应的测试任务
- [X] 所有数据模型实体都有创建任务
- [X] 所有测试在实现任务之前
- [X] 并行任务确实独立无依赖
- [X] 每个任务都指定了确切的文件路径
- [X] 没有任务修改与其他 [P] 任务相同的文件

## 成功标准

该功能的所有任务完成后应达到：
- [ ] 用户可以注册登录并管理个人简历
- [ ] 支持按目标岗位分类管理简历版本
- [ ] 支持文件上传（PDF/Word）和在线富文本编辑
- [ ] 支持简历元数据（备注、标签）的查看和编辑
- [ ] 所有类型简历（文件/在线）都可以编辑元数据
- [ ] 简历卡片正确显示标签和备注信息
- [ ] 支持投递记录管理
- [ ] 界面采用暗黑主题设计，响应式布局
- [ ] 所有API响应时间 < 200ms (p95)
- [ ] **测试覆盖率 ≥ 80%（后端和前端）**
- [ ] **所有契约测试100%通过（无401错误）**
- [ ] **所有单元测试100%通过**
- [ ] **集成测试通过率 ≥ 90%**
- [ ] **E2E测试100%通过**
- [ ] **权限隔离正确实施（用户无法访问他人资源）**
- [ ] 通过quickstart.md中的所有验收场景

### Phase 3.16特定成功标准

- [ ] 后端代码覆盖率：Statements ≥ 80%, Branches ≥ 80%, Functions ≥ 80%, Lines ≥ 80%
- [ ] 前端代码覆盖率：Statements ≥ 80%, Branches ≥ 80%, Functions ≥ 80%, Lines ≥ 80%
- [ ] 后端单元测试：100%通过（当前92.6%）
- [ ] 后端集成测试：≥90%通过（当前51.9%）
- [ ] 后端契约测试：100%通过（当前15.2%）
- [ ] 前端单元测试：100%通过（当前92.5%）
- [ ] 前端E2E测试：100%通过（当前未执行）
- [ ] 无安全漏洞：所有用户资源正确隔离
- [ ] 测试环境完善：自动化测试可一键执行

---
*基于ResuOpti项目宪法v1.0.0和Phase 1设计文档生成的详细实施任务*