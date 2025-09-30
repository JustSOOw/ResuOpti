<!--
  文件上传组件
  支持拖拽上传、文件类型和大小验证、上传进度显示等功能
-->
<template>
  <div class="file-upload">
    <el-upload
      ref="uploadRef"
      class="upload-container"
      :class="{ 'is-dragging': isDragging }"
      drag
      :accept="accept"
      :multiple="multiple"
      :auto-upload="autoUpload"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :on-exceed="handleExceed"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-progress="handleProgress"
      :before-upload="handleBeforeUpload"
      :limit="multiple ? undefined : 1"
      :show-file-list="true"
      :file-list="fileList"
      @dragenter="isDragging = true"
      @dragleave="isDragging = false"
      @drop="isDragging = false"
    >
      <!-- 上传区域内容 -->
      <div class="upload-content">
        <el-icon class="upload-icon" :size="60">
          <UploadFilled />
        </el-icon>
        <div class="upload-text">
          <div class="primary-text">拖拽文件到此处或</div>
          <el-button type="primary" size="default">选择文件</el-button>
        </div>
        <div class="upload-tip">
          支持 {{ acceptText }} 格式，大小不超过 {{ maxSizeText }}
        </div>
      </div>
    </el-upload>

    <!-- 上传进度条 -->
    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-section">
      <div class="progress-header">
        <span class="progress-text">正在上传...</span>
        <span class="progress-percent">{{ uploadProgress }}%</span>
      </div>
      <el-progress
        :percentage="uploadProgress"
        :status="uploadProgress === 100 ? 'success' : undefined"
        :show-text="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadFile, UploadFiles, UploadRawFile, UploadProgressEvent } from 'element-plus'

// ============ Props定义 ============
interface Props {
  /** 接受的文件类型（MIME类型或扩展名） */
  accept?: string
  /** 最大文件大小（字节） */
  maxSize?: number
  /** 是否支持多文件上传 */
  multiple?: boolean
  /** 是否自动上传 */
  autoUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.pdf,.doc,.docx',
  maxSize: 10 * 1024 * 1024, // 10MB
  multiple: false,
  autoUpload: true
})

// ============ Emits定义 ============
const emit = defineEmits<{
  /** 上传成功 */
  success: [response: any, file: File]
  /** 上传失败 */
  error: [error: any]
  /** 上传进度变化 */
  progress: [percent: number]
  /** 文件上传前的钩子（返回false可阻止上传） */
  beforeUpload: [file: File]
  /** 文件选择变化 */
  change: [file: UploadFile, fileList: UploadFiles]
  /** 文件移除 */
  remove: [file: UploadFile]
}>()

// ============ 响应式状态 ============
/** 上传组件引用 */
const uploadRef = ref<UploadInstance>()

/** 是否正在拖拽 */
const isDragging = ref(false)

/** 上传进度（0-100） */
const uploadProgress = ref(0)

/** 文件列表 */
const fileList = ref<UploadFile[]>([])

// ============ 计算属性 ============
/**
 * 可接受的文件类型文本描述
 */
const acceptText = computed(() => {
  const types = props.accept.split(',').map(t => t.trim().toUpperCase())
  return types.join(', ')
})

/**
 * 最大文件大小文本描述
 */
const maxSizeText = computed(() => {
  return formatFileSize(props.maxSize)
})

// ============ 工具函数 ============
/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串（B/KB/MB）
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 验证文件类型
 * @param file 文件对象
 * @returns 是否通过验证
 */
