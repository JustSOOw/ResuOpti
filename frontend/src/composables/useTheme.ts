/**
 * 主题 Composable
 * 封装主题切换的 Composition API 逻辑，提供便捷的主题操作方法
 * 复用 themeStore 的核心逻辑，简化组件中的主题管理
 */

import { computed, onMounted } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

/**
 * 主题 Composable
 *
 * 提供简化的主题管理 API，封装 themeStore 的访问和操作
 *
 * @param options - 配置选项
 * @param options.autoInit - 是否在组件挂载时自动初始化主题，默认为 false
 *
 * @returns 主题状态和操作方法
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTheme } from '@/composables/useTheme'
 *
 * const {
 *   isDark,
 *   themeMode,
 *   currentTheme,
 *   toggleTheme,
 *   setLightTheme,
 *   setDarkTheme,
 *   setAutoTheme,
 *   isCurrentTheme,
 *   getThemeClass
 * } = useTheme({ autoInit: true })
 * </script>
 *
 * <template>
 *   <button @click="toggleTheme">
 *     {{ isDark ? '切换到亮色' : '切换到暗黑' }}
 *   </button>
 * </template>
 * ```
 */
export function useTheme(options: { autoInit?: boolean } = {}) {
  const { autoInit = false } = options

  // 获取主题 store 实例
  const themeStore = useThemeStore()

  // ==================== 响应式状态 ====================

  /**
   * 是否为暗黑模式
   * 根据当前应用的主题决定
   */
  const isDark = computed(() => themeStore.isDark)

  /**
   * 用户设置的主题模式
   * light | dark | auto
   */
  const themeMode = computed(() => themeStore.themeMode)

  /**
   * 当前实际应用的主题
   * 在 auto 模式下，根据系统偏好决定
   */
  const currentTheme = computed(() => themeStore.currentTheme)

  /**
   * 系统是否偏好暗黑模式
   */
  const systemPrefersDark = computed(() => themeStore.systemPrefersDark)

  // ==================== 主题操作方法 ====================

  /**
   * 切换主题
   * 在 light 和 dark 之间切换（不包括 auto）
   *
   * @example
   * toggleTheme() // light -> dark 或 dark -> light
   */
  const toggleTheme = (): void => {
    themeStore.toggleTheme()
  }

  /**
   * 设置亮色主题
   *
   * @example
   * setLightTheme() // 设置为亮色模式
   */
  const setLightTheme = (): void => {
    themeStore.setTheme('light')
  }

  /**
   * 设置暗黑主题
   *
   * @example
   * setDarkTheme() // 设置为暗黑模式
   */
  const setDarkTheme = (): void => {
    themeStore.setTheme('dark')
  }

  /**
   * 设置自动模式
   * 跟随系统主题偏好
   *
   * @example
   * setAutoTheme() // 设置为跟随系统
   */
  const setAutoTheme = (): void => {
    themeStore.setTheme('auto')
  }

  /**
   * 设置指定的主题模式
   *
   * @param mode - 要设置的主题模式
   *
   * @example
   * setTheme('dark') // 设置为暗黑模式
   * setTheme('auto') // 设置为自动模式
   */
  const setTheme = (mode: ThemeMode): void => {
    themeStore.setTheme(mode)
  }

  // ==================== 便捷方法 ====================

  /**
   * 检查是否为指定的主题模式
   *
   * @param mode - 要检查的主题模式
   * @returns 是否为指定的主题模式
   *
   * @example
   * isCurrentTheme('dark') // 检查当前是否为暗黑模式
   * isCurrentTheme('auto') // 检查当前是否为自动模式
   */
  const isCurrentTheme = (mode: ThemeMode): boolean => {
    return themeStore.themeMode === mode
  }

  /**
   * 获取当前主题的 CSS 类名
   * 返回 'light' 或 'dark'
   *
   * @returns 当前主题的类名
   *
   * @example
   * const themeClass = getThemeClass()
   * // 在模板中使用: <div :class="themeClass">...</div>
   */
  const getThemeClass = (): 'light' | 'dark' => {
    return themeStore.currentTheme
  }

  /**
   * 获取主题图标名称
   * 用于显示当前主题状态的图标
   *
   * @returns 主题图标名称
   *
   * @example
   * const icon = getThemeIcon()
   * // 'Sunny' (亮色), 'Moon' (暗黑), 'Monitor' (自动)
   */
  const getThemeIcon = (): string => {
    switch (themeStore.themeMode) {
      case 'light':
        return 'Sunny'
      case 'dark':
        return 'Moon'
      case 'auto':
        return 'Monitor'
      default:
        return 'Monitor'
    }
  }

  /**
   * 获取主题显示文本
   * 用于显示当前主题状态的文本
   *
   * @returns 主题显示文本
   *
   * @example
   * const text = getThemeText()
   * // '亮色模式', '暗黑模式', '跟随系统'
   */
  const getThemeText = (): string => {
    switch (themeStore.themeMode) {
      case 'light':
        return '亮色模式'
      case 'dark':
        return '暗黑模式'
      case 'auto':
        return '跟随系统'
      default:
        return '跟随系统'
    }
  }

  // ==================== 初始化 ====================

  /**
   * 初始化主题
   * 如果设置了 autoInit，则在组件挂载时自动初始化
   */
  if (autoInit) {
    onMounted(() => {
      themeStore.initTheme()
    })
  }

  // ==================== 返回公开的状态和方法 ====================

  return {
    // 响应式状态
    isDark,
    themeMode,
    currentTheme,
    systemPrefersDark,

    // 主题操作方法
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    setTheme,

    // 便捷方法
    isCurrentTheme,
    getThemeClass,
    getThemeIcon,
    getThemeText,

    // Store 实例（用于高级操作）
    themeStore,
  }
}