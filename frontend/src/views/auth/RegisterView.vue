<!--
  用户注册页面
  提供用户注册功能，支持邮箱密码注册
-->
<template>
  <div class="register-view">
    <!-- 注册容器 -->
    <div class="register-container">
      <!-- 标题区域 -->
      <div class="register-header">
        <h1 class="title">加入 ResuOpti</h1>
        <p class="subtitle">创建您的账户，开始优化您的简历</p>
      </div>

      <!-- 注册卡片 -->
      <el-card class="register-card" shadow="always">
        <!-- 使用已有的LoginForm组件（注册模式） -->
        <LoginForm
          ref="registerFormRef"
          mode="register"
          @submit="handleRegister"
        />

        <!-- 额外链接 -->
        <div class="extra-links">
          <span class="link-text">已有账号？</span>
          <el-link type="primary" @click="goToLogin">
            立即登录
          </el-link>
        </div>

        <!-- 服务条款提示 -->
        <div class="terms-notice">
          <el-text size="small" type="info">
            注册即表示您同意我们的
            <el-link type="primary" :underline="false" size="small">服务条款</el-link>
            和
            <el-link type="primary" :underline="false" size="small">隐私政策</el-link>
          </el-text>
        </div>
      </el-card>

      <!-- 页脚信息 -->
      <div class="register-footer">
        <p>&copy; 2025 ResuOpti. 保留所有权利。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoginForm, { type LoginFormSubmitData } from '@/components/forms/LoginForm.vue'
import { register } from '@/services/auth'

// ==================== 路由 ====================

/**
 * Vue Router实例
 */
const router = useRouter()

// ==================== 组件引用 ====================

/**
 * LoginForm组件引用
 */
const registerFormRef = ref<InstanceType<typeof LoginForm>>()

// ==================== 方法定义 ====================

/**
 * 处理注册表单提交
 * @param formData - 表单数据（包含email和password）
 */
const handleRegister = async (formData: LoginFormSubmitData) => {
  try {
    // 调用注册API
    const response = await register(formData.email, formData.password)

    // 检查注册是否成功
    if (response.success && response.data) {
      // 显示成功消息
      ElMessage.success({
        message: response.message || '注册成功！正在跳转到登录页...',
        duration: 2000
      })

      // 延迟跳转到登录页，让用户看到成功消息
      setTimeout(() => {
        router.push({
          path: '/login',
          // 可以通过query传递email，方便用户登录
          query: {
            email: formData.email
          }
        })
      }, 1500)
    } else {
      // 注册失败（虽然不应该走到这里，因为API会抛出异常）
      ElMessage.error('注册失败，请重试')

      // 重置表单加载状态
      registerFormRef.value?.setLoading(false)
    }
  } catch (error: any) {
    // 处理注册错误
    console.error('注册失败:', error)

    // 显示错误消息
    let errorMessage = error.message || '注册失败，请稍后重试'

    // 针对常见错误提供更友好的提示
    if (errorMessage.includes('邮箱已存在') || errorMessage.includes('already exists')) {
      errorMessage = '该邮箱已被注册，请使用其他邮箱或直接登录'
    } else if (errorMessage.includes('无效') || errorMessage.includes('invalid')) {
      errorMessage = '邮箱或密码格式不正确，请检查后重试'
    }

    ElMessage.error({
      message: errorMessage,
      duration: 3000
    })

    // 重置表单加载状态
    registerFormRef.value?.setLoading(false)
  }
}

/**
 * 跳转到登录页面
 */
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/**
 * 注册视图容器样式
 * 全屏居中布局
 */
.register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

/**
 * 注册内容容器
 */
.register-container {
  width: 100%;
  max-width: 480px;
  animation: fadeInUp 0.6s ease-out;
}

/**
 * 标题区域样式
 */
.register-header {
  text-align: center;
  margin-bottom: 30px;
  color: #ffffff;
}

.register-header .title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.register-header .subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/**
 * 注册卡片样式
 */
.register-card {
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background-color: var(--el-bg-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.register-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
}

/**
 * 额外链接区域样式
 */
.extra-links {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.link-text {
  margin-right: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

/**
 * 服务条款提示样式
 */
.terms-notice {
  text-align: center;
  margin-top: 15px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.terms-notice :deep(.el-text) {
  line-height: 1.6;
}

/**
 * 页脚样式
 */
.register-footer {
  text-align: center;
  margin-top: 30px;
  color: #ffffff;
  opacity: 0.8;
  font-size: 14px;
}

.register-footer p {
  margin: 0;
}

/**
 * 淡入上移动画
 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/**
 * 暗黑模式适配
 */
.dark .register-card {
  background-color: var(--el-bg-color);
}

.dark .terms-notice {
  background-color: var(--el-fill-color-dark);
}

/**
 * 响应式设计：平板设备
 */
@media screen and (max-width: 768px) {
  .register-header .title {
    font-size: 28px;
  }

  .register-header .subtitle {
    font-size: 14px;
  }

  .register-container {
    max-width: 100%;
  }
}

/**
 * 响应式设计：手机设备
 */
@media screen and (max-width: 480px) {
  .register-view {
    padding: 15px;
  }

  .register-header .title {
    font-size: 24px;
  }

  .register-header .subtitle {
    font-size: 13px;
  }

  .register-card {
    border-radius: 12px;
  }

  .register-header {
    margin-bottom: 20px;
  }

  .terms-notice {
    padding: 10px;
    margin-top: 12px;
  }

  .terms-notice :deep(.el-text) {
    font-size: 12px;
  }
}

/**
 * 高对比度模式支持
 */
@media (prefers-contrast: high) {
  .register-view {
    background: #000000;
  }

  .register-header {
    color: #ffffff;
  }
}

/**
 * 减少动画效果（用户偏好设置）
 */
@media (prefers-reduced-motion: reduce) {
  .register-container {
    animation: none;
  }

  .register-card {
    transition: none;
  }

  .register-card:hover {
    transform: none;
  }
}
</style>