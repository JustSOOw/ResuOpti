/**
 * 业务组件使用示例
 *
 * 本文件展示了如何使用ResumeCard和FileUpload组件
 */

// ============================================
// ResumeCard 组件使用示例
// ============================================

/**
 * 示例1：基本使用
 */
/*
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
import type { ResumeVersion, ResumeMetadata } from '@/services/resumes'

const resumeData: ResumeVersion = {
  id: '1',
  targetPositionId: 'pos-1',
  type: 'file',
  title: '前端工程师简历',
  fileName: 'resume.pdf',
  fileSize: 2048000,
  filePath: '/uploads/user1/pos1/resume.pdf',
  createdAt: '2025-09-30T10:00:00Z',
  updatedAt: '2025-09-30T10:00:00Z'
}

const metadataData: ResumeMetadata = {
  id: 'meta-1',
  resumeId: '1',
  notes: '这是一份针对前端工程师岗位优化的简历，重点突出React和Vue技能',
  tags: ['React', 'Vue', 'TypeScript', 'Node.js'],
  createdAt: '2025-09-30T10:00:00Z',
  updatedAt: '2025-09-30T10:00:00Z'
}

const handleView = (id: string) => {
  console.log('查看简历:', id)
  // 跳转到简历详情页
  router.push(`/resumes/${id}`)
}

const handleEdit = (id: string) => {
  console.log('编辑简历:', id)
  // 跳转到编辑页面
  router.push(`/resumes/${id}/edit`)
}

const handleDelete = async (id: string) => {
  console.log('删除简历:', id)
  // 调用删除API
  await resumesStore.deleteResume(id)
  ElMessage.success('简历已删除')
}

const handleDownload = (id: string) => {
  console.log('下载简历:', id)
  // 下载简历文件
  window.open(`/api/resumes/${id}/download`, '_blank')
}
</script>
*/

/**
 * 示例2：在列表中使用
 */
/*
<template>
  <div class="resume-list">
    <ResumeCard
      v-for="resume in resumes"
      :key="resume.id"
      :resume="resume"
      :metadata="getMetadata(resume.id)"
      @view="handleView"
      @edit="handleEdit"
      @delete="handleDelete"
      @download="handleDownload"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ResumeCard } from '@/components/business'
import { useResumesStore } from '@/stores/resumes'

const resumesStore = useResumesStore()

// 获取简历列表
const resumes = computed(() => resumesStore.resumes)

// 获取元数据
const getMetadata = (resumeId: string) => {
  const resume = resumesStore.getResumeById(resumeId)
  return resume?.metadata
}
</script>
*/

/**
 * 示例3：不显示操作按钮
 */
/*
<template>
  <ResumeCard
    :resume="resumeData"
    :show-actions="false"
  />
</template>
*/

// ============================================
// FileUpload 组件使用示例
// ============================================

/**
 * 示例1：基本使用（自动上传）
 */
/*
<template>
  <FileUpload
    @success="handleSuccess"
    @error="handleError"
    @progress="handleProgress"
  />
</template>

<script setup lang="ts">
import { FileUpload } from '@/components/business'
import { ElMessage } from 'element-plus'

const handleSuccess = (response: any, file: File) => {
  console.log('上传成功:', response, file)
  ElMessage.success('文件上传成功')
}

const handleError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('文件上传失败')
}

const handleProgress = (percent: number) => {
  console.log('上传进度:', percent)
}
</script>
*/

/**
 * 示例2：手动上传（配合后端API）
 */
/*
<template>
  <div>
    <FileUpload
      ref="uploadRef"
      :auto-upload="false"
      @before-upload="handleBeforeUpload"
      @change="handleFileChange"
    />
    <el-button @click="handleSubmit">开始上传</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileUpload } from '@/components/business'
import { useResumesStore } from '@/stores/resumes'
import type { UploadFile, UploadFiles } from 'element-plus'

const uploadRef = ref<InstanceType<typeof FileUpload>>()
const resumesStore = useResumesStore()

let selectedFile: File | null = null

const handleBeforeUpload = (file: File) => {
  console.log('准备上传:', file)
  selectedFile = file
}

const handleFileChange = (file: UploadFile, fileList: UploadFiles) => {
  console.log('文件选择变化:', file, fileList)
}

const handleSubmit = async () => {
  if (!selectedFile) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    // 使用Store中的上传方法
    const result = await resumesStore.uploadFile(
      selectedFile,
      'target-position-id',
      '我的简历'
    )
    console.log('上传结果:', result)
    ElMessage.success('简历上传成功')

    // 清空文件列表
    uploadRef.value?.clearFiles()
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('简历上传失败')
  }
}
</script>
*/

/**
 * 示例3：自定义文件类型和大小限制
 */
/*
<template>
  <FileUpload
    accept=".pdf"
    :max-size="5 * 1024 * 1024"
    @success="handleSuccess"
  />
</template>
*/

/**
 * 示例4：多文件上传
 */
/*
<template>
  <FileUpload
    :multiple="true"
    @success="handleSuccess"
  />
</template>
*/

/**
 * 示例5：完整的上传流程（带进度显示）
 */
/*
<template>
  <div class="upload-section">
    <FileUpload
      ref="uploadRef"
      :auto-upload="false"
      @change="handleFileChange"
      @before-upload="handleBeforeUpload"
    />

    <div v-if="selectedFileName" class="file-info">
      <span>已选择: {{ selectedFileName }}</span>
      <el-button @click="handleClearFile">清除</el-button>
    </div>

    <el-button
      type="primary"
      :loading="isUploading"
      :disabled="!selectedFileName"
      @click="handleUpload"
    >
      {{ isUploading ? '上传中...' : '开始上传' }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileUpload } from '@/components/business'
import { useResumesStore } from '@/stores/resumes'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadFiles } from 'element-plus'

const uploadRef = ref<InstanceType<typeof FileUpload>>()
const resumesStore = useResumesStore()

const selectedFile = ref<File | null>(null)
const selectedFileName = computed(() => selectedFile.value?.name)
const isUploading = computed(() => resumesStore.isUploading)

const handleFileChange = (file: UploadFile, fileList: UploadFiles) => {
  if (file.raw) {
    selectedFile.value = file.raw
  }
}

const handleBeforeUpload = (file: File) => {
  console.log('文件验证通过:', file)
}

const handleClearFile = () => {
  uploadRef.value?.clearFiles()
  selectedFile.value = null
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  try {
    const positionId = 'your-position-id'
    const title = selectedFile.value.name.replace(/\.[^/.]+$/, '')

    await resumesStore.uploadFile(
      selectedFile.value,
      positionId,
      title
    )

    ElMessage.success('简历上传成功')
    handleClearFile()
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败')
  }
}
</script>

<style scoped>
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
}
</style>
*/

export {}
