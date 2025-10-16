# 技术研究报告：个人简历管理平台

**功能**: 001-resume-management-platform
**日期**: 2025-09-29
**状态**: 完成

## 技术栈决策

### 1. 文件上传与存储
**决策**: Multer + 本地文件系统存储
**理由**:
- Multer是Express.js生态中最成熟的文件上传中间件，支持进度监控
- 本地文件系统存储成本最低，适合个人项目
- 支持10MB文件大小限制配置
- 原生支持PDF/Word文件类型验证

**考虑的替代方案**:
- AWS S3: 成本较高，个人项目不必要
- Cloudinary: 主要面向图片处理，对文档支持有限

**实现要点**:
- 使用multer配置文件类型白名单(.pdf, .docx, .doc)
- 设置文件大小限制10MB
- 实现上传进度API端点
- 文件存储路径: backend/uploads/{userId}/{targetPositionId}/

### 2. 富文本编辑器
**决策**: Tiptap + Element Plus
**理由**:
- Tiptap是专为Vue设计的现代富文本编辑器，基于ProseMirror
- 支持Vue 3 Composition API，响应式数据绑定天然支持
- 高度可定制，支持插件扩展，暗黑主题适配容易
- 内容导出PDF可通过@tiptap/extension-print或html2pdf.js实现
- Element Plus提供完整的组件生态，开发效率高

**考虑的替代方案**:
- Vue-Quill: 功能相对简单，定制性不如Tiptap
- TinyMCE: 功能过于复杂，体积大，Vue集成复杂

**实现要点**:
- 配置基础扩展：粗体、斜体、链接、图片、列表、表格
- 图片上传集成到文件上传系统
- PDF导出使用html2pdf.js或服务端Puppeteer
- 暗黑主题样式定制

### 3. 用户认证系统
**决策**: JWT + bcrypt + express-rate-limit
**理由**:
- JWT无状态，适合前后端分离架构
- bcrypt是行业标准的密码哈希方案
- express-rate-limit防止暴力破解

**考虑的替代方案**:
- Session-based auth: 需要额外存储，增加复杂度
- OAuth: 个人项目不需要第三方登录

**实现要点**:
- JWT过期时间：24小时
- 密码最小长度8位，包含数字和字母
- 登录失败限制：5次/15分钟
- 邮箱格式验证使用validator.js

### 4. 数据库设计
**决策**: PostgreSQL + Sequelize ORM
**理由**:
- PostgreSQL稳定可靠，支持JSON字段存储标签数据
- Sequelize是Node.js中最成熟的ORM，支持迁移和种子数据
- 天然支持用户数据隔离

**考虑的替代方案**:
- MongoDB: 文档数据库不适合关系型数据结构
- MySQL: 功能相近，但PostgreSQL的JSON支持更好

**实现要点**:
- 用户表：id, email, password_hash, created_at
- 目标岗位表：id, user_id, name, description, created_at
- 简历版本表：id, target_position_id, type(file/online), content/file_path, created_at
- 简历元数据表：id, resume_id, notes, tags(JSON), created_at
- 投递记录表：id, resume_id, company, apply_date, status, notes

### 5. 暗黑主题实现
**决策**: Element Plus暗黑主题 + CSS变量自定义
**理由**:
- Element Plus内置完整的暗黑主题支持，一键切换
- CSS变量配合Vue 3 Composition API实现主题状态管理
- 性能优异，无运行时开销
- 易于维护和扩展

**考虑的替代方案**:
- 纯CSS变量: 需要大量自定义工作
- Vuetify: 组件风格与项目需求不够匹配

**实现要点**:
- 使用Element Plus的暗黑模式类名切换
- 自定义CSS变量覆盖默认主题色
- Pinia存储主题偏好，持久化到localStorage
- 支持系统主题自动检测

### 6. 低成本部署方案
**决策**: Railway.app + PostgreSQL addon
**理由**:
- Railway提供$5/月的免费额度，够个人项目使用
- 内置PostgreSQL支持，一键部署
- 支持文件存储，无需额外配置
- 自动HTTPS和域名支持

