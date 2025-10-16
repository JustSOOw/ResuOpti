<!--
  简历元数据编辑对话框组件
  功能：
  1. 编辑简历备注（支持多行文本）
  2. 管理简历标签（添加、删除）
  3. 表单验证
  4. 提交更新到后端
-->

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, PriceTag, Close } from '@element-plus/icons-vue'
import { updateResume } from '@/services/resumes'

// ============ Props定义 ============
interface Props {
  /** 是否显示对话框 */
  visible: boolean
  /** 简历ID */
  resumeId: string
  /** 简历标题（用于显示） */
  resumeTitle?: string
  /** 初始备注内容 */
  initialNotes?: string
  /** 初始标签列表 */
  initialTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  resumeTitle: '',
  initialNotes: '',
  initialTags: () => []
})

// ============ Emits定义 ============
const emit = defineEmits<{
  /** 关闭对话框 */
  'update:visible': [value: boolean]
  /** 更新成功 */
  success: []
  /** 取消操作 */
  cancel: []
}>()

// ============ 响应式状态 ============
/** 备注内容 */
const notes = ref('')

/** 标签列表 */
const tags = ref<string[]>([])

/** 新标签输入框的值 */
const newTag = ref('')

/** 是否正在提交 */
const isSubmitting = ref(false)

/** 对话框显示状态（本地控制） */
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// ============ 监听Props变化 ============
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      // 打开对话框时，重置表单数据
      notes.value = props.initialNotes || ''
      tags.value = [...(props.initialTags || [])]
      newTag.value = ''
      isSubmitting.value = false
    }
  },
  { immediate: true }
)

// ============ 计算属性 ============
/** 标签数量限制提示 */
const tagLimitHint = computed(() => {
  const count = tags.value.length
  if (count >= 20) return '已达到标签数量上限（20个）'
  if (count >= 15) return `还可以添加 ${20 - count} 个标签`
  return ''
})

/** 是否达到标签数量上限 */
const isTagLimitReached = computed(() => tags.value.length >= 20)

/** 备注字符数统计 */
const notesLength = computed(() => notes.value.length)

/** 备注是否超长 */
const isNotesTooLong = computed(() => notesLength.value > 2000)

// ============ 标签管理方法 ============
/**
 * 添加新标签
 */
const handleAddTag = () => {
  const trimmedTag = newTag.value.trim()

  // 验证标签
  if (!trimmedTag) {
    return
  }

  if (trimmedTag.length > 50) {
    ElMessage.warning('标签长度不能超过50个字符')
    return
  }

  if (tags.value.length >= 20) {
    ElMessage.warning('标签数量不能超过20个')
    return
  }

  if (tags.value.includes(trimmedTag)) {
    ElMessage.warning('该标签已存在')
    return
  }

  // 添加标签
  tags.value.push(trimmedTag)
  newTag.value = ''
  ElMessage.success('标签添加成功')
}

/**
 * 删除标签
 * @param index 标签索引
 */
const handleRemoveTag = (index: number) => {
  tags.value.splice(index, 1)
}

/**
 * 根据索引获取标签类型（用于不同颜色）
 * @param index 标签索引
 * @returns Element Plus标签类型
 */
const getTagType = (index: number): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const types = ['primary', 'success', 'warning', 'danger', 'info'] as const
  return types[index % types.length] as 'primary' | 'success' | 'info' | 'warning' | 'danger'
}

// ============ 表单提交方法 ============
/**
 * 验证表单
 * @returns 验证是否通过
 */
