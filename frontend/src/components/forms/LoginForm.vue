<!--
  用户登录/注册表单组件
  支持登录和注册两种模式
-->
<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="80px"
    class="login-form"
    @submit.prevent="handleSubmit"
  >
    <!-- 邮箱输入框 -->
    <el-form-item label="邮箱" prop="email">
      <el-input
        v-model="formData.email"
        type="email"
        placeholder="请输入您的邮箱地址"
        clearable
        :disabled="loading"
        autocomplete="email"
      >
        <template #prefix>
          <el-icon><Message /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <!-- 密码输入框 -->
    <el-form-item label="密码" prop="password">
      <el-input
        v-model="formData.password"
        type="password"
        placeholder="请输入密码（至少8位）"
        show-password
        clearable
        :disabled="loading"
        autocomplete="current-password"
      >
        <template #prefix>
          <el-icon><Lock /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <!-- 确认密码输入框（仅注册模式显示） -->
    <el-form-item
      v-if="mode === 'register'"
      label="确认密码"
      prop="confirmPassword"
    >
      <el-input
        v-model="formData.confirmPassword"
        type="password"
        placeholder="请再次输入密码"
        show-password
        clearable
        :disabled="loading"
        autocomplete="new-password"
      >
        <template #prefix>
          <el-icon><Lock /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <!-- 提交按钮 -->
    <el-form-item>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit"
        class="submit-button"
      >
        {{ mode === 'login' ? '登录' : '注册' }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, type PropType } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'

// ==================== 类型定义 ====================

/**
 * 表单数据接口
 */
interface LoginFormData {
  email: string
  password: string
  confirmPassword: string // 仅注册模式使用
}

/**
 * 提交事件数据接口
 */
export interface LoginFormSubmitData {
  email: string
  password: string
}

/**
 * 表单模式类型
 */
export type FormMode = 'login' | 'register'

// ==================== Props定义 ====================

const props = defineProps({
  /**
   * 表单模式：登录或注册
   * @default 'login'
   */
  mode: {
    type: String as PropType<FormMode>,
    default: 'login',
    validator: (value: string) => ['login', 'register'].includes(value)
  }
})

// ==================== Emits定义 ====================

const emit = defineEmits<{
  /**
   * 表单提交事件
   * @param data - 包含email和password的表单数据
   */
  submit: [data: LoginFormSubmitData]

  /**
   * 模式切换事件（可选）
   * @param mode - 新的表单模式
   */
  modeChange: [mode: FormMode]
}>()

// ==================== 响应式状态 ====================

/**
 * 表单引用
 */
const formRef = ref<FormInstance>()

/**
 * 加载状态
 */
const loading = ref(false)

/**
 * 表单数据
 */
const formData = reactive<LoginFormData>({
  email: '',
  password: '',
  confirmPassword: ''
})

// ==================== 表单验证规则 ====================

/**
 * 邮箱格式验证器
 * 使用RFC 5322标准的简化版正则表达式
 */
const validateEmail = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入邮箱地址'))
  } else {
    // RFC 5322标准的简化版邮箱正则
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(value)) {
      callback(new Error('请输入有效的邮箱地址'))
    } else {
      callback()
    }
  }
}

/**
 * 密码格式验证器
 * 要求：至少8位，包含字母和数字
 */
const validatePassword = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 8) {
    callback(new Error('密码长度至少为8位'))
  } else {
    // 检查是否包含字母和数字
    const hasLetter = /[a-zA-Z]/.test(value)
    const hasNumber = /\d/.test(value)

    if (!hasLetter || !hasNumber) {
      callback(new Error('密码必须同时包含字母和数字'))
    } else {
      callback()
    }
  }
}

/**
 * 确认密码验证器
 * 要求：与密码字段一致
 */
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

/**
 * 表单验证规则
 */
const rules = reactive<FormRules<LoginFormData>>({
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

// ==================== 方法定义 ====================

/**
 * 处理表单提交
 * 验证表单后触发submit事件
 */
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    // 设置加载状态
    loading.value = true

    // 触发submit事件，传递email和password
    emit('submit', {
      email: formData.email,
      password: formData.password
    })

  } catch (error) {
    // 验证失败
    ElMessage.error('请检查表单填写是否正确')
    console.error('表单验证失败:', error)
  } finally {
    // 在父组件处理完成后应该重置loading状态
    // 这里设置一个合理的超时时间
    setTimeout(() => {
      loading.value = false
    }, 500)
  }
}

/**
 * 重置表单
 * 清空所有表单字段和验证状态
 */
const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
}

/**
 * 清空表单验证
 * 保留表单数据，只清除验证状态
 */
const clearValidation = () => {
  if (!formRef.value) return
  formRef.value.clearValidate()
}

// ==================== 监听模式变化 ====================

/**
 * 监听模式变化，清空确认密码字段
 */
watch(
  () => props.mode,
  (newMode) => {
    // 切换到登录模式时，清空确认密码
    if (newMode === 'login') {
      formData.confirmPassword = ''
      clearValidation()
    }
  }
)

// ==================== 暴露给父组件的方法 ====================

defineExpose({
  /**
   * 重置表单
   */
  resetForm,

  /**
   * 清空验证
   */
  clearValidation,

  /**
   * 设置加载状态
   * @param value - 加载状态
   */
  setLoading: (value: boolean) => {
    loading.value = value
  }
})
</script>

<style scoped>
/**
 * 登录表单样式
 */
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

/**
 * 提交按钮样式
 */
.submit-button {
  width: 100%;
  margin-top: 10px;
}

/**
 * 暗黑模式适配
 */
@media (prefers-color-scheme: dark) {
  .login-form {
    background-color: transparent;
  }
}

/**
 * Element Plus暗黑模式类适配
 */
.dark .login-form {
  background-color: transparent;
}

/**
 * 表单项间距调整
 */
.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

/**
 * 输入框图标颜色
 */
.login-form :deep(.el-input__prefix) {
  color: var(--el-text-color-secondary);
}

/**
 * 响应式设计：小屏幕适配
 */
@media screen and (max-width: 480px) {
  .login-form {
    padding: 10px;
  }

  .login-form :deep(.el-form-item__label) {
    width: 60px !important;
  }
}
</style>