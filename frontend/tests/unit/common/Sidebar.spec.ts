/**
 * Sidebar组件单元测试
 * 测试侧边栏导航的各项功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '@/components/common/Sidebar.vue'
import { mountComponent, clickButton } from '../utils/test-utils' // 移除未使用的 flushPromises

// Mock Vue Router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: vi.fn(),
    useRoute: vi.fn()
  }
})

describe('Sidebar.vue', () => {
  let mockRouter: any
  let mockRoute: any

  beforeEach(() => {
    vi.clearAllMocks()

    // 创建mock router和route
    mockRouter = {
      push: vi.fn()
    }
    mockRoute = {
      path: '/dashboard'
    }
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useRoute as any).mockReturnValue(mockRoute)
  })

  describe('组件渲染', () => {
    it('应该正确渲染Sidebar组件', async () => {
      const wrapper = await mountComponent(Sidebar)
      expect(wrapper.find('.app-sidebar').exists()).toBe(true)
    })

    it('应该渲染所有菜单项', async () => {
      const wrapper = await mountComponent(Sidebar)

      // 检查菜单项是否存在
      const menuItems = wrapper.findAll('.el-menu-item')
      expect(menuItems.length).toBeGreaterThanOrEqual(3)
    })

    it('应该显示折叠/展开按钮', async () => {
      const wrapper = await mountComponent(Sidebar)
      expect(wrapper.find('.collapse-btn').exists()).toBe(true)
    })
  })

  describe('菜单项配置', () => {
    it('应该包含仪表板菜单项', async () => {
      const wrapper = await mountComponent(Sidebar)
      const vm = wrapper.vm as any

      const dashboardItem = vm.menuItems.find((item: any) => item.id === '/dashboard')
      expect(dashboardItem).toBeDefined()
      expect(dashboardItem.title).toBe('仪表板')
    })

    it('应该包含目标岗位菜单项', async () => {
      const wrapper = await mountComponent(Sidebar)
      const vm = wrapper.vm as any

      const positionsItem = vm.menuItems.find((item: any) => item.id === '/positions')
      expect(positionsItem).toBeDefined()
      expect(positionsItem.title).toBe('目标岗位')
    })

    it('应该包含我的简历菜单项', async () => {
      const wrapper = await mountComponent(Sidebar)
      const vm = wrapper.vm as any

      const resumesItem = vm.menuItems.find((item: any) => item.id === '/resumes')
      expect(resumesItem).toBeDefined()
      expect(resumesItem.title).toBe('我的简历')
    })
  })

  describe('激活菜单项', () => {
    it('当前路由为/dashboard时，仪表板应该被激活', async () => {
      mockRoute.path = '/dashboard'
      const wrapper = await mountComponent(Sidebar)

      const vm = wrapper.vm as any
      expect(vm.activeMenu).toBe('/dashboard')
    })

    it('当前路由为/positions时，目标岗位应该被激活', async () => {
      mockRoute.path = '/positions'
      const wrapper = await mountComponent(Sidebar)

      const vm = wrapper.vm as any
      expect(vm.activeMenu).toBe('/positions')
    })

    it('当前路由为/resumes时，我的简历应该被激活', async () => {
      mockRoute.path = '/resumes'
      const wrapper = await mountComponent(Sidebar)

      const vm = wrapper.vm as any
      expect(vm.activeMenu).toBe('/resumes')
    })

    it('当前路由包含子路径时，应该匹配父路径', async () => {
      mockRoute.path = '/positions/123'
      const wrapper = await mountComponent(Sidebar)

      const vm = wrapper.vm as any
      expect(vm.activeMenu).toBe('/positions')
    })
  })

  describe('折叠功能', () => {
    it('默认应该是展开状态', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { defaultCollapsed: false }
      })

      const vm = wrapper.vm as any
      expect(vm.isCollapsed).toBe(false)
    })

    it('当defaultCollapsed为true时，应该默认折叠', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { defaultCollapsed: true }
      })

      const vm = wrapper.vm as any
      expect(vm.isCollapsed).toBe(true)
    })

    it('点击折叠按钮应该切换折叠状态', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { defaultCollapsed: false }
      })

      const vm = wrapper.vm as any
      const initialCollapsed = vm.isCollapsed

      // 点击折叠按钮
      await clickButton(wrapper, '.collapse-btn')

      expect(vm.isCollapsed).toBe(!initialCollapsed)
    })

    it('折叠状态改变时应该触发collapse-change事件', async () => {
      const wrapper = await mountComponent(Sidebar)

      // 点击折叠按钮
      await clickButton(wrapper, '.collapse-btn')

      expect(wrapper.emitted('collapse-change')).toBeTruthy()
      expect(wrapper.emitted('collapse-change')?.[0]).toEqual([true])
    })

    it('展开状态下侧边栏宽度应该为默认宽度', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { width: '240px', defaultCollapsed: false }
      })

      const vm = wrapper.vm as any
      expect(vm.sidebarWidth).toBe('240px')
    })

    it('折叠状态下侧边栏宽度应该为折叠宽度', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { collapsedWidth: '64px', defaultCollapsed: true }
      })

      const vm = wrapper.vm as any
      expect(vm.sidebarWidth).toBe('64px')
    })
  })

  describe('菜单导航', () => {
    it('点击菜单项应该导航到对应路由', async () => {
      const wrapper = await mountComponent(Sidebar)
      const vm = wrapper.vm as any

      // 获取菜单项
      const dashboardItem = vm.menuItems[0]

      // 调用handleMenuSelect
      vm.handleMenuSelect(dashboardItem)

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('点击禁用的菜单项不应该导航', async () => {
      const wrapper = await mountComponent(Sidebar)
      const vm = wrapper.vm as any

      // 创建禁用的菜单项
      const disabledItem = {
        id: '/disabled',
        title: '禁用菜单',
        path: '/disabled',
        disabled: true
      }

      vm.handleMenuSelect(disabledItem)

      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('Props测试', () => {
    it('应该接受defaultCollapsed prop', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { defaultCollapsed: true }
      })

      expect(wrapper.props('defaultCollapsed')).toBe(true)
    })

    it('应该接受width prop', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { width: '280px' }
      })

      expect(wrapper.props('width')).toBe('280px')
    })

    it('应该接受collapsedWidth prop', async () => {
      const wrapper = await mountComponent(Sidebar, {
        props: { collapsedWidth: '80px' }
      })

      expect(wrapper.props('collapsedWidth')).toBe('80px')
    })

    it('默认Props应该正确设置', async () => {
      const wrapper = await mountComponent(Sidebar)

      expect(wrapper.props('defaultCollapsed')).toBe(false)
      expect(wrapper.props('width')).toBe('240px')
      expect(wrapper.props('collapsedWidth')).toBe('64px')
    })
  })
})
