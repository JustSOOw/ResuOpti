
# Implementation Plan: 个人简历管理平台

**Branch**: `001-resume-management-platform` | **Date**: 2025-09-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/mnt/d/Users/JUSTsoo/Documents/aprojectCODE/ResuOpti/specs/001-/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
面向求职者的个人简历管理平台，提供基于"目标岗位"分类的简历版本管理，支持文件上传（PDF/Word）和在线创建，同时为每个简历版本提供备注、标签和投递记录管理功能。采用单仓库管理的单体Web架构，前端使用React/Vue，后端使用Node.js，数据层使用PostgreSQL，主打低成本易部署的全栈方案。

## Technical Context
**Language/Version**: Node.js LTS (18+), Vue 3 + TypeScript + Vite
**Primary Dependencies**: Express.js, PostgreSQL, Tiptap编辑器, Element Plus UI库, Pinia状态管理
**Storage**: PostgreSQL (关系数据), 文件系统存储 (简历文件)
**Testing**: Jest (单元测试), Cypress (E2E测试), Vitest (Vue组件测试)
**Target Platform**: Web应用程序，优先桌面端浏览器
**Project Type**: web - 前后端分离但单仓库管理
**Performance Goals**: API响应时间 <200ms (p95), 文件上传 ≤10MB, 页面加载 <3秒
**Constraints**: 低成本部署方案, 个人项目适用, 暗黑主题设计
**Scale/Scope**: 个人用户使用, 少量并发, 约20个API端点, 5-8个主要页面

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

基于ResuOpti项目宪法v1.0.0的检查项：

### I. 代码整洁度合规性
- [x] 架构设计遵循单一职责原则 - 按功能模块划分（认证、文件管理、简历管理）
- [x] 模块划分清晰，职责明确 - models/services/api 层次分明
- [x] 命名规范具有描述性 - 采用中文注释和有意义的英文命名
- [x] 避免重复代码和过度复杂的设计 - 单体架构简化设计

### II. 注释规范性合规性
- [x] 所有公共接口有完整的中文注释 - API文档将采用中文
- [x] 复杂业务逻辑有清晰的说明 - 文件上传和富文本编辑逻辑
- [x] API文档完整且准确 - 将生成OpenAPI规范

### III. 测试完整性合规性（非协商项）
- [x] 采用TDD方法，测试先行 - 将在Phase 1生成契约测试
- [x] 单元测试覆盖率目标≥80% - Jest测试框架设置
- [x] 关键业务流程有集成测试 - 用户注册登录、文件上传、简历创建流程
- [x] 所有测试可自动化执行 - 将配置CI/CD流程

### IV. 安全优先合规性
- [x] 用户输入验证和过滤机制 - 邮箱格式验证、文件类型限制
- [x] 敏感数据加密存储方案 - 密码哈希存储
- [x] API访问控制策略 - JWT Token认证机制
- [x] 无硬编码密钥或敏感信息 - 使用环境变量配置

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->
```
backend/
├── src/
│   ├── models/           # Sequelize数据模型
│   │   ├── User.js         # 用户模型
│   │   ├── TargetPosition.js # 目标岗位模型
│   │   ├── ResumeVersion.js  # 简历版本模型
│   │   ├── ResumeMetadata.js # 简历元数据模型
│   │   └── ApplicationRecord.js # 投递记录模型
│   ├── services/         # 业务逻辑服务层
│   │   ├── authService.js    # 认证服务
│   │   ├── positionService.js # 岗位管理服务
│   │   ├── resumeService.js  # 简历管理服务
│   │   └── fileService.js    # 文件处理服务
│   ├── api/              # REST API控制器
│   │   ├── auth/           # 认证相关API
│   │   ├── positions/      # 岗位管理API
│   │   └── resumes/        # 简历管理API
│   ├── middleware/       # Express中间件
│   │   ├── auth.js         # JWT验证中间件
│   │   ├── upload.js       # Multer文件上传
│   │   ├── validation.js   # 请求数据验证
│   │   └── error.js        # 错误处理
│   ├── utils/            # 工具函数
│   │   ├── logger.js       # 日志工具
│   │   ├── crypto.js       # 加密工具
│   │   └── response.js     # 响应格式化
│   └── config/           # 配置文件
│       ├── database.js     # 数据库配置
│       ├── jwt.js          # JWT配置
│       └── upload.js       # 文件上传配置
├── tests/
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── contract/         # API契约测试
├── uploads/              # 文件上传存储目录
└── package.json

frontend/
├── src/
│   ├── components/       # Vue组件
│   │   ├── common/         # 通用组件 (Header, Sidebar, Loading)
│   │   ├── forms/          # 表单组件 (LoginForm, PositionForm)
│   │   └── business/       # 业务组件 (ResumeCard, FileUpload)
│   ├── views/            # 页面组件
│   │   ├── auth/           # 登录注册页面
│   │   ├── dashboard/      # 主仪表板
│   │   ├── positions/      # 岗位管理页面
│   │   └── editor/         # Tiptap编辑器页面
│   ├── composables/      # Composition API复用逻辑
│   ├── stores/           # Pinia状态管理
│   ├── services/         # API服务层
│   ├── utils/            # 前端工具函数
│   ├── styles/           # SCSS样式文件
│   ├── router/           # Vue Router配置
│   ├── types/            # TypeScript类型定义
│   └── main.ts           # 应用入口
├── tests/
│   ├── unit/             # 组件单元测试 (Vitest)
│   └── e2e/              # E2E测试 (Cypress)
├── public/               # 静态资源
└── package.json

shared/
├── types/                # 前后端共享TypeScript类型
│   ├── user.ts           # 用户类型
│   ├── position.ts       # 岗位类型
│   └── resume.ts         # 简历类型
└── constants/            # 共享常量
    ├── api.ts            # API端点常量
    └── validation.ts     # 验证规则常量
```

