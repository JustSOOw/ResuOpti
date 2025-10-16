# E2E 测试说明

## 概述

本目录包含使用 Cypress 编写的端到端（E2E）测试，用于测试 ResuOpti 应用的完整用户场景。

## 测试文件

- `user-journey.cy.ts` - 完整的用户旅程测试，从注册到创建简历的全流程
- `resume-management.cy.ts` - 简历管理E2E测试，包括编辑、导出、元数据和投递记录管理

## 前置条件

在运行E2E测试之前，确保：

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动后端服务**
   - 后端API应该运行在 `http://localhost:3000/api/v1`
   - 数据库已正确配置并运行

3. **启动前端应用**
   ```bash
   npm run dev
   ```
   - 前端应用应该运行在 `http://localhost:5173`

## 运行测试

### 交互式模式（推荐用于开发）

交互式模式提供可视化界面，可以实时查看测试执行过程，支持时间旅行调试。

```bash
npm run cypress:open
# 或
npm run test:e2e:open
```

打开后：
1. 选择 "E2E Testing"
2. 选择浏览器（推荐使用 Chrome）
3. 点击要运行的测试文件

### 命令行模式（推荐用于CI/CD）

命令行模式在无头浏览器中运行，生成视频和截图。

```bash
npm run cypress:run
# 或
npm run test:e2e
```

### 运行特定测试文件

```bash
npx cypress run --spec "tests/e2e/user-journey.cy.ts"
```

### 在特定浏览器中运行

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

## 测试配置

配置文件位于 `/frontend/cypress.config.ts`

主要配置项：
- `baseUrl`: 前端应用URL（默认：http://localhost:5173）
- `env.apiUrl`: 后端API URL（默认：http://localhost:3000/api/v1）
- `viewportWidth/Height`: 浏览器视口大小
- `defaultCommandTimeout`: 命令默认超时时间

## 测试结果

### 视频和截图

测试运行后会生成：
- 📹 **视频**：`cypress/videos/` - 完整的测试执行视频
- 📸 **截图**：`cypress/screenshots/` - 失败测试的截图

这些文件已添加到 `.gitignore`，不会提交到版本控制。

### 测试报告

在命令行模式下，终端会显示：
- ✅ 通过的测试数量
- ❌ 失败的测试详情
- ⏱️ 每个测试的执行时间

## 调试测试

### 在交互式模式中调试

1. 使用 `cy.pause()` 暂停测试执行
2. 在 Cypress Test Runner 中点击命令查看DOM快照
3. 使用时间旅行功能回到任意测试步骤

### 在代码中添加调试信息

```typescript
cy.log('当前URL:', window.location.href)
cy.debug()  // 暂停并打开开发者工具
cy.screenshot('调试截图')  // 手动截图
```

## 常见问题

### 测试超时

如果测试频繁超时：
1. 检查前端和后端服务是否正常运行
2. 增加 `cypress.config.ts` 中的超时设置
3. 检查网络连接

### 元素未找到

如果测试找不到元素：
1. 在交互式模式下运行，查看DOM结构
2. 检查选择器是否正确
3. 考虑添加 `data-cy` 属性到组件
4. 增加等待时间或使用 `cy.wait()`

### API请求失败

如果API请求失败：
1. 检查后端服务是否运行
2. 检查 `env.apiUrl` 配置
3. 在浏览器开发者工具中检查网络请求
4. 检查CORS配置

## 最佳实践

### 1. 使用data-cy属性

在Vue组件中添加：
```vue
<el-button data-cy="create-position-btn">创建岗位</el-button>
```

在测试中使用：
```typescript
cy.get('[data-cy="create-position-btn"]').click()
```

### 2. 等待API响应

```typescript
cy.intercept('GET', '**/api/v1/positions').as('getPositions')
cy.wait('@getPositions')
```

### 3. 使用自定义命令

在 `tests/support/commands.ts` 中定义可重用的命令。

### 4. 保持测试独立

每个测试应该能够独立运行，不依赖其他测试的结果。

## 环境变量

可以通过环境变量覆盖配置：

```bash
CYPRESS_BASE_URL=http://localhost:8080 npm run cypress:run
```

或在 `cypress.env.json` 中设置（不要提交到git）：

```json
{
  "apiUrl": "http://localhost:3000/api/v1",
  "testUser": {
    "email": "test@example.com",
    "password": "Test123456!"
  }
}
```

## CI/CD 集成

在CI/CD环境中运行测试的示例（GitHub Actions）：

```yaml
- name: Install dependencies
  run: npm ci

- name: Start backend
  run: npm run start:backend &

- name: Start frontend
  run: npm run dev &

- name: Wait for services
  run: npx wait-on http://localhost:3000 http://localhost:5173

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: cypress-videos-screenshots
    path: |
      frontend/cypress/videos
      frontend/cypress/screenshots
```

## 维护测试

### 更新测试数据

如果API或UI发生变化，需要更新：
1. 测试中的选择器
2. API端点URL
3. 预期的响应数据结构
4. 测试断言

### 添加新测试

1. 创建新的 `.cy.ts` 文件在 `tests/e2e/` 目录
2. 遵循现有的测试结构和命名规范
3. 添加适当的注释和文档
4. 确保测试是幂等的（可重复运行）

## 参考资源

- [Cypress 官方文档](https://docs.cypress.io/)
- [Cypress 最佳实践](https://docs.cypress.io/guides/references/best-practices)
- [Cypress TypeScript 支持](https://docs.cypress.io/guides/tooling/typescript-support)
- [Element Plus 测试](https://element-plus.org/zh-CN/guide/dev-guide.html#%E6%B5%8B%E8%AF%95)

## 联系和支持

如果遇到问题或需要帮助，请：
1. 查看测试代码中的注释和TODO标记
2. 检查视频和截图了解失败原因
3. 在项目中提issue或联系团队成员