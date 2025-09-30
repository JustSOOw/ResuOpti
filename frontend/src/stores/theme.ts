/**
 * 主题状态管理 Store
 * 使用 Pinia 管理应用主题状态，支持亮色、暗黑和自动模式
 * 配合 Element Plus 的暗黑主题系统实现主题切换
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/**
 * 主题模式类型定义
 * - light: 亮色模式
 * - dark: 暗黑模式
 * - auto: 跟随系统主题
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 主题状态接口定义
 */
export interface ThemeState {
  /** 是否为暗黑模式 */
  isDark: boolean
  /** 主题模式设置 */
  themeMode: ThemeMode
  /** 系统是否偏好暗黑模式 */
  systemPrefersDark: boolean
}

/**
 * localStorage 存储键名
 */
const THEME_STORAGE_KEY = 'theme-mode'

/**
 * 主题状态管理 Store
 */
export const useThemeStore = defineStore('theme', () => {
  // ==================== State ====================

  /** 是否为暗黑模式 */
  const isDark = ref<boolean>(false)

  /** 主题模式设置 */
  const themeMode = ref<ThemeMode>('auto')

  /** 系统是否偏好暗黑模式 */
  const systemPrefersDark = ref<boolean>(false)

  /** 系统主题媒体查询对象 */
  let systemThemeMediaQuery: MediaQueryList | null = null

  // ==================== Getters ====================

  /**
   * 当前实际应用的主题
   * 在 auto 模式下，根据系统偏好决定
   */
  const currentTheme = computed<'light' | 'dark'>(() => {
    if (themeMode.value === 'auto') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return themeMode.value
  })

  // ==================== Actions ====================

  /**
   * 切换亮色/暗黑模式
   * 在 light 和 dark 之间切换（不包括 auto）
   */
  const toggleTheme = (): void => {
    if (themeMode.value === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  /**
   * 设置指定的主题模式
   * @param mode - 要设置的主题模式
   */
  const setTheme = (mode: ThemeMode): void => {
    themeMode.value = mode

    // 持久化到 localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch (error) {
      console.warn('无法保存主题偏好到 localStorage:', error)
    }

    // 应用主题
    applyTheme()
  }

  /**
   * 应用主题到 DOM
   * 根据当前主题添加或移除 dark 类名
   */
  const applyTheme = (): void => {
    const theme = currentTheme.value
    isDark.value = theme === 'dark'

    // Element Plus 使用 html 元素的 dark 类来切换主题
    const htmlElement = document.documentElement

    if (theme === 'dark') {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }

  /**
   * 从 localStorage 加载主题偏好
   */
  const loadThemeFromStorage = (): void => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        themeMode.value = savedTheme as ThemeMode
      }
    } catch (error) {
      console.warn('无法从 localStorage 读取主题偏好:', error)
    }
  }

  /**
   * 检测系统主题偏好
   * 使用 window.matchMedia API 检测系统暗黑模式偏好
   */
  const detectSystemTheme = (): void => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    // 创建媒体查询
    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    // 设置初始值
    systemPrefersDark.value = systemThemeMediaQuery.matches

    // 监听系统主题变化
    const handleThemeChange = (event: MediaQueryListEvent | MediaQueryList): void => {
      systemPrefersDark.value = event.matches

      // 如果当前是 auto 模式，则应用主题变化
      if (themeMode.value === 'auto') {
        applyTheme()
      }
    }

    // 兼容不同浏览器的事件监听方式
    if (systemThemeMediaQuery.addEventListener) {
      systemThemeMediaQuery.addEventListener('change', handleThemeChange)
    } else if (systemThemeMediaQuery.addListener) {
      // 兼容旧版浏览器
      systemThemeMediaQuery.addListener(handleThemeChange)
    }
  }

  /**
   * 初始化主题
   * 按顺序执行：加载存储的主题 -> 检测系统主题 -> 应用主题
   * 应在应用启动时调用
   */
  const initTheme = (): void => {
    // 1. 从 localStorage 加载用户设置的主题偏好
    loadThemeFromStorage()

    // 2. 检测系统主题偏好
    detectSystemTheme()

    // 3. 应用主题到 DOM
    applyTheme()
  }

  // ==================== 监听主题模式变化 ====================

  /**
   * 监听 themeMode 变化，自动应用主题
   */
  watch(themeMode, () => {
    applyTheme()
  })

  /**
   * 监听系统主题偏好变化
   * 在 auto 模式下自动应用主题
   */
  watch(systemPrefersDark, () => {
    if (themeMode.value === 'auto') {
      applyTheme()
    }
  })

  // ==================== 返回公开的状态和方法 ====================

  return {
    // State
    isDark,
    themeMode,
    systemPrefersDark,

    // Getters
    currentTheme,

    // Actions
    toggleTheme,
    setTheme,
    applyTheme,
    loadThemeFromStorage,
    detectSystemTheme,
    initTheme,
  }
})