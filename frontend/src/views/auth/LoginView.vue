<!--
  用户登录页面
  提供用户登录功能，支持邮箱密码登录
-->
<template>
  <div class="login-view">
    <!-- 登录容器 -->
    <div class="login-container">
      <!-- 标题区域 -->
      <div class="login-header">
        <h1 class="title">欢迎回来</h1>
        <p class="subtitle">登录您的账户以继续使用 ResuOpti</p>
      </div>

      <!-- 登录卡片 -->
      <el-card class="login-card" shadow="always">
        <!-- 使用已有的LoginForm组件 -->
        <LoginForm
          ref="loginFormRef"
          mode="login"
          @submit="handleLogin"
        />

        <!-- 额外链接 -->
        <div class="extra-links">
          <span class="link-text">还没有账号？</span>
          <el-link type="primary" @click="goToRegister">
            立即注册
          </el-link>
        </div>
      </el-card>

      <!-- 页脚信息 -->
      <div class="login-footer">
        <p>&copy; 2025 ResuOpti. 保留所有权利。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import LoginForm, { type LoginFormSubmitData } from '@/components/forms/LoginForm.vue'
import { login } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

// ==================== 路由和Store ====================

/**
 * Vue Router实例
 */
const router = useRouter()

/**
 * Vue Route实例（用于获取query参数）
 */
const route = useRoute()

/**
 * 认证Store实例
 */
const authStore = useAuthStore()

// ==================== 组件引用 ====================

/**
 * LoginForm组件引用
 */
const loginFormRef = ref<InstanceType<typeof LoginForm>>()

// ==================== 方法定义 ====================

/**
 * 处理登录表单提交
 * @param formData - 表单数据（包含email和password）
 */
const handleLogin = async (formData: LoginFormSubmitData) => {
  try {
    // 调用登录API
    const response = await login(formData.email, formData.password)

    // 检查登录是否成功
    if (response.success && response.data) {
      // 设置认证信息到Store
      authStore.setAuth(response.data.token, response.data.user)

      // 显示成功消息
      ElMessage.success({
        message: response.message || '登录成功！',
        duration: 2000
      })

      // 获取重定向目标，如果有redirect参数则跳转到该页面，否则跳转到仪表板
      const redirectPath = (route.query.redirect as string) || '/dashboard'

      // 跳转页面
      // 使用replace而不是push，防止用户通过后退按钮回到登录页
      await router.replace(redirectPath)
    } else {
      // 登录失败（虽然不应该走到这里，因为API会抛出异常）
      ElMessage.error('登录失败，请重试')

      // 重置表单加载状态
      loginFormRef.value?.setLoading(false)
    }
  } catch (error: any) {
    // 处理登录错误
    console.error('登录失败:', error)

    // 显示错误消息
    const errorMessage = error.message || '登录失败，请检查您的邮箱和密码'
    ElMessage.error({
      message: errorMessage,
      duration: 3000
    })

    // 重置表单加载状态
    loginFormRef.value?.setLoading(false)
  }
}

/**
 * 跳转到注册页面
 */
const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
/**
 * 登录视图容器样式
 * 全屏居中布局
 */
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/**
 * 登录内容容器
 */
.login-container {
  width: 100%;
  max-width: 480px;
  animation: fadeInUp 0.6s ease-out;
}

/**
 * 标题区域样式
 */
.login-header {
  text-align: center;
  margin-bottom: 30px;
  color: #ffffff;
}

.login-header .title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-header .subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/**
 * 登录卡片样式
 */
.login-card {
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background-color: var(--el-bg-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
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
 * 页脚样式
 */
.login-footer {
  text-align: center;
  margin-top: 30px;
  color: #ffffff;
  opacity: 0.8;
  font-size: 14px;
}

.login-footer p {
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
.dark .login-card {
  background-color: var(--el-bg-color);
}

/**
 * 响应式设计：平板设备
 */
@media screen and (max-width: 768px) {
  .login-header .title {
    font-size: 28px;
  }

  .login-header .subtitle {
    font-size: 14px;
  }

  .login-container {
    max-width: 100%;
  }
}

/**
 * 响应式设计：手机设备
 */
@media screen and (max-width: 480px) {
  .login-view {
    padding: 15px;
  }

  .login-header .title {
    font-size: 24px;
  }

  .login-header .subtitle {
    font-size: 13px;
  }

  .login-card {
    border-radius: 12px;
  }

  .login-header {
    margin-bottom: 20px;
  }
}

/**
 * 高对比度模式支持
 */
@media (prefers-contrast: high) {
  .login-view {
    background: #000000;
  }

  .login-header {
    color: #ffffff;
  }
}

/**
 * 减少动画效果（用户偏好设置）
 */
@media (prefers-reduced-motion: reduce) {
  .login-container {
    animation: none;
  }

  .login-card {
    transition: none;
  }

  .login-card:hover {
    transform: none;
  }
}
</style>