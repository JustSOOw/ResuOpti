# 数据库种子数据 (Seeders)

## 概述

本目录包含用于开发和测试环境的种子数据脚本。这些脚本会创建演示用户账号和示例数据，方便开发和测试使用。

## 文件结构

```
seeders/
├── index.js                   # 主执行脚本
├── 01-demo-user.js            # 演示用户数据
├── 02-demo-positions.js       # 目标岗位数据
├── 03-demo-resumes.js         # 简历版本数据
├── 04-demo-applications.js    # 投递记录数据
└── README.md                  # 本文档
```

## 使用方法

### 1. 执行所有种子数据

```bash
# 在项目根目录执行
node backend/src/seeders/index.js
```

或者在 backend 目录下执行:

```bash
cd backend
node src/seeders/index.js
```

### 2. 回滚种子数据

```bash
node backend/src/seeders/index.js rollback
```

或者:

```bash
node backend/src/seeders/index.js down
```

## 演示账号信息

执行种子数据后，会创建以下演示账号：

- **邮箱**: demo@resumopti.com
- **密码**: Demo1234

## 创建的示例数据

### 1. 用户数据 (1条)
- 演示用户: demo@resumopti.com

### 2. 目标岗位数据 (3条)
- 前端开发工程师
- 后端开发工程师
- 全栈开发工程师

### 3. 简历版本数据 (3条)
- 前端开发-互联网大厂版 (在线简历)
- 后端开发-微服务架构版 (文件简历)
- 全栈开发-创业公司版 (在线简历)

### 4. 简历元数据 (3条)
- 每个简历版本都有对应的备注和标签

### 5. 投递记录数据 (6条)
- 不同状态的投递记录:
  - 已投递
  - 面试邀请
  - 已拒绝
  - 已录用

## 注意事项

### ⚠️ 环境限制

种子数据**仅用于开发和测试环境**，不要在生产环境运行！

### 📋 执行前提

1. 确保数据库已创建并正确配置
2. 确保已运行数据库迁移 (migrations)
3. 确保 `.env` 文件中数据库配置正确

### 🔄 执行顺序

种子数据脚本必须按照以下顺序执行：

```
01-demo-user.js
    ↓
02-demo-positions.js
    ↓
03-demo-resumes.js
    ↓
04-demo-applications.js
```

主脚本 `index.js` 会自动按此顺序执行。

### 🗑️ 清理数据

如果需要清理种子数据，运行回滚命令：

```bash
node backend/src/seeders/index.js rollback
```

回滚操作会按相反顺序删除所有演示数据。

## 开发指南

### 添加新的种子数据

1. 在 `seeders/` 目录下创建新文件，命名格式: `05-your-seeder-name.js`
2. 实现 `up` 和 `down` 两个方法
3. 在 `index.js` 中引入并添加到执行队列

### 种子数据模板

```javascript
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 插入数据的逻辑
    await queryInterface.bulkInsert('table_name', [
      {
        id: uuidv4(),
        // ... 其他字段
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    console.log('✅ 数据创建成功');
  },

  down: async (queryInterface, Sequelize) => {
    // 删除数据的逻辑
    await queryInterface.bulkDelete('table_name', {
      // 删除条件
    }, {});

    console.log('🗑️  数据已删除');
  }
};
```

## 故障排查

### 问题: 数据库连接失败

**解决方案**: 检查 `.env` 文件中的数据库配置是否正确，确保数据库服务已启动。

### 问题: 表不存在错误

**解决方案**: 确保已运行所有数据库迁移:

```bash
cd backend
npx sequelize-cli db:migrate
```

### 问题: 邮箱重复错误

**解决方案**: 演示用户可能已存在，先运行回滚命令清理数据:

```bash
node backend/src/seeders/index.js rollback
```

## 相关命令

```bash
# 运行数据库迁移
npx sequelize-cli db:migrate

# 回滚数据库迁移
npx sequelize-cli db:migrate:undo

# 执行种子数据
node backend/src/seeders/index.js

# 回滚种子数据
node backend/src/seeders/index.js rollback
```

---

*最后更新: 2025-09-30*