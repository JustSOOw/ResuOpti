/**
 * Header组件单元测试
 * 测试顶部导航栏的各项功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRouter } from 'vue-router'
import Header from '@/components/common/Header.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { mountComponent, flushPromises, clickButton } from '../utils/test-utils'
import { ElMessage } from 'element-plus'

// Mock Vue Router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: vi.fn()
  }
})

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: vi.fn()
}))

describe('Header组件', () => {
  let mockPush: ReturnType<typeof vi.fn>
  let mockReplace: ReturnType<typeof vi.fn>

  /**
   * 测试前置设置
   * 重置所有mocks和stores状态
   */
  beforeEach(() => {
    // 清除所有mock调用记录
    vi.clearAllMocks()

    // Mock路由器
    mockPush = vi.fn()
    mockReplace = vi.fn()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: mockReplace
    })
  })

  /**
   * 测试场景1: 组件基础渲染
   * 验证组件能否正常挂载和显示基本元素
   */
  describe('基础渲染', () => {
    it('应该正确渲染组件结构', () => {
      const wrapper = mountComponent(Header)

      // 验证组件已挂载
      expect(wrapper.exists()).toBe(true)

      // 验证主要容器元素存在
      expect(wrapper.find('.header').exists()).toBe(true)
    })

    it('未登录时应该显示登录按钮', () => {
      // 设置未登录状态
      const authStore = useAuthStore()
      authStore.isAuthenticated = false

      const wrapper = mountComponent(Header)

      // 查找登录按钮
      const loginButton = wrapper.find('[data-testid="login-button"]')
      expect(loginButton.exists()).toBe(true)
      expect(loginButton.text()).toContain('登录')
    })

    it('登录后应该显示用户信息和退出按钮', () => {
      // 设置登录状态
      const authStore = useAuthStore()
      authStore.isAuthenticated = true
      authStore.user = {
        id: '123',
        username: '测试用户',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const wrapper = mountComponent(Header)

      // 验证用户信息显示
      expect(wrapper.text()).toContain('测试用户')

      // 验证退出按钮存在
      const logoutButton = wrapper.find('[data-testid="logout-button"]')
      expect(logoutButton.exists()).toBe(true)
    })
  })

  /**
   * 测试场景2: 登录功能
   * 测试用户点击登录按钮的行为
   */
  describe('登录功能', () => {
    it('点击登录按钮应该跳转到登录页面', async () => {
      const authStore = useAuthStore()
      authStore.isAuthenticated = false

      const wrapper = mountComponent(Header)

      // 点击登录按钮
      await clickButton(wrapper, '[data-testid="login-button"]')
      await flushPromises()

      // 验证路由跳转
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  /**
   * 测试场景3: 退出功能
   * 测试用户退出登录的完整流程
   */
  describe('退出功能', () => {
    it('点击退出按钮应该调用退出接口并跳转', async () => {
      // 设置登录状态
      const authStore = useAuthStore()
      authStore.isAuthenticated = true
      authStore.user = {
        id: '123',
        username: '测试用户',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Mock logout方法
      const mockLogout = vi.fn().mockResolvedValue(undefined)
      authStore.logout = mockLogout

      const wrapper = mountComponent(Header)

      // 点击退出按钮
      await clickButton(wrapper, '[data-testid="logout-button"]')
      await flushPromises()

      // 验证调用了logout方法
      expect(mockLogout).toHaveBeenCalled()

      // 验证显示成功消息
      expect(ElMessage).toHaveBeenCalledWith({
        type: 'success',
        message: expect.stringContaining('退出成功')
      })

      // 验证跳转到登录页
      expect(mockReplace).toHaveBeenCalledWith('/auth/login')
    })

    it('退出失败时应该显示错误提示', async () => {
      // 设置登录状态
      const authStore = useAuthStore()
      authStore.isAuthenticated = true
      authStore.user = {
        id: '123',
        username: '测试用户',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Mock logout方法抛出错误
      const mockLogout = vi.fn().mockRejectedValue(new Error('退出失败'))
      authStore.logout = mockLogout

      const wrapper = mountComponent(Header)
      const _themeStore = useThemeStore() // 使用 _ 前缀表示暂未使用

      // 点击退出按钮
      await clickButton(wrapper, '[data-testid="logout-button"]')
      await flushPromises()

      // 验证显示错误消息
      expect(ElMessage).toHaveBeenCalledWith({
        type: 'error',
        message: expect.stringContaining('退出失败')
      })

      // 验证没有跳转
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  /**
   * 测试场景4: 主题切换
   * 测试深色/浅色主题切换功能
   */
  describe('主题切换', () => {
    it('点击主题切换按钮应该切换主题', async () => {
      const themeStore = useThemeStore()
      themeStore.isDark = false

      // Mock toggleTheme方法
      const mockToggleTheme = vi.fn()
      themeStore.toggleTheme = mockToggleTheme

      const wrapper = mountComponent(Header)

      // 点击主题切换按钮
      await clickButton(wrapper, '[data-testid="theme-toggle"]')
      await flushPromises()

      // 验证调用了toggleTheme方法
      expect(mockToggleTheme).toHaveBeenCalled()
    })
  })
})