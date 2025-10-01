/**
 * Loading组件单元测试
 * 测试加载指示器的各项功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Loading from '@/components/common/Loading.vue'
import { useThemeStore } from '@/stores/theme'
import { mountComponent, flushPromises } from '../utils/test-utils'

describe('Loading.vue', () => {
  beforeEach(() => {
    // 清理环境
  })

  describe('组件渲染', () => {
    it('loading为false时不应该渲染', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: false }
      })

      expect(wrapper.find('.loading-container').exists()).toBe(false)
    })

    it('loading为true时应该渲染', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true }
      })

      expect(wrapper.find('.loading-container').exists()).toBe(true)
    })

    it('应该显示加载动画', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true }
      })

      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
      expect(wrapper.findAll('.spinner-ring').length).toBe(4)
    })

    it('应该显示加载文本', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, text: '加载中...' }
      })

      expect(wrapper.find('.loading-text').exists()).toBe(true)
      expect(wrapper.find('.loading-text').text()).toBe('加载中...')
    })

    it('当text为空时不应该显示文本', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, text: '' }
      })

      expect(wrapper.find('.loading-text').exists()).toBe(false)
    })
  })

  describe('全屏模式', () => {
    it('fullscreen为true时应该添加全屏样式类', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, fullscreen: true }
      })

      expect(wrapper.find('.loading-fullscreen').exists()).toBe(true)
    })

    it('fullscreen为false时不应该添加全屏样式类', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, fullscreen: false }
      })

      expect(wrapper.find('.loading-fullscreen').exists()).toBe(false)
    })
  })

  describe('主题适配', () => {
    it('暗黑主题下应该添加对应样式类', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true }
      })
      const themeStore = useThemeStore()

      // 设置暗黑主题
      themeStore.isDark = true
      await flushPromises(wrapper)

      expect(wrapper.find('.loading-dark').exists()).toBe(true)
    })

    it('亮色主题下不应该添加暗黑样式类', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true }
      })
      const themeStore = useThemeStore()

      // 设置亮色主题
      themeStore.isDark = false
      await flushPromises(wrapper)

      expect(wrapper.find('.loading-dark').exists()).toBe(false)
    })

    it('应该根据主题设置正确的背景透明度', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, backgroundOpacity: 0.9 }
      })
      const themeStore = useThemeStore()

      const vm = wrapper.vm as any

      // 测试亮色主题
      themeStore.isDark = false
      await flushPromises(wrapper)

      expect(vm.maskStyle.backgroundColor).toContain('rgba(255, 255, 255, 0.9)')

      // 测试暗黑主题
      themeStore.isDark = true
      await flushPromises(wrapper)

      expect(vm.maskStyle.backgroundColor).toContain('rgba(0, 0, 0, 0.9)')
    })
  })

  describe('尺寸配置', () => {
    it('size为small时应该使用小尺寸', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, size: 'small' }
      })

      const vm = wrapper.vm as any
      expect(vm.spinnerSize).toBe('32px')
    })

    it('size为default时应该使用默认尺寸', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, size: 'default' }
      })

      const vm = wrapper.vm as any
      expect(vm.spinnerSize).toBe('48px')
    })

    it('size为large时应该使用大尺寸', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, size: 'large' }
      })

      const vm = wrapper.vm as any
      expect(vm.spinnerSize).toBe('64px')
    })

    it('加载动画应该应用正确的尺寸样式', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, size: 'large' }
      })

      const spinner = wrapper.find('.loading-spinner')
      expect(spinner.attributes('style')).toContain('width: 64px')
      expect(spinner.attributes('style')).toContain('height: 64px')
    })
  })

  describe('Props测试', () => {
    it('应该接受loading prop', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true }
      })

      expect(wrapper.props('loading')).toBe(true)
    })

    it('应该接受text prop', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, text: '正在处理...' }
      })

      expect(wrapper.props('text')).toBe('正在处理...')
    })

    it('应该接受fullscreen prop', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, fullscreen: false }
      })

      expect(wrapper.props('fullscreen')).toBe(false)
    })

    it('应该接受backgroundOpacity prop', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, backgroundOpacity: 0.5 }
      })

      expect(wrapper.props('backgroundOpacity')).toBe(0.5)
    })

    it('应该接受size prop', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, size: 'small' }
      })

      expect(wrapper.props('size')).toBe('small')
    })

    it('默认Props应该正确设置', async () => {
      const wrapper = await mountComponent(Loading)

      expect(wrapper.props('loading')).toBe(false)
      expect(wrapper.props('text')).toBe('加载中...')
      expect(wrapper.props('fullscreen')).toBe(true)
      expect(wrapper.props('backgroundOpacity')).toBe(0.8)
      expect(wrapper.props('size')).toBe('default')
    })
  })

  describe('过渡动画', () => {
    it('loading状态变化时应该有过渡效果', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: false }
      })

      // 改变loading状态
      await wrapper.setProps({ loading: true })
      await flushPromises(wrapper)

      // 检查过渡组件是否存在
      expect(wrapper.find('.loading-container').exists()).toBe(true)
    })
  })

  describe('自定义文本', () => {
    it('应该支持自定义加载文本', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, text: '数据加载中，请稍候...' }
      })

      expect(wrapper.find('.loading-text').text()).toBe('数据加载中，请稍候...')
    })

    it('空文本时不应该渲染文本元素', async () => {
      const wrapper = await mountComponent(Loading, {
        props: { loading: true, text: '' }
      })

      expect(wrapper.find('.loading-text').exists()).toBe(false)
    })
  })
})
