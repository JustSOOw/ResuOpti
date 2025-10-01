/**
 * 用户认证状态管理
 * 管理用户登录状态、token和用户信息
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户信息接口
 */
export interface User {
  id: string
  email: string
  createdAt: string
}

/**
 * 认证状态接口
 */
export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

/**
 * localStorage的key常量
 */
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * 认证Store
 * 使用Composition API风格定义
 */
export const useAuthStore = defineStore('auth', () => {
  // ==================== 状态定义 ====================

  /**
   * 当前登录用户信息
   */
  const user = ref<User | null>(null)

  /**
   * JWT认证令牌
   */
  const token = ref<string | null>(null)

  /**
   * 加载状态
   */
  const isLoading = ref<boolean>(false)

  // ==================== 计算属性 ====================

  /**
   * 是否已认证
   * 基于token和user是否存在来判断
   */
  const isAuthenticated = computed<boolean>(() => !!token.value && !!user.value)

  // ==================== Actions ====================

  /**
   * 设置用户信息
   * @param userData - 用户数据
   */
  const setUser = (userData: User | null): void => {
    user.value = userData
    if (userData) {
      // 将用户信息存储到localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    } else {
      // 清除localStorage中的用户信息
      localStorage.removeItem(USER_KEY)
    }
  }

  /**
   * 设置认证令牌
   * @param tokenValue - JWT令牌
   */
  const setToken = (tokenValue: string | null): void => {
    token.value = tokenValue
    if (tokenValue) {
      // 将token存储到localStorage
      localStorage.setItem(TOKEN_KEY, tokenValue)
    } else {
      // 清除localStorage中的token
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  /**
   * 清除所有认证信息
   * 用于登出或token失效时
   */
  const clearAuth = (): void => {
    user.value = null
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  /**
   * 从localStorage恢复认证状态
   * 应在应用初始化时调用
   */
  const loadAuthFromStorage = (): void => {
    try {
      // 从localStorage读取token
      const storedToken = localStorage.getItem(TOKEN_KEY)
      if (storedToken) {
        token.value = storedToken
      }

      // 从localStorage读取用户信息
      const storedUser = localStorage.getItem(USER_KEY)
      if (storedUser) {
        user.value = JSON.parse(storedUser) as User
      }
    } catch (error) {
      console.error('恢复认证状态失败:', error)
      // 如果解析失败，清除所有认证信息
      clearAuth()
    }
  }

  /**
   * 退出登录
   * 清除所有认证信息并可选择性跳转到登录页
   */
  const logout = (): void => {
    clearAuth()
    // 可以在这里添加额外的登出逻辑，比如调用后端登出API
  }

  /**
   * 检查认证状态有效性
   * 验证当前token是否有效
   * @returns 认证是否有效
   */
  const checkAuthStatus = async (): Promise<boolean> => {
    // 如果没有token，直接返回false
    if (!token.value) {
      clearAuth()
      return false
    }

    try {
      isLoading.value = true

      // 可以在这里添加验证token有效性的API调用
      // 例如：await apiClient.get('/auth/verify')

      // 简单的token格式检查（JWT token通常由三部分组成，用.分隔）
      const tokenParts = token.value.split('.')
      if (tokenParts.length !== 3) {
        clearAuth()
        return false
      }

      // 检查token是否过期（解析JWT的payload部分）
      try {
        const payload = JSON.parse(atob(tokenParts[1]))
        const exp = payload.exp

        if (exp) {
          // exp是Unix时间戳（秒），需要转换为毫秒
          const expirationTime = exp * 1000
          const currentTime = Date.now()

          if (currentTime >= expirationTime) {
            // token已过期
            clearAuth()
            return false
          }
        }
      } catch (error) {
        console.error('解析token失败:', error)
        // 解析失败也认为token无效
        clearAuth()
        return false
      }

      return true
    } catch (error) {
      console.error('检查认证状态失败:', error)
      clearAuth()
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 设置完整的认证信息
   * 通常在登录成功后调用
   * @param tokenValue - JWT令牌
   * @param userData - 用户信息
   */
  const setAuth = (tokenValue: string, userData: User): void => {
    setToken(tokenValue)
    setUser(userData)
  }

  // ==================== 返回公开的API ====================

  return {
    // 状态
    user,
    token,
    isLoading,

    // 计算属性
    isAuthenticated,

    // Actions
    setUser,
    setToken,
    setAuth,
    clearAuth,
    loadAuthFromStorage,
    logout,
    checkAuthStatus
  }
})
