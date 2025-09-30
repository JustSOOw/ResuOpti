# E2E测试快速入门

## 第一次运行测试

### 1. 安装Cypress

```bash
cd frontend
npm install
```

这会安装所有依赖，包括Cypress。

### 2. 启动应用

**终端1 - 启动后端：**
```bash
cd backend
npm run dev
```

**终端2 - 启动前端：**
```bash
cd frontend
npm run dev
```

确保：
- 后端运行在：http://localhost:3000
- 前端运行在：http://localhost:5173

### 3. 运行测试

**选项A：交互式模式（推荐首次运行）**
```bash
cd frontend
npm run cypress:open
```

然后：
1. 点击 "E2E Testing"
2. 选择浏览器（推荐Chrome）
3. 点击 `user-journey.cy.ts` 文件

你会看到测试在浏览器中实时执行！

**选项B：命令行模式**
```bash
cd frontend
npm run cypress:run
```

测试会在后台运行，完成后会显示结果。

## 测试内容

`user-journey.cy.ts` 测试包含：

### 场景1：新用户完整流程
1. ✅ 注册新用户
2. ✅ 自动登录
3. ✅ 创建目标岗位
4. ✅ 创建在线简历
5. ✅ 编辑简历内容
6. ✅ 保存并验证

### 场景2：已有用户操作
1. ✅ 用户登录
2. ✅ 查看已有数据
3. ✅ 编辑简历
4. ✅ 退出登录

## 查看结果

### 成功的测试
- 显示绿色的勾号 ✅
- 每个步骤都会显示通过状态

### 失败的测试
- 显示红色的叉号 ❌
- 自动截图保存在 `cypress/screenshots/`
- 视频保存在 `cypress/videos/`

## 常见问题排查

### 问题1：Cypress打不开或安装失败

**解决方案：**
```bash
# 清除缓存重新安装
rm -rf node_modules
npm cache clean --force
npm install
```

### 问题2：测试找不到元素

**可能原因：**
- 前端UI可能还未完全实现
- 选择器需要根据实际UI调整

**解决方案：**
1. 在交互式模式下运行
2. 查看DOM结构
3. 更新测试中的选择器

### 问题3：API请求失败

**检查清单：**
- [ ] 后端是否运行？访问 http://localhost:3000/api/v1/health
- [ ] 数据库是否连接？检查后端日志
- [ ] CORS配置是否正确？

### 问题4：测试超时

**解决方案：**
```typescript
// 在cypress.config.ts中增加超时时间
defaultCommandTimeout: 15000,  // 从10000增加到15000
```

## 下一步

### 为前端组件添加测试标识

在Vue组件中添加 `data-cy` 属性，使测试更稳定：

```vue
<!-- Before -->
<el-button>创建岗位</el-button>

<!-- After -->
<el-button data-cy="create-position-btn">创建岗位</el-button>
```

然后在测试中使用：
```typescript
cy.get('[data-cy="create-position-btn"]').click()
```

### 添加更多测试

参考 `user-journey.cy.ts` 的结构，创建新的测试文件：
- `resume-export.cy.ts` - 测试简历导出功能
- `position-management.cy.ts` - 测试岗位管理
- `profile.cy.ts` - 测试用户配置

### 集成到CI/CD

在 `.github/workflows/e2e.yml` 中添加：
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E tests
        run: |
          npm ci
          npm run test:e2e
```

## 获取帮助

- 📖 查看 `/frontend/tests/e2e/README.md` 了解详细文档
- 💡 查看测试代码中的注释和TODO
- 🔍 使用 Cypress 官方文档：https://docs.cypress.io
- 🐛 遇到bug？查看视频和截图了解具体情况

## 测试最佳实践

1. **始终等待API响应**
   ```typescript
   cy.intercept('GET', '/api/positions').as('getPositions')
   cy.wait('@getPositions')
   ```

2. **使用明确的断言**
   ```typescript
   cy.get('[data-cy="position-title"]')
     .should('be.visible')
     .and('contain', '前端工程师')
   ```

3. **保持测试独立**
   - 每个测试应该能单独运行
   - 不依赖其他测试的结果

4. **使用有意义的测试描述**
   ```typescript
   it('用户应该能够成功创建新岗位并在列表中看到它', () => {
     // 测试代码
   })
   ```

祝测试顺利！ 🎉