**考虑的替代方案**:
- Vercel: 主要面向静态站点，Node.js支持有限
- Heroku: 免费套餐已取消
- DigitalOcean: 需要自行配置，维护成本高

**实现要点**:
- 使用Docker容器化部署
- 环境变量配置数据库连接
- 文件上传目录需要持久化存储配置

## 性能优化策略

### 前端优化
- 路由懒加载，减少初始包体积
- 文件上传使用分片上传，提升大文件传输稳定性
- 图片压缩和缓存策略

### 后端优化
- 数据库连接池配置
- API响应缓存 (Redis，可选)
- 文件访问使用nginx代理 (生产环境)

## 安全考虑

### 输入验证
- 文件类型魔数检查，防止文件类型伪造
- 文件名过滤，防止路径遍历攻击
- SQL注入防护 (Sequelize自动处理)

### 数据保护
- 密码哈希使用salt值
- JWT secret使用强随机字符串
- CORS配置限制来源域名

## Vue 3技术栈详细设计

### 前端整体架构
**决策**: Vue 3 + TypeScript + Vite + Element Plus + Pinia
**理由**:
- Vue 3 Composition API提供更好的代码组织和复用能力
- TypeScript提供类型安全，减少运行时错误
- Vite构建速度快，开发体验优秀
- Element Plus提供完整的组件库和暗黑主题
- Pinia作Vue 3官方推荐的状态管理库

**项目结构详细**:
```
frontend/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── common/         # 通用组件
│   │   ├── forms/          # 表单组件
│   │   └── business/       # 业务组件
│   ├── views/             # 页面组件
│   │   ├── auth/           # 登录注册页面
│   │   ├── dashboard/      # 主仪表板
│   │   ├── positions/      # 目标岗位管理
│   │   └── editor/         # 简历编辑器
│   ├── composables/       # Composition API逻辑复用
│   │   ├── useAuth.ts      # 认证相关
│   │   ├── useFileUpload.ts # 文件上传
│   │   └── useTheme.ts     # 主题切换
│   ├── stores/            # Pinia状态管理
│   │   ├── auth.ts         # 用户状态
│   │   ├── positions.ts    # 岗位数据
│   │   └── theme.ts        # 主题状态
│   ├── services/          # API调用服务
│   │   ├── api.ts          # 基础API配置
│   │   ├── auth.ts         # 认证API
│   │   ├── positions.ts    # 岗位 API
│   │   └── resumes.ts      # 简历API
│   ├── utils/             # 工具函数
│   │   ├── request.ts      # HTTP请求封装
│   │   ├── validation.ts   # 表单验证
│   │   └── file.ts         # 文件处理
│   ├── styles/            # 样式文件
│   │   ├── variables.scss  # 样式变量
│   │   ├── theme.scss      # 主题样式
│   │   └── global.scss     # 全局样式
│   ├── router/            # 路由配置
│   │   └── index.ts
│   ├── types/             # TypeScript类型定义
│   └── main.ts            # 入口文件
└── tests/
    ├── unit/              # 组件单元测试
    └── e2e/               # 端到端测试
```

**核心依赖列表**:
- **vue**: ^3.4.0 - 核心框架
- **typescript**: ^5.0.0 - 类型支持
- **vite**: ^5.0.0 - 构建工具
- **element-plus**: ^2.4.0 - UI组件库
- **@element-plus/icons-vue**: ^2.3.0 - 图标库
- **pinia**: ^2.1.0 - 状态管理
- **vue-router**: ^4.2.0 - 路由管理
- **@tiptap/vue-3**: ^2.1.0 - 富文本编辑器
- **@tiptap/starter-kit**: ^2.1.0 - 基础编辑器功能
- **axios**: ^1.6.0 - HTTP客户端
- **html2pdf.js**: ^0.10.0 - PDF导出
- **@vueuse/core**: ^10.5.0 - Vue工具集
- ESLint + Prettier 代码规范
- Jest + Supertest 测试框架
- Husky Git hooks 提交前检查
- TypeScript 类型安全 (推荐但可选)

---
*所有技术决策基于低成本、易维护、功能完整的原则*