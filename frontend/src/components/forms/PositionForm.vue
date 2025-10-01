<!--
  目标岗位创建/编辑表单组件
  支持创建和编辑两种模式
-->

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { Briefcase } from '@element-plus/icons-vue'

/**
 * 岗位表单数据接口
 */
export interface PositionFormData {
  name: string
  description?: string
}

/**
 * Props接口定义
 */
interface Props {
  /** 初始数据（编辑模式时传入） */
  initialData?: PositionFormData | null
}

/**
 * Emits接口定义
 */
interface Emits {
  /** 表单提交事件 */
  (e: 'submit', data: PositionFormData): void
  /** 取消事件 */
  (e: 'cancel'): void
}

// Props定义
const props = withDefaults(defineProps<Props>(), {
  initialData: null
})

// Emits定义
const emit = defineEmits<Emits>()

// ==================== 响应式状态 ====================

/**
 * 表单引用
 */
const formRef = ref<FormInstance>()

/**
 * 表单数据
 */
const formData = reactive<PositionFormData>({
  name: '',
  description: ''
})

/**
 * 表单加载状态
 */
const loading = ref(false)

// ==================== 表单验证规则 ====================

/**
 * 岗位名称验证规则
 */
const nameRules = [
  {
    required: true,
    message: '请输入岗位名称',
    trigger: 'blur'
  },
  {
    min: 1,
    max: 100,
    message: '岗位名称长度应在1-100个字符之间',
    trigger: ['blur', 'change']
  }
]

/**
 * 岗位描述验证规则
 */
const descriptionRules = [
  {
    max: 2000,
    message: '岗位描述不能超过2000个字符',
    trigger: ['blur', 'change']
  }
]

/**
 * 表单验证规则
 */
const rules: FormRules = {
  name: nameRules,
  description: descriptionRules
}

// ==================== 监听初始数据变化 ====================

/**
 * 监听initialData变化，自动填充表单
 */
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.name = newData.name || ''
      formData.description = newData.description || ''
    } else {
      // 如果没有初始数据，重置表单
      resetForm()
    }
  },
  { immediate: true }
)

// ==================== 方法 ====================

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    // 设置加载状态
    loading.value = true

    // 构造提交数据
    const submitData: PositionFormData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined
    }

    // 触发提交事件
    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    // 延迟重置加载状态
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

/**
 * 处理取消操作
 */
const handleCancel = () => {
  emit('cancel')
}

/**
 * 重置表单
 */
const resetForm = () => {
  if (!formRef.value) return

  formRef.value.resetFields()
  formData.name = ''
  formData.description = ''
}

// ==================== 暴露的方法 ====================

defineExpose({
  resetForm,
  formRef
})
</script>

<template>
  <div class="position-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      size="default"
      @submit.prevent="handleSubmit"
    >
      <!-- 岗位名称 -->
      <el-form-item label="岗位名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="例如：前端开发工程师、产品经理"
          maxlength="100"
          show-word-limit
          clearable
          :disabled="loading"
        >
          <template #prefix>
            <el-icon><Briefcase /></el-icon>
          </template>
        </el-input>
        <template #extra>
          <span class="form-tip">清晰的岗位名称有助于后续简历分类管理</span>
        </template>
      </el-form-item>

      <!-- 岗位描述 -->
      <el-form-item label="岗位描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入岗位描述或备注（可选）"
          :rows="4"
          maxlength="2000"
          show-word-limit
          :disabled="loading"
        />
        <template #extra>
          <span class="form-tip">可以记录岗位要求、薪资范围等信息</span>
        </template>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item class="form-actions">
        <el-button type="primary" native-type="submit" :loading="loading">
          {{ initialData ? '更新岗位' : '创建岗位' }}
        </el-button>
        <el-button :disabled="loading" @click="handleCancel"> 取消 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.position-form {
  width: 100%;

  .el-form {
    .el-form-item {
      margin-bottom: 24px;

      &.form-actions {
        margin-bottom: 0;
        margin-top: 32px;

        .el-button {
          min-width: 100px;

          &:not(:last-child) {
            margin-right: 12px;
          }
        }
      }
    }

    .form-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .position-form {
    .form-actions {
      .el-button {
        flex: 1;

        &:not(:last-child) {
          margin-right: 8px;
        }
      }
    }
  }
}

// 暗黑主题适配
html.dark {
  .position-form {
    .form-tip {
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
