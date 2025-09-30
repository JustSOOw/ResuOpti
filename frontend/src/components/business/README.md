# 业务通用组件

本目录包含ResuOpti项目的业务通用组件，这些组件封装了常用的业务逻辑，可在整个应用中复用。

## 组件列表

### 1. ResumeCard（简历卡片）

展示简历信息的卡片组件，包含标题、类型、创建时间、文件信息、标签、备注等信息，并提供查看、编辑、删除、下载等操作。

**功能特性**：
- 展示简历基本信息（标题、类型图标、创建时间）
- 展示文件信息（文件名、大小，仅file类型）
- 展示标签列表（最多3个，超出显示+N）
- 展示备注摘要（最多50字符）
- 提供操作按钮（查看、编辑、删除、下载）
- 删除操作带确认对话框
- 卡片hover效果
- 支持暗黑主题
- 响应式设计

**Props**：
```typescript
{
  resume: ResumeVersion          // 简历版本对象（必需）
  metadata?: ResumeMetadata      // 简历元数据（可选）
  showActions?: boolean          // 是否显示操作按钮（默认true）
}
```

**Emits**：
```typescript
{
  view: (id: string) => void      // 查看简历
  edit: (id: string) => void      // 编辑简历
  delete: (id: string) => void    // 删除简历
  download: (id: string) => void  // 下载简历（仅file类型）
}
```

**使用示例**：
```vue
<template>
  <ResumeCard
    :resume="resumeData"
    :metadata="metadataData"
    @view="handleView"
    @edit="handleEdit"
    @delete="handleDelete"
    @download="handleDownload"
  />
</template>

<script setup lang="ts">
import { ResumeCard } from '@/components/business'

const handleView = (id: string) => {
  router.push(`/resumes/${id}`)
}
</script>
```

---

### 2. FileUpload（文件上传）

支持拖拽上传的文件上传组件，提供文件类型和大小验证、上传进度显示等功能。

**功能特性**：
- 拖拽上传区域
- 文件选择按钮
- 文件类型验证（.pdf, .docx, .doc）
- 文件大小验证（默认≤10MB）
- 上传进度条显示
- 文件列表显示
- 错误提示（类型/大小不符）
- 成功提示
- 支持自动/手动上传
- 支持单文件/多文件上传
- 暗黑主题适配
- 响应式设计

**Props**：
```typescript
{
  accept?: string              // 接受的文件类型（默认'.pdf,.doc,.docx'）
  maxSize?: number             // 最大文件大小（默认10485760，10MB）
  multiple?: boolean           // 是否支持多文件上传（默认false）
  autoUpload?: boolean         // 是否自动上传（默认true）
}
```

**Emits**：
```typescript
{
  success: (response: any, file: File) => void  // 上传成功
  error: (error: any) => void                   // 上传失败
  progress: (percent: number) => void           // 上传进度变化
  beforeUpload: (file: File) => void            // 上传前钩子
  change: (file, fileList) => void              // 文件选择变化
  remove: (file) => void                        // 文件移除
}
```

**暴露的方法**：
```typescript
{
  submit: () => void        // 手动触发上传（autoUpload=false时使用）
  clearFiles: () => void    // 清空文件列表
  abort: (file?) => void    // 中止上传
}
```

**使用示例**：

基本使用（自动上传）：
```vue
<template>
  <FileUpload
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { FileUpload } from '@/components/business'

const handleSuccess = (response: any, file: File) => {
  console.log('上传成功:', response)
}
</script>
```

手动上传：
```vue
<template>
  <div>
    <FileUpload
      ref="uploadRef"
      :auto-upload="false"
      @change="handleFileChange"
    />
    <el-button @click="handleSubmit">开始上传</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileUpload } from '@/components/business'
import { useResumesStore } from '@/stores/resumes'

const uploadRef = ref<InstanceType<typeof FileUpload>>()
const resumesStore = useResumesStore()
let selectedFile: File | null = null

const handleFileChange = (file: any) => {
  selectedFile = file.raw
}

const handleSubmit = async () => {
  if (selectedFile) {
    await resumesStore.uploadFile(selectedFile, 'position-id', 'title')
    uploadRef.value?.clearFiles()
  }
}
</script>
```

---

## 工具函数

组件内包含以下工具函数：

### ResumeCard工具函数

1. **formatFileSize(bytes: number): string**
   - 格式化文件大小（B/KB/MB）

2. **formatDate(dateString: string): string**
   - 格式化日期时间
   - 1分钟内：刚刚
   - 1小时内：N分钟前
   - 1天内：N小时前
   - 1周内：N天前
   - 超过1周：固定格式（YYYY-MM-DD HH:mm）

3. **truncateNotes(notes: string): string**
   - 截断备注文本（最多50字符）

4. **getTagType(index: number): TagType**
   - 根据索引返回标签颜色类型

### FileUpload工具函数

1. **formatFileSize(bytes: number): string**
   - 格式化文件大小（B/KB/MB）

2. **validateFileType(file: File): boolean**
   - 验证文件类型

3. **validateFileSize(file: File): boolean**
   - 验证文件大小

---

## Element Plus组件使用

### ResumeCard使用的组件：
- el-card（卡片容器）
- el-icon（图标）
- el-button（按钮）
- el-dropdown、el-dropdown-menu、el-dropdown-item（下拉菜单）
- el-tag（标签）
- ElMessageBox（确认对话框）

### FileUpload使用的组件：
- el-upload（上传组件）
- el-progress（进度条）
- el-icon（图标）
- ElMessage（消息提示）

---

## 图标使用

从 `@element-plus/icons-vue` 导入的图标：

### ResumeCard：
- Document（文档）
- Edit（编辑）
- View（查看）
- More（更多）
- Download（下载）
- Delete（删除）
- Clock（时钟）
- Paperclip（附件）
- Collection（收藏）

### FileUpload：
- UploadFilled（上传图标）

---

## 数据模型

### ResumeVersion（简历版本）
```typescript
interface ResumeVersion {
  id: string
  targetPositionId: string
  type: 'file' | 'online'
  title: string
  filePath?: string        // type=file时存在
  fileName?: string        // type=file时存在
  fileSize?: number        // type=file时存在（字节）
  content?: string         // type=online时存在
  createdAt: string
  updatedAt: string
}
```

### ResumeMetadata（简历元数据）
```typescript
interface ResumeMetadata {
  id: string
  resumeId: string
  notes?: string           // 备注，最多2000字符
  tags?: string[]          // 标签数组
  createdAt: string
  updatedAt: string
}
```

---

## 文件结构

```
business/
├── ResumeCard.vue      # 简历卡片组件
├── FileUpload.vue      # 文件上传组件
├── index.ts            # 统一导出文件
├── examples.ts         # 使用示例代码
└── README.md           # 本文档
```

---

## 注意事项

1. **文件上传限制**：
   - 文件类型：.pdf, .docx, .doc
   - 文件大小：默认≤10MB（可通过props配置）

2. **暗黑主题**：
   - 两个组件都支持暗黑主题
   - 在html标签添加dark类时自动切换样式

3. **响应式设计**：
   - 在移动端（≤768px）会自动调整布局
   - ResumeCard的操作按钮会在移动端换行显示

4. **类型安全**：
   - 所有组件都提供完整的TypeScript类型定义
   - 建议使用TypeScript开发以获得更好的开发体验

5. **与API集成**：
   - FileUpload需要配置上传URL（通过API服务）
   - 建议结合useResumesStore使用以获得完整功能

---

## 更多示例

更多详细的使用示例请查看 `examples.ts` 文件。