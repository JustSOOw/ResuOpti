# 集成测试说明

## resumes.test.js - 简历版本管理集成测试

### 测试概述
该测试文件包含30个集成测试用例，覆盖简历版本管理的完整生命周期。

### 测试覆盖范围

#### 1. 创建文件类型简历 (6个测试)
- 成功创建file类型简历并自动创建metadata
- 验证title长度在1-200字符之间
- 验证file_path和file_name必填
- 验证file_size限制为0到10MB
- 验证targetPositionId存在性
- 验证权限控制

#### 2. 创建在线类型简历 (4个测试)
- 成功创建online类型简历并自动创建metadata
- 验证content必填且非空
- 验证title必填
- 自动trim标题空格

#### 3. 查询简历 (4个测试)
- 获取岗位下所有简历（空列表和多个简历）
- 获取单个简历详情（包含metadata）
- 验证简历存在性
- 验证权限控制

#### 4. 更新在线简历 (7个测试)
- 成功更新title
- 成功更新content
- 同时更新title和content
- 验证只能更新online类型
- 验证权限控制
- 验证title长度
- 验证content非空
- 验证更新数据必填

#### 5. 删除简历 (4个测试)
- 成功删除简历并级联删除metadata
- 验证简历存在性
- 验证权限控制
- 支持删除file类型简历

#### 6. 完整流程测试 (3个测试)
- 完整的创建->查询->更新->删除流程
- 一个岗位下管理多个简历
- 事务一致性验证

### 运行测试

#### 前置条件
1. PostgreSQL数据库已启动
2. 测试数据库已创建 (resumopti_test)
3. 环境变量已配置

#### 运行命令
```bash
# 运行所有集成测试
npm test tests/integration/

# 运行简历集成测试
npm test tests/integration/resumes.test.js

# 运行特定测试组
npm test tests/integration/resumes.test.js -t "创建文件类型简历"
```

### 测试特点
- 直接调用Service层函数，不依赖HTTP层
- 使用真实的PostgreSQL数据库
- 每个测试前自动清理数据
- 验证数据库事务一致性
- 全面的权限验证
- 覆盖边界条件和错误场景

### 依赖服务
- authService: 创建测试用户
- positionService: 创建测试岗位
- resumeService: 简历CRUD操作

### 数据清理策略
- beforeEach: 清理简历和岗位数据
- afterAll: 清理所有测试数据并关闭数据库连接
- 使用force:true确保级联删除
