/**
 * useAuth Composable
 * 提供用户认证相关的Composition API逻辑复用
 * 封装认证状态管理、登录、注册、登出等功能
 */

import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { login as loginApi, register as registerApi } from '@/services/auth'
import type { User } from '@/stores/auth'

/**
 * 认证错误类型
 */
export interface AuthError {
  message: string
  code?: string
}

/**
 * useAuth返回值接口
 */
export interface UseAuthReturn {
  // ==================== 状态 ====================
  /** 当前登录用户信息 */
  user: import('vue').ComputedRef<User | null>
  /** 是否已认证 */
  isAuthenticated: import('vue').ComputedRef<boolean>
  /** 是否正在加载 */
  isLoading: import('vue').ComputedRef<boolean>
  /** 错误信息 */
  error: import('vue').Ref<AuthError | null>

  // ==================== 方法 ====================
  /** 处理用户登录 */
  handleLogin: (email: string, password: string) => Promise<boolean>
  /** 处理用户注册 */
  handleRegister: (email: string, password: string) => Promise<boolean>
  /** 处理用户登出 */
  handleLogout: () => void
  /** 清除错误信息 */
  clearError: () => void
  /** 检查认证状态 */
  checkAuth: () => Promise<boolean>
}

/**
 * useAuth Composable
 * 提供认证相关的状态和操作方法
 *
 * @returns {UseAuthReturn} 认证状态和方法
 *
 * @example
 * ```ts
 * const {
 *   user,
 *   isAuthenticated,
 *   isLoading,
 *   error,
 *   handleLogin,
 *   handleLogout
 * } = useAuth()
 *
 * // 登录
 * await handleLogin('user@example.com', 'password123')
 *
 * // 登出
 * handleLogout()
 * ```
 */
export function useAuth(): UseAuthReturn {
  // ==================== Store实例 ====================

  /**
   * 获取认证Store实例
   */
  const authStore = useAuthStore()

  // ==================== 本地状态 ====================

  /**
   * 错误信息状态
   */
  const error = ref<AuthError | null>(null)

  // ==================== 计算属性 ====================

  /**
   * 当前登录用户
   * 从store中读取
   */
  const user = computed(() => authStore.user)

  /**
   * 是否已认证
   * 从store中读取
   */
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  /**
   * 是否正在加载
   * 从store中读取
   */
  const isLoading = computed(() => authStore.isLoading)

  // ==================== 方法 ====================

  /**
   * 清除错误信息
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * 处理用户登录
   *
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @returns Promise<boolean> - 登录是否成功
   *
   * @example
   * ```ts
   * const success = await handleLogin('user@example.com', 'password123')
   * if (success) {
   *   console.log('登录成功')
   * } else {
   *   console.log('登录失败:', error.value?.message)
   * }
   * ```
   */
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    // 清除之前的错误
    clearError()

    try {
      // 调用登录API
      const response = await loginApi(email, password)

      // 检查响应是否成功
      if (response.success && response.data) {
        // 更新store中的认证信息
        authStore.setAuth(response.data.token, response.data.user)
        return true
      } else {
        // 登录失败但没有抛出异常
        error.value = {
          message: response.message || '登录失败',
          code: 'LOGIN_FAILED'
        }
        return false
      }
    } catch (err: any) {
      // 捕获并处理错误
      error.value = {
        message: err.message || '登录失败，请稍后重试',
        code: err.code || 'LOGIN_ERROR'
      }
      console.error('登录失败:', err)
      return false
    }
  }

  /**
   * 处理用户注册
   *
   * @param email - 用户邮箱（必须是有效的邮箱格式）
   * @param password - 用户密码（最少8位，包含字母和数字）
   * @returns Promise<boolean> - 注册是否成功
   *
   * @example
   * ```ts
   * const success = await handleRegister('user@example.com', 'password123')
   * if (success) {
   *   console.log('注册成功')
   * } else {
   *   console.log('注册失败:', error.value?.message)
   * }
   * ```
   */
  const handleRegister = async (email: string, password: string): Promise<boolean> => {
    // 清除之前的错误
    clearError()

    try {
      // 调用注册API
      const response = await registerApi(email, password)

      // 检查响应是否成功
      if (response.success) {
        // 注册成功，可以选择自动登录
        // 这里返回成功，让用户手动登录
        return true
      } else {
        // 注册失败但没有抛出异常
        error.value = {
          message: response.message || '注册失败',
          code: 'REGISTER_FAILED'
        }
        return false
      }
    } catch (err: any) {
      // 捕获并处理错误
      error.value = {
        message: err.message || '注册失败，请稍后重试',
        code: err.code || 'REGISTER_ERROR'
      }
      console.error('注册失败:', err)
      return false
    }
  }

  /**
   * 处理用户登出
   * 清除所有认证信息
   *
   * @example
   * ```ts
   * handleLogout()
   * // 用户已登出，可以跳转到登录页
   * ```
   */
  const handleLogout = (): void => {
    try {
      // 清除错误信息
      clearError()

      // 调用store的登出方法
      authStore.logout()

      // 可以在这里添加额外的登出逻辑
      // 例如：清除其他store的数据、跳转到登录页等
    } catch (err: any) {
      console.error('登出失败:', err)
      error.value = {
        message: '登出失败，请稍后重试',
        code: 'LOGOUT_ERROR'
      }
    }
  }

  /**
   * 检查认证状态
   * 验证当前token是否有效
   *
   * @returns Promise<boolean> - 认证是否有效
   *
   * @example
   * ```ts
   * const isValid = await checkAuth()
   * if (!isValid) {
   *   // token无效，跳转到登录页
   * }
   * ```
   */
  const checkAuth = async (): Promise<boolean> => {
    try {
      // 调用store的认证状态检查方法
      const isValid = await authStore.checkAuthStatus()

      if (!isValid) {
        // 认证无效，清除错误信息（因为这不是真正的错误）
        clearError()
      }

      return isValid
    } catch (err: any) {
      console.error('检查认证状态失败:', err)
      error.value = {
        message: '检查认证状态失败',
        code: 'CHECK_AUTH_ERROR'
      }
      return false
    }
  }

  // ==================== 生命周期 ====================

  /**
   * 组件挂载时初始化
   * 从localStorage恢复认证状态
   */
  onMounted(() => {
    try {
      // 从localStorage恢复认证状态
      authStore.loadAuthFromStorage()

      // 检查token有效性
      if (authStore.token) {
        checkAuth()
      }
    } catch (err) {
      console.error('初始化认证状态失败:', err)
    }
  })

  // ==================== 返回公开的API ====================

  return {
    // 状态
    user,
    isAuthenticated,
    isLoading,
    error,

    // 方法
    handleLogin,
    handleRegister,
    handleLogout,
    clearError,
    checkAuth
  }
}