const validateForm = (): boolean => {
  // 验证备注长度
  if (notes.value.length > 2000) {
    ElMessage.error('备注长度不能超过2000个字符')
    return false
  }

  // 验证标签数量
  if (tags.value.length > 20) {
    ElMessage.error('标签数量不能超过20个')
    return false
  }

  // 验证每个标签长度
  for (const tag of tags.value) {
    if (tag.length > 50) {
      ElMessage.error(`标签"${tag}"长度超过50个字符`)
      return false
    }
  }

  return true
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // 调用API更新元数据
    await updateResume(props.resumeId, {
      notes: notes.value.trim() || null,
      tags: tags.value
    })

    ElMessage.success('元数据更新成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    console.error('更新元数据失败:', error)
    ElMessage.error(error.message || '更新元数据失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 取消操作
 */
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

/**
 * 处理标签输入框的回车事件
 */
const handleTagInputEnter = () => {
  if (newTag.value.trim()) {
    handleAddTag()
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑简历元数据"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <!-- 对话框头部：显示简历标题 -->
    <template #header>
      <div class="dialog-header">
        <span class="header-title">编辑简历元数据</span>
        <span v-if="resumeTitle" class="header-subtitle">{{ resumeTitle }}</span>
      </div>
    </template>

    <!-- 对话框内容 -->
    <div class="dialog-content">
      <!-- 备注编辑区域 -->
      <div class="form-section">
        <div class="section-header">
          <el-icon class="section-icon"><Document /></el-icon>
          <span class="section-title">备注</span>
          <span class="char-count" :class="{ 'is-error': isNotesTooLong }">
            {{ notesLength }} / 2000
          </span>
        </div>
        <el-input
          v-model="notes"
          type="textarea"
          :rows="5"
          placeholder="请输入简历备注，可用于记录针对性修改、投递策略等信息..."
          maxlength="2000"
          show-word-limit
          clearable
        />
        <div v-if="isNotesTooLong" class="error-hint">
          <el-icon><Close /></el-icon>
          备注长度不能超过2000个字符
        </div>
      </div>

      <!-- 标签编辑区域 -->
      <div class="form-section">
        <div class="section-header">
          <el-icon class="section-icon"><PriceTag /></el-icon>
          <span class="section-title">标签</span>
          <span v-if="tagLimitHint" class="tag-hint">{{ tagLimitHint }}</span>
        </div>

        <!-- 现有标签列表 -->
        <div v-if="tags.length > 0" class="tags-list">
          <el-tag
            v-for="(tag, index) in tags"
            :key="index"
            :type="getTagType(index)"
            closable
            @close="handleRemoveTag(index)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div v-else class="empty-tags">
          <span class="empty-text">暂无标签，请在下方添加</span>
        </div>

        <!-- 添加新标签 -->
        <div class="add-tag-section">
          <el-input
            v-model="newTag"
            placeholder="输入标签名称后按回车添加（最多20个，每个最多50字符）"
            maxlength="50"
            :disabled="isTagLimitReached"
            @keyup.enter="handleTagInputEnter"
            class="tag-input"
          >
            <template #append>
              <el-button
                :icon="PriceTag"
                :disabled="!newTag.trim() || isTagLimitReached"
                @click="handleAddTag"
              >
                添加
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 标签示例提示 -->
        <div class="tag-examples">
          <span class="examples-label">标签示例：</span>
          <span class="example-item">技术重点</span>
          <span class="example-item">阿里定制</span>
          <span class="example-item">React专精</span>
          <span class="example-item">项目经验优化</span>
        </div>
      </div>
    </div>

    <!-- 对话框底部：操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button :disabled="isSubmitting" @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          :disabled="isNotesTooLong"
          @click="handleSubmit"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
/**
 * 对话框头部样式
 */
.dialog-header {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .header-subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/**
 * 对话框内容样式
 */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 0;
}

/**
 * 表单区块样式
 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .section-icon {
      color: var(--el-color-primary);
      font-size: 18px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      flex: 1;
    }

    .char-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);

      &.is-error {
        color: var(--el-color-danger);
        font-weight: 600;
      }
    }

    .tag-hint {
      font-size: 12px;
      color: var(--el-color-warning);
      font-weight: 500;
    }
  }

  .error-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-color-danger);
    font-size: 12px;
    margin-top: -4px;
  }
}

/**
 * 标签列表样式
 */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  min-height: 60px;

  .tag-item {
    font-size: 13px;
  }
}

.empty-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);

  .empty-text {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
  }
}

/**
 * 添加标签区域样式
 */
.add-tag-section {
  .tag-input {
    :deep(.el-input-group__append) {
      padding: 0 12px;
    }
  }
}

/**
 * 标签示例样式
 */
.tag-examples {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  font-size: 12px;

  .examples-label {
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  .example-item {
    color: var(--el-text-color-regular);
    padding: 2px 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 3px;
    cursor: default;

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

/**
 * 对话框底部样式
 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/**
 * 暗黑主题适配
 */
html.dark {
  .tags-list {
    background-color: var(--el-fill-color-darker);
  }

  .empty-tags {
    background-color: var(--el-fill-color-dark);
    border-color: var(--el-border-color-darker);
  }

  .tag-examples {
    background-color: var(--el-fill-color-dark);

    .example-item {
      background-color: var(--el-fill-color-darker);
    }
  }
}

/**
 * 响应式设计 - 手机端
 */
@media (max-width: 768px) {
  .dialog-content {
    gap: 20px;
  }

  .form-section {
    .section-header {
      flex-wrap: wrap;

      .section-title {
        flex: 1 1 100%;
      }
    }
  }

  .tag-examples {
    .examples-label {
      flex: 1 1 100%;
      margin-bottom: 4px;
    }
  }
}
</style>