const validateFileType = (file: File): boolean => {
  // 解析accept属性中的MIME类型和扩展名
  const acceptTypes = props.accept.split(',').map(t => t.trim().toLowerCase())

  // 检查扩展名
  const fileName = file.name.toLowerCase()
  const hasValidExtension = acceptTypes.some(type => {
    if (type.startsWith('.')) {
      return fileName.endsWith(type)
    }
    return false
  })

  // 检查MIME类型
  const fileMimeType = file.type.toLowerCase()
  const hasValidMimeType = acceptTypes.some(type => {
    if (!type.startsWith('.')) {
      return fileMimeType === type || fileMimeType.startsWith(type.replace('*', ''))
    }
    return false
  })

  return hasValidExtension || hasValidMimeType
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @returns 是否通过验证
 */
const validateFileSize = (file: File): boolean => {
  return file.size <= props.maxSize
}

// ============ 事件处理 ============
/**
 * 文件选择变化时触发
 * @param file 当前文件
 * @param fileList 文件列表
 */
const handleFileChange = (file: UploadFile, uploadFileList: UploadFiles) => {
  fileList.value = uploadFileList
  emit('change', file, uploadFileList)
}

/**
 * 文件移除时触发
 * @param file 被移除的文件
 */
const handleFileRemove = (file: UploadFile) => {
  // 重置上传进度
  uploadProgress.value = 0
  emit('remove', file)
}

/**
 * 文件超出限制时触发
 */
const handleExceed = () => {
  ElMessage.warning('只能上传一个文件，请移除当前文件后再上传')
}

/**
 * 文件上传前的钩子
 * @param rawFile 原始文件对象
 * @returns 是否允许上传
 */
const handleBeforeUpload = (rawFile: UploadRawFile): boolean => {
  // 验证文件类型
  if (!validateFileType(rawFile)) {
    ElMessage.error('只支持PDF和Word文档（.pdf, .doc, .docx）')
    return false
  }

  // 验证文件大小
  if (!validateFileSize(rawFile)) {
    ElMessage.error(`文件大小不能超过 ${maxSizeText.value}`)
    return false
  }

  // 触发beforeUpload事件，允许父组件进行额外验证
  emit('beforeUpload', rawFile)

  return true
}

/**
 * 文件上传成功时触发
 * @param response 服务器响应
 * @param file 文件对象
 */
const handleSuccess = (response: any, file: UploadFile) => {
  uploadProgress.value = 100

  // 延迟重置进度条
  setTimeout(() => {
    uploadProgress.value = 0
  }, 1000)

  ElMessage.success('文件上传成功')

  // 触发success事件
  if (file.raw) {
    emit('success', response, file.raw)
  }
}

/**
 * 文件上传失败时触发
 * @param error 错误对象
 */
const handleError = (error: any) => {
  uploadProgress.value = 0

  // 解析错误信息
  let errorMessage = '文件上传失败'
  if (error?.message) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  ElMessage.error(errorMessage)
  emit('error', error)
}

/**
 * 文件上传进度更新时触发
 * @param event 进度事件
 */
const handleProgress = (event: UploadProgressEvent) => {
  // 计算上传进度百分比
  if (event.total && event.total > 0) {
    uploadProgress.value = Math.round((event.loaded / event.total) * 100)
    emit('progress', uploadProgress.value)
  }
}

// ============ 暴露的方法 ============
/**
 * 手动触发上传（autoUpload=false时使用）
 */
const submit = () => {
  uploadRef.value?.submit()
}

/**
 * 清空已选择的文件列表
 */
const clearFiles = () => {
  uploadRef.value?.clearFiles()
  fileList.value = []
  uploadProgress.value = 0
}

/**
 * 中止上传
 * @param file 可选，要中止的文件对象
 */
const abort = (file?: UploadFile) => {
  uploadRef.value?.abort(file as any)
  uploadProgress.value = 0
}

// 暴露方法给父组件
defineExpose({
  submit,
  clearFiles,
  abort
})
</script>

<style scoped lang="scss">
.file-upload {
  width: 100%;
}

// 上传容器样式
.upload-container {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    padding: 40px 20px;
    width: 100%;
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    background-color: var(--el-fill-color-blank);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }

  // 拖拽状态样式
  &.is-dragging {
    :deep(.el-upload-dragger) {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      transform: scale(1.02);
    }
  }
}

// 上传内容样式
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .upload-icon {
    color: var(--el-color-primary);
    opacity: 0.8;
  }

  .upload-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .primary-text {
      font-size: 16px;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }
  }

  .upload-tip {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: center;
    line-height: 1.5;
  }
}

// 进度条区域样式
.progress-section {
  margin-top: 20px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .progress-text {
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
    }

    .progress-percent {
      font-size: 14px;
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

// 文件列表样式覆盖
:deep(.el-upload-list) {
  margin-top: 16px;

  .el-upload-list__item {
    padding: 12px;
    border-radius: 6px;
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color);
    }

    .el-upload-list__item-name {
      color: var(--el-text-color-primary);
      font-size: 14px;
    }

    .el-icon {
      color: var(--el-color-primary);
    }
  }

  .el-upload-list__item.is-success {
    .el-upload-list__item-status-label {
      color: var(--el-color-success);
    }
  }
}

// 暗黑主题适配
html.dark {
  .upload-container {
    :deep(.el-upload-dragger) {
      background-color: var(--el-fill-color-darker);

      &:hover {
        background-color: var(--el-fill-color-dark);
      }
    }

    &.is-dragging {
      :deep(.el-upload-dragger) {
        background-color: var(--el-fill-color-dark);
      }
    }
  }

  .progress-section {
    background-color: var(--el-fill-color-darker);
  }

  :deep(.el-upload-list) {
    .el-upload-list__item {
      background-color: var(--el-fill-color-darker);
      border-color: var(--el-border-color-dark);

      &:hover {
        background-color: var(--el-fill-color-dark);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .upload-container {
    :deep(.el-upload-dragger) {
      padding: 30px 15px;
    }
  }

  .upload-content {
    gap: 12px;

    .upload-icon {
      font-size: 48px !important;
    }

    .upload-text {
      .primary-text {
        font-size: 14px;
      }
    }

    .upload-tip {
      font-size: 12px;
    }
  }

  .progress-section {
    padding: 12px;
  }
}
</style>