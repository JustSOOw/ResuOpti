# 契约测试Token更新状态

## 已更新的文件

### ✅ 完全更新
1. **target-positions-get.test.js** - 已添加token生成器，使用generateQuickTestAuth()
2. **target-positions-post.test.js** - 已添加token生成器，使用generateQuickTestAuth()
3. **target-positions-delete.test.js** - 已添加token生成器和UUID生成，使用generateQuickTestAuth()

### 需要更新的文件模式

所有剩余文件需要以下更改：

#### 1. 添加imports（在文件顶部）
```javascript
const { generateQuickTestAuth } = require('../utils/auth-helper');
// 如果需要生成UUID，还要添加：
const { v4: uuidv4 } = require('uuid');
```

#### 2. 替换硬编码token（在describe块内）
```javascript
// 旧代码（删除）：
const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

// 新代码（添加）：
let validToken;
let testUser;

beforeAll(() => {
  const auth = generateQuickTestAuth();
  testUser = auth.user;
  validToken = auth.token;
});
```

### ⏳ 待更新文件列表

4. target-positions-get-by-id.test.js
5. target-positions-put.test.js
6. resumes-post.test.js
7. resumes-upload.test.js
8. resumes-put-metadata.test.js

### ✅ 无需更新
- auth-register.test.js （注册API不需要token）
- auth-login.test.js （登录API不需要token）

## 更新原理

使用token-generator.js生成的token是基于环境变量JWT_SECRET签名的有效token，可以通过后端的JWT认证中间件验证。

### 关键优势
1. **有效性**：token使用真实的JWT密钥签名
2. **灵活性**：可以自定义用户ID和email
3. **可维护性**：集中管理token生成逻辑
4. **测试隔离**：每个测试可以生成独立的用户和token

## 验证方法

运行契约测试验证401错误是否消失：
```bash
npm test -- tests/contract/
```

预期结果：所有认证相关的测试应该通过，不再出现401 Unauthorized错误。