**Structure Decision**: 选择Web应用程序结构，采用前后端分离但单仓库管理的模式。后端提供REST API服务，前端提供用户界面交互。共享类型定义确保前后端数据一致性。文件上传存储在backend/uploads目录，通过API提供访问。

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- 加载 `.specify/templates/tasks-template.md` 作为基本模板
- 从Phase 1设计文档生成任务 (contracts, data-model, quickstart)
- 每个API契约 → 契约测试任务 [P]
- 每个数据实体 → 模型创建任务 [P]
- 每个用户故事 → 集成测试任务
- 实现任务使测试通过 (遵循TDD原则)

**具体任务分类预期**:
1. **环境搭建任务** (5-6个):
   - 初始化项目结构 [P]
   - 配置开发环境 (Node.js, PostgreSQL) [P]
   - 设置构建工具 (Webpack, Vite) [P]
   - 配置代码质量工具 (ESLint, Prettier) [P]
   - 设置测试框架 (Jest, Cypress) [P]

2. **数据层任务** (8-10个):
   - 创建User模型和迁移 [P]
   - 创建TargetPosition模型 [P]
   - 创建ResumeVersion模型 [P]
   - 创建ResumeMetadata模型 [P]
   - 创建ApplicationRecord模型 [P]
   - 实现模型关系和约束
   - 数据库索引优化
   - 数据验证规则实现

3. **API后端任务** (12-15个):
   - 用户认证API (register, login) [P]
   - 目标岗位CRUD API [P]
   - 简历版本管理API [P]
   - 文件上传API和中间件
   - 富文本内容API
   - PDF导出API
   - 简历元数据API (备注, 标签)
   - 投递记录API
   - 数据验证中间件
   - 错误处理中间件
   - API限流和安全中间件

4. **Vue 3前端任务** (15-18个):
   - Vue 3 + Vite项目初始化配置 [P]
   - TypeScript和ESLint配置 [P]
   - Element Plus和暗黑主题集成 [P]
   - Vue Router路由配置 [P]
   - Pinia状态管理设置 [P]
   - 用户认证页面 (注册/登录) [P]
   - 主仪表板页面和布局 [P]
   - 目标岗位管理组件 [P]
   - 简历列表和卡片组件 [P]
   - 文件上传组件 (Multer集成)
   - Tiptap富文本编辑器集成
   - PDF导出功能 (html2pdf.js)
   - 简历元数据编辑组件 (备注、标签)
   - 投递记录表格组件
   - API调用服务层 (axios集成)
   - 认证状态管理 (JWT Token)
   - 响应式布局和暗黑主题样式
   - 错误处理和加载状态组件

**Ordering Strategy**:
- **TDD顺序**: 测试在实现之前
  - 契约测试 → API实现
  - 单元测试 → 组件实现
  - 集成测试 → 端到端功能
- **依赖顺序**: 模型 → 服务 → API → UI
- **并行标记**: 独立文件标记[P]可同时开发

**Estimated Output**: 35-40个编号任务在tasks.md中，按依赖关系排序

**IMPORTANT**: 此阶段由/tasks命令执行，不由/plan执行

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md 已创建
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md 已创建
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 任务生成策略已描述
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - 所有架构设计符合项目宪法要求
- [x] Post-Design Constitution Check: PASS - 设计文档完成后重新检查，无违规项
- [x] All NEEDS CLARIFICATION resolved - 技术栈和实现方案已明确
- [x] Complexity deviations documented - 无复杂度偏离

---
*基于ResuOpti项目宪法v1.0.0 - 详见 `.specify/memory/constitution.md`*
