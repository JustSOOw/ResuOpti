<!--
  简历卡片展示组件
  用于展示简历的基本信息、标签、备注等，并提供查看、编辑、删除、下载等操作
-->
<template>
  <el-card
    class="resume-card"
    :class="{ 'is-hover': isHovering }"
    shadow="hover"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <!-- 卡片头部：标题和类型图标 -->
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <!-- 简历类型图标 -->
          <el-icon :size="20" class="type-icon">
            <Document v-if="resume.type === 'file'" />
            <Edit v-else />
          </el-icon>
          <!-- 简历标题 -->
          <span class="title">{{ resume.title }}</span>
        </div>
        <!-- 操作按钮组 -->
        <div v-if="showActions" class="header-actions">
          <el-button
            type="primary"
            size="small"
            :icon="View"
            @click="handleView"
          >
            查看
          </el-button>
          <el-dropdown @command="handleCommand">
            <el-button size="small" :icon="More">
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit" :icon="Edit">
                  编辑
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="resume.type === 'file'"
                  command="download"
                  :icon="Download"
                >
                  下载
                </el-dropdown-item>
                <el-dropdown-item
                  command="delete"
                  :icon="Delete"
                  divided
                >
                  <span class="danger-text">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <!-- 卡片内容：文件信息、创建时间、标签、备注 -->
    <div class="card-content">
      <!-- 文件信息（仅file类型显示） -->
      <div v-if="resume.type === 'file' && resume.fileName" class="info-row">
        <el-icon class="info-icon"><Paperclip /></el-icon>
        <span class="info-text">{{ resume.fileName }}</span>
        <span class="file-size">{{ formatFileSize(resume.fileSize || 0) }}</span>
      </div>

      <!-- 创建时间 -->
      <div class="info-row">
        <el-icon class="info-icon"><Clock /></el-icon>
        <span class="info-text">{{ formatDate(resume.createdAt) }}</span>
      </div>

      <!-- 标签列表 -->
      <div v-if="metadata?.tags && metadata.tags.length > 0" class="tags-section">
        <el-icon class="info-icon"><Collection /></el-icon>
        <div class="tags-wrapper">
          <!-- 最多显示3个标签 -->
          <el-tag
            v-for="(tag, index) in displayTags"
            :key="index"
            :type="getTagType(index)"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <!-- 更多标签提示 -->
          <el-tag
            v-if="remainingTagsCount > 0"
            size="small"
            type="info"
            class="tag-item"
          >
            +{{ remainingTagsCount }}
          </el-tag>
        </div>
      </div>

      <!-- 备注摘要 -->
      <div v-if="metadata?.notes" class="notes-section">
        <el-icon class="info-icon"><Document /></el-icon>
        <span class="notes-text" :title="metadata.notes">
          {{ truncateNotes(metadata.notes) }}
        </span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Document,
  Edit,
  View,
  More,
  Download,
  Delete,
  Clock,
  Paperclip,
  Collection
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import type { ResumeVersion, ResumeMetadata } from '../../services/resumes'

// ============ Props定义 ============
interface Props {
  /** 简历版本对象 */
  resume: ResumeVersion
  /** 简历元数据（可选） */
  metadata?: ResumeMetadata
  /** 是否显示操作按钮 */
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  metadata: undefined,
  showActions: true
})

// ============ Emits定义 ============
const emit = defineEmits<{
  /** 查看简历 */
  view: [id: string]
  /** 编辑简历 */
  edit: [id: string]
  /** 删除简历 */
  delete: [id: string]
  /** 下载简历 */
  download: [id: string]
}>()

// ============ 响应式状态 ============
/** 鼠标悬停状态 */
const isHovering = ref(false)

// ============ 计算属性 ============
/** 显示的标签（最多3个） */
const displayTags = computed(() => {
  if (!props.metadata?.tags) return []
  return props.metadata.tags.slice(0, 3)
})

/** 剩余标签数量 */
const remainingTagsCount = computed(() => {
  if (!props.metadata?.tags) return 0
  return Math.max(0, props.metadata.tags.length - 3)
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
 * 格式化日期时间
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // 相对时间显示
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  // 固定格式显示
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  // 同年只显示月日
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hours}:${minutes}`
  }

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 截断备注文本
 * @param notes 备注内容
 * @returns 截断后的备注文本（最多50字符）
 */
const truncateNotes = (notes: string): string => {
  if (notes.length <= 50) return notes
  return notes.substring(0, 50) + '...'
}

/**
 * 根据索引获取标签类型（用于不同颜色）
 * @param index 标签索引
 * @returns Element Plus标签类型
 */
const getTagType = (index: number): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const types = [
    'primary',
    'success',
    'warning',
    'danger',
    'info'
  ] as const
  return types[index % types.length] as 'primary' | 'success' | 'info' | 'warning' | 'danger'
}

// ============ 事件处理 ============
/**
 * 处理查看按钮点击
 */
const handleView = () => {
  emit('view', props.resume.id)
}

/**
 * 处理下拉菜单命令
 * @param command 命令类型
 */
const handleCommand = (command: string) => {
  switch (command) {
    case 'edit':
      emit('edit', props.resume.id)
      break
    case 'download':
      emit('download', props.resume.id)
      break
    case 'delete':
      handleDelete()
      break
  }
}

/**
 * 处理删除操作（带确认对话框）
 */
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除简历"${props.resume.title}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    emit('delete', props.resume.id)
  } catch {
    // 用户取消删除，不做任何操作
  }
}
</script>

<style scoped lang="scss">
.resume-card {
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &.is-hover {
    transform: translateY(-2px);
  }
}

// 卡片头部样式
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0; // 防止标题过长时布局错乱

    .type-icon {
      flex-shrink: 0;
      color: var(--el-color-primary);
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
}

// 卡片内容样式
.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 信息行样式
.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;

  .info-icon {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
  }

  .info-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

// 标签区域样式
.tags-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .info-icon {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;

    .tag-item {
      flex-shrink: 0;
    }
  }
}

// 备注区域样式
.notes-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;

  .info-icon {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }

  .notes-text {
    flex: 1;
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.5;
    cursor: help;
  }
}

// 危险文本样式
.danger-text {
  color: var(--el-color-danger);
}

// 暗黑主题适配
html.dark {
  .card-content {
    .info-row,
    .tags-section,
    .notes-section {
      .info-icon {
        opacity: 0.8;
      }
    }
  }

  .notes-section {
    background-color: var(--el-fill-color-darker);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .header-left {
      width: 100%;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>