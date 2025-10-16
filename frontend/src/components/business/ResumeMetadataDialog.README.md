# ResumeMetadataDialog 组件文档

## 概述

`ResumeMetadataDialog` 是一个用于编辑简历元数据（备注和标签）的对话框组件。支持多行文本备注输入和标签管理功能。

## 功能特性

- ✅ **备注编辑**：支持最多2000字符的多行文本输入
- ✅ **标签管理**：添加、删除标签，最多20个标签，每个最多50字符
- ✅ **表单验证**：实时验证字段长度和数量限制
- ✅ **字符计数**：显示备注字符数和标签数量提示
- ✅ **标签示例**：提供常用标签示例供参考
- ✅ **响应式设计**：适配桌面和移动端
- ✅ **暗黑主题**：支持暗黑模式

## Props 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `visible` | `boolean` | 是 | - | 是否显示对话框（支持 v-model） |
| `resumeId` | `string` | 是 | - | 简历ID，用于API调用 |
| `resumeTitle` | `string` | 否 | `''` | 简历标题，显示在对话框标题中 |
| `initialNotes` | `string` | 否 | `''` | 初始备注内容 |
| `initialTags` | `string[]` | 否 | `[]` | 初始标签列表 |

## Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:visible` | `(value: boolean)` | 对话框显示状态变化 |
| `success` | - | 元数据更新成功 |
| `cancel` | - | 用户取消操作 |

## 使用示例

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ResumeMetadataDialog from '@/components/business/ResumeMetadataDialog.vue'

const showDialog = ref(false)
const resumeId = ref('resume-123')

const handleSuccess = () => {
  console.log('更新成功')
  // 刷新简历列表
}
</script>

<template>
  <el-button @click="showDialog = true">编辑元数据</el-button>

  <ResumeMetadataDialog
    v-model:visible="showDialog"
    :resume-id="resumeId"
    @success="handleSuccess"
  />
</template>
```

### 带初始数据

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ResumeMetadataDialog from '@/components/business/ResumeMetadataDialog.vue'

const showDialog = ref(false)
const resume = ref({
  id: 'resume-123',
  title: '前端开发工程师简历',
  notes: '针对阿里巴巴定制',
  tags: ['React', 'TypeScript']
})
</script>

<template>
  <ResumeMetadataDialog
    v-model:visible="showDialog"
    :resume-id="resume.id"
    :resume-title="resume.title"
    :initial-notes="resume.notes"
    :initial-tags="resume.tags"
    @success="handleSuccess"
  />
</template>
```

### 完整示例（带错误处理）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ResumeMetadataDialog from '@/components/business/ResumeMetadataDialog.vue'

const showDialog = ref(false)
const resumeData = ref({
  id: 'resume-123',
  title: '前端开发工程师简历',
  notes: '这是一份针对大厂的简历',
  tags: ['React', 'Vue', 'Node.js']
})

const handleSuccess = () => {
  ElMessage.success('元数据更新成功！')
  // 刷新简历数据
  refreshResumeData()
}

const handleCancel = () => {
  console.log('用户取消了编辑')
}

const refreshResumeData = async () => {
  // 重新获取简历数据
  // await fetchResumeData()
}
</script>

<template>
  <div>
    <el-button type="primary" @click="showDialog = true">
      编辑元数据
    </el-button>

    <ResumeMetadataDialog
      v-model:visible="showDialog"
      :resume-id="resumeData.id"
      :resume-title="resumeData.title"
      :initial-notes="resumeData.notes"
      :initial-tags="resumeData.tags"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>
```

## 验证规则

### 备注验证
- 最大长度：2000个字符
- 允许空值
- 自动去除首尾空格

### 标签验证
- 最大数量：20个
- 单个标签最大长度：50个字符
- 不允许重复标签
- 自动去除首尾空格
- 空字符串会被忽略

## API 调用

组件内部调用 `updateResume` API：

```typescript
await updateResume(resumeId, {
  notes: notes.trim() || null,
  tags: tags
})
```

## 样式定制

组件使用 CSS 变量，支持主题定制：

```scss
// 可以通过以下变量定制样式
--el-color-primary: #409eff;
--el-text-color-primary: #303133;
--el-fill-color-light: #f0f2f5;
// ...更多 Element Plus 主题变量
```

## 注意事项

1. **表单验证**：提交前会自动验证所有字段
2. **状态管理**：打开对话框时会重置表单为初始值
3. **错误处理**：API 调用失败会显示错误提示
4. **关闭行为**：点击遮罩层和按 ESC 不会关闭对话框（防止误操作）
5. **提交状态**：提交时按钮会显示 loading 状态

## 依赖

- Element Plus
- Vue 3 Composition API
- `@/services/resumes` (API 服务)

## 相关组件

- `ResumeCard.vue` - 简历卡片组件（显示元数据）
- `PositionDetailView.vue` - 岗位详情页（集成此组件）

## 更新历史

- **v1.0.0** (2025-10-02)
  - 初始版本
  - 支持备注和标签编辑
  - 完整的表单验证
  - 响应式设计和暗黑主题支持
