<!--
  通用顶部导航栏组件
  功能：
  1. 显示应用Logo和名称
  2. 主题切换按钮
  3. 用户信息显示
  4. 退出登录功能
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { Moon, Sunny, User, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

/**
 * Props定义
 */
interface HeaderProps {
  /** 是否显示Logo */
  showLogo?: boolean
}

const props = withDefaults(defineProps<HeaderProps>(), {
  showLogo: true
})

// ==================== Stores ====================

/** 认证状态管理 */
const authStore = useAuthStore()

/** 主题状态管理 */
const themeStore = useThemeStore()

/** 路由实例 */
const router = useRouter()

// ==================== 计算属性 ====================

/**
 * 获取当前用户邮箱
 */
const userEmail = computed(() => authStore.user?.email || '未登录')

/**
 * 获取用户名首字母（用于头像显示）
 */
const userInitial = computed(() => {
  const email = authStore.user?.email
  if (!email) return 'U'
  return email.charAt(0).toUpperCase()
})

/**
 * 是否为暗黑主题
 */
const isDark = computed(() => themeStore.isDark)

// ==================== 方法 ====================

/**
 * 切换主题
 */
const handleThemeToggle = (): void => {
  themeStore.toggleTheme()
  ElMessage({
    message: `已切换到${isDark.value ? '暗黑' : '亮色'}主题`,
    type: 'success',
    duration: 1500
  })
}

/**
 * 退出登录
 */
const handleLogout = async (): Promise<void> => {
  try {
    // 调用store的logout方法
    authStore.logout()

    ElMessage({
      message: '退出登录成功',
      type: 'success',
      duration: 2000
    })

    // 跳转到登录页
    await router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    ElMessage({
      message: '退出登录失败，请重试',
      type: 'error',
      duration: 2000
    })
  }
}
</script>

<template>
  <el-header class="app-header">
    <div class="header-content">
      <!-- 左侧：Logo和应用名称 -->
      <div v-if="props.showLogo" class="header-left">
        <div class="logo-container">
          <div class="logo-icon">R</div>
          <span class="app-name">ResuOpti</span>
        </div>
      </div>

      <!-- 右侧：主题切换、用户信息、退出登录 -->
      <div class="header-right">
        <!-- 主题切换按钮 -->
        <el-tooltip :content="isDark ? '切换到亮色主题' : '切换到暗黑主题'" placement="bottom">
          <el-button
            class="theme-toggle-btn"
            :icon="isDark ? Sunny : Moon"
            circle
            @click="handleThemeToggle"
          />
        </el-tooltip>

        <!-- 用户下拉菜单 -->
        <el-dropdown v-if="authStore.isAuthenticated" class="user-dropdown" @command="handleLogout">
          <div class="user-info">
            <el-avatar class="user-avatar" :size="32">
              {{ userInitial }}
            </el-avatar>
            <span class="user-email">{{ userEmail }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <el-icon><User /></el-icon>
                <span>{{ userEmail }}</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录状态 -->
        <div v-else class="user-info-guest">
          <span class="guest-text">未登录</span>
        </div>
      </div>
    </div>
  </el-header>
</template>

<style scoped>
/**
 * 顶部导航栏容器
 */
.app-header {
  height: 60px;
  padding: 0;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

/**
 * 头部内容容器 - 使用flex布局
 */
.header-content {
  height: 100%;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/**
 * 左侧区域 - Logo和应用名称
 */
.header-left {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.05);
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.3s ease;
}

/**
 * 右侧区域 - 主题切换和用户信息
 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/**
 * 主题切换按钮
 */
.theme-toggle-btn {
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: rotate(180deg);
}

/**
 * 用户信息容器
 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.user-avatar {
  background-color: var(--el-color-primary);
  color: white;
  font-weight: 600;
}

.user-email {
  font-size: 14px;
  color: var(--el-text-color-primary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/**
 * 访客状态显示
 */
.user-info-guest {
  padding: 4px 12px;
  border-radius: 20px;
  background-color: var(--el-fill-color-light);
}

.guest-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/**
 * 用户下拉菜单样式调整
 */
.user-dropdown {
  height: 100%;
  display: flex;
  align-items: center;
}

/**
 * 响应式设计 - 平板和手机
 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .app-name {
    display: none;
  }

  .user-email {
    display: none;
  }

  .header-right {
    gap: 8px;
  }
}

/**
 * 响应式设计 - 小手机
 */
@media (max-width: 480px) {
  .header-content {
    padding: 0 12px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}

/**
 * 暗黑主题特定样式
 */
:deep(.dark) .app-header {
  background-color: var(--el-bg-color);
  border-bottom-color: var(--el-border-color);
}
</style>
