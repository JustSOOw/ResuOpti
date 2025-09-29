# 数据模型设计：个人简历管理平台

**功能**: 001-resume-management-platform
**日期**: 2025-09-29
**版本**: 1.0

## 实体关系图

```
用户 (User)
    ↓ 1:N
目标岗位 (TargetPosition)
    ↓ 1:N
简历版本 (ResumeVersion)
    ↓ 1:1
简历元数据 (ResumeMetadata)
    ↓ 1:N
投递记录 (ApplicationRecord)
```

## 实体详细定义

### 1. 用户 (User)
**用途**: 存储平台用户的基本信息和认证凭据

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 用户唯一标识 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱地址，用作登录账号 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希值，使用bcrypt加密 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 账户创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

**验证规则**:
- 邮箱格式验证：符合RFC 5322标准
- 密码要求：最少8位，包含字母和数字
- 邮箱唯一性检查

**业务规则**:
- 用户删除时，级联删除所有关联数据
- 密码修改时，旧密码验证必须通过

### 2. 目标岗位 (TargetPosition)
**用途**: 用户创建的简历分类，按求职方向组织简历版本

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 岗位分类唯一标识 |
| user_id | UUID | FOREIGN KEY, NOT NULL | 所属用户ID |
| name | VARCHAR(100) | NOT NULL | 岗位名称，如"前端开发"、"产品经理" |
| description | TEXT | NULLABLE | 岗位描述或备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

**验证规则**:
- 岗位名称长度：1-100字符
- 同一用户下岗位名称不可重复

**业务规则**:
- 删除岗位时，必须先确认该岗位下无简历版本
- 支持岗位重命名操作

### 3. 简历版本 (ResumeVersion)
**用途**: 存储具体的简历实例，支持文件上传和在线创建两种类型

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 简历版本唯一标识 |
| target_position_id | UUID | FOREIGN KEY, NOT NULL | 所属目标岗位ID |
| type | ENUM('file', 'online') | NOT NULL | 简历类型：file=上传文件，online=在线创建 |
| title | VARCHAR(200) | NOT NULL | 简历标题，用户可自定义 |
| file_path | VARCHAR(500) | NULLABLE | 文件存储路径（type=file时必填） |
| file_name | VARCHAR(255) | NULLABLE | 原始文件名 |
| file_size | INTEGER | NULLABLE | 文件大小（字节） |
| content | TEXT | NULLABLE | 富文本内容（type=online时必填） |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

**验证规则**:
- 文件类型限制：.pdf, .docx, .doc
- 文件大小限制：≤10MB (10,485,760 字节)
- 标题长度：1-200字符
- 类型验证：file类型必须有file_path，online类型必须有content

**业务规则**:
- 文件上传失败时，数据库记录不创建
- 在线内容支持自动保存功能
- 支持PDF导出（仅online类型）

### 4. 简历元数据 (ResumeMetadata)
**用途**: 存储简历版本的附加信息，包括备注和自定义标签

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 元数据唯一标识 |
| resume_id | UUID | FOREIGN KEY, NOT NULL | 所属简历版本ID |
| notes | TEXT | NULLABLE | 用户备注，支持富文本 |
| tags | JSON | DEFAULT '[]' | 自定义标签数组，如["技术重点", "XX公司定制"] |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

**验证规则**:
- 备注长度：≤2000字符
- 标签格式：字符串数组，每个标签≤50字符
- 标签数量：≤20个

**业务规则**:
- 与简历版本一对一关系，简历创建时自动创建
- 标签支持模糊搜索和筛选功能
- 备注支持基本Markdown格式

### 5. 投递记录 (ApplicationRecord)
**用途**: 记录简历的投递历史和状态跟踪

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 投递记录唯一标识 |
| resume_id | UUID | FOREIGN KEY, NOT NULL | 关联的简历版本ID |
| company_name | VARCHAR(200) | NOT NULL | 目标公司名称 |
| position_title | VARCHAR(200) | NULLABLE | 具体职位名称 |
| apply_date | DATE | NOT NULL | 投递日期 |
| status | ENUM('已投递', '面试邀请', '已拒绝', '已录用') | DEFAULT '已投递' | 当前状态 |
| notes | TEXT | NULLABLE | 投递备注，面试反馈等 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 记录创建时间 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 最后更新时间 |

**验证规则**:
- 公司名称长度：1-200字符
- 投递日期：不能为未来日期
- 状态值：必须为预定义枚举值之一

**业务规则**:
- 同一简历可以有多个投递记录
- 支持按状态和日期筛选查询
- 状态变更时记录更新时间

## 数据库约束和索引

### 主键约束
所有表使用UUID作为主键，确保分布式环境下的唯一性

### 外键约束
```sql
-- 目标岗位 -> 用户
ALTER TABLE target_positions ADD CONSTRAINT fk_target_position_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 简历版本 -> 目标岗位
ALTER TABLE resume_versions ADD CONSTRAINT fk_resume_target_position
  FOREIGN KEY (target_position_id) REFERENCES target_positions(id) ON DELETE CASCADE;

-- 简历元数据 -> 简历版本
ALTER TABLE resume_metadata ADD CONSTRAINT fk_metadata_resume
  FOREIGN KEY (resume_id) REFERENCES resume_versions(id) ON DELETE CASCADE;

-- 投递记录 -> 简历版本
ALTER TABLE application_records ADD CONSTRAINT fk_application_resume
  FOREIGN KEY (resume_id) REFERENCES resume_versions(id) ON DELETE CASCADE;
```

### 性能索引
```sql
-- 用户查询优化
CREATE INDEX idx_users_email ON users(email);

-- 按用户查询岗位
CREATE INDEX idx_target_positions_user_id ON target_positions(user_id);

-- 按岗位查询简历
CREATE INDEX idx_resume_versions_target_position_id ON resume_versions(target_position_id);

-- 按简历查询投递记录
CREATE INDEX idx_application_records_resume_id ON application_records(resume_id);

-- 按状态筛选投递记录
CREATE INDEX idx_application_records_status ON application_records(status);

-- 按投递日期排序
CREATE INDEX idx_application_records_apply_date ON application_records(apply_date);
```

## 数据隔离策略

### 行级安全 (Row Level Security)
所有查询必须包含用户身份验证，确保用户只能访问自己的数据：

```sql
-- 示例：查询用户的目标岗位
SELECT * FROM target_positions WHERE user_id = :current_user_id;

-- 示例：查询用户的简历版本
SELECT rv.* FROM resume_versions rv
JOIN target_positions tp ON rv.target_position_id = tp.id
WHERE tp.user_id = :current_user_id;
```

### 应用层验证
- 所有API接口都需要JWT token验证
- 每个操作都验证资源所有权
- 敏感操作需要二次确认

---
*数据模型设计遵循第三范式，确保数据一致性和查询性能的平衡*