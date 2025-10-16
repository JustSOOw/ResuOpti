/**
 * ResumeMetadataDialog 组件单元测试
 * 测试简历元数据编辑对话框的各项功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VueWrapper } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import ResumeMetadataDialog from '@/components/business/ResumeMetadataDialog.vue'
import * as resumeService from '@/services/resumes'
import { mountComponent, flushPromises, setInputValue, clickButton } from './utils/test-utils'

// Mock Element Plus Message
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    }
  }
})

// Mock resumes service
vi.mock('@/services/resumes', () => ({
  updateResume: vi.fn()
}))

describe('ResumeMetadataDialog.vue', () => {
  let wrapper: VueWrapper<any>
  const mockUpdateResume = vi.mocked(resumeService.updateResume)

  // 默认props
  const defaultProps = {
    visible: true,
    resumeId: 'test-resume-123',
    resumeTitle: '测试简历标题',
    initialNotes: '这是初始备注',
    initialTags: ['标签1', '标签2', '标签3']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  /**
   * 辅助函数：创建组件实例
   * 使用mountComponent工具函数，自动配置Element Plus
   */
  const createWrapper = async (props = {}) => {
    return await mountComponent(ResumeMetadataDialog, {
      props: {
        ...defaultProps,
        ...props
      }
    })
  }

  describe('组件渲染', () => {
    it('应该正确渲染对话框', async () => {
      wrapper = await createWrapper()
      expect(wrapper.find('.dialog-header').exists()).toBe(true)
      expect(wrapper.find('.dialog-content').exists()).toBe(true)
      expect(wrapper.find('.dialog-footer').exists()).toBe(true)
    })

    it('应该显示简历标题', async () => {
      wrapper = await createWrapper()
      expect(wrapper.find('.header-subtitle').text()).toBe('测试简历标题')
    })

    it('应该加载初始备注内容', async () => {
      wrapper = await createWrapper()
      await flushPromises(wrapper)
      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('这是初始备注')
    })

    it('应该显示初始标签列表', async () => {
      wrapper = await createWrapper()
      const tags = wrapper.findAll('.tag-item')
      expect(tags.length).toBe(3)
      expect(tags[0].text()).toContain('标签1')
      expect(tags[1].text()).toContain('标签2')
      expect(tags[2].text()).toContain('标签3')
    })

    it('当没有标签时应该显示空状态提示', async () => {
      wrapper = await createWrapper({ initialTags: [] })
      expect(wrapper.find('.empty-tags').exists()).toBe(true)
      expect(wrapper.find('.empty-text').text()).toBe('暂无标签，请在下方添加')
    })
  })

  describe('备注编辑功能', () => {
    it('应该能够编辑备注内容', async () => {
      wrapper = await createWrapper()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('新的备注内容')
      await wrapper.vm.$nextTick()

      expect(textarea.element.value).toBe('新的备注内容')
    })

    it('应该显示备注字符数统计', async () => {
      wrapper = await createWrapper({ initialNotes: '测试备注' })
      await wrapper.vm.$nextTick()

      const charCount = wrapper.find('.char-count')
      expect(charCount.text()).toContain('4 / 2000')
    })

    it('当备注超过2000字符时应该显示错误', async () => {
      const longNotes = 'a'.repeat(2001)
      wrapper = await createWrapper({ initialNotes: longNotes })
      await wrapper.vm.$nextTick()

      const charCount = wrapper.find('.char-count')
      expect(charCount.classes()).toContain('is-error')
      expect(wrapper.find('.error-hint').exists()).toBe(true)
    })

    it('应该能够清空备注', async () => {
      wrapper = await createWrapper()
      const textarea = wrapper.find('textarea')

      await textarea.setValue('')
      await wrapper.vm.$nextTick()

      expect(textarea.element.value).toBe('')
    })
  })

  describe('标签管理功能', () => {
    it('应该能够添加新标签', async () => {
      wrapper = await createWrapper({ initialTags: [] })

      // 输入新标签
      const input = wrapper.find('.tag-input input')
      await input.setValue('新标签')

      // 点击添加按钮
      const addButton = wrapper.find('.tag-input button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 验证消息提示
      expect(ElMessage.success).toHaveBeenCalledWith('标签添加成功')
    })

    it('应该能够通过回车键添加标签', async () => {
      wrapper = await createWrapper({ initialTags: [] })

      const input = wrapper.find('.tag-input input')
      await input.setValue('新标签')
      await input.trigger('keyup.enter')
      await wrapper.vm.$nextTick()

      expect(ElMessage.success).toHaveBeenCalledWith('标签添加成功')
    })

    it('应该拒绝添加空标签', async () => {
      wrapper = await createWrapper({ initialTags: [] })

      const input = wrapper.find('.tag-input input')
      await input.setValue('   ')

      const addButton = wrapper.find('.tag-input button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 不应该有成功消息
      expect(ElMessage.success).not.toHaveBeenCalled()
    })

    it('应该拒绝添加重复标签', async () => {
      wrapper = await createWrapper({ initialTags: ['已存在'] })

      const input = wrapper.find('.tag-input input')
      await input.setValue('已存在')

      const addButton = wrapper.find('.tag-input button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(ElMessage.warning).toHaveBeenCalledWith('该标签已存在')
    })

    it('应该拒绝添加超长标签', async () => {
      wrapper = await createWrapper({ initialTags: [] })

      const longTag = 'a'.repeat(51)
      const input = wrapper.find('.tag-input input')
      await input.setValue(longTag)

      const addButton = wrapper.find('.tag-input button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(ElMessage.warning).toHaveBeenCalledWith('标签长度不能超过50个字符')
    })

    it('应该拒绝添加超过20个标签', async () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `标签${i}`)
      wrapper = await createWrapper({ initialTags: manyTags })

      const input = wrapper.find('.tag-input input')
      await input.setValue('第21个标签')

      const addButton = wrapper.find('.tag-input button')
      await addButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(ElMessage.warning).toHaveBeenCalledWith('标签数量不能超过20个')
    })

    it('应该显示标签数量限制提示', async () => {
      const manyTags = Array.from({ length: 18 }, (_, i) => `标签${i}`)
      wrapper = await createWrapper({ initialTags: manyTags })
      await wrapper.vm.$nextTick()

      const hint = wrapper.find('.tag-hint')
      expect(hint.text()).toContain('还可以添加 2 个标签')
    })

    it('达到上限时应该显示上限提示', async () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `标签${i}`)
      wrapper = await createWrapper({ initialTags: manyTags })
      await wrapper.vm.$nextTick()

      const hint = wrapper.find('.tag-hint')
      expect(hint.text()).toContain('已达到标签数量上限')
    })

    it('应该能够删除标签', async () => {
      wrapper = await createWrapper()

      const initialTagCount = wrapper.findAll('.tag-item').length

      // 点击第一个标签的关闭按钮
      const closeButton = wrapper.find('.tag-item .el-tag__close')
      await closeButton.trigger('click')
      await wrapper.vm.$nextTick()

      const currentTagCount = wrapper.findAll('.tag-item').length
      expect(currentTagCount).toBe(initialTagCount - 1)
    })
  })

  describe('表单验证', () => {
    it('当备注超长时应该禁用提交按钮', async () => {
      const longNotes = 'a'.repeat(2001)
      wrapper = await createWrapper({ initialNotes: longNotes })
      await wrapper.vm.$nextTick()

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('验证表单时应该检查备注长度', async () => {
      wrapper = await createWrapper()

      // 设置超长备注
      const textarea = wrapper.find('textarea')
      await textarea.setValue('a'.repeat(2001))

      // 尝试提交
      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 应该显示错误消息
      expect(ElMessage.error).toHaveBeenCalledWith('备注长度不能超过2000个字符')
    })

    it('验证表单时应该检查标签数量', async () => {
      const manyTags = Array.from({ length: 21 }, (_, i) => `标签${i}`)
      wrapper = await createWrapper({ initialTags: manyTags })

      // 尝试提交
      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(ElMessage.error).toHaveBeenCalledWith('标签数量不能超过20个')
    })
  })

  describe('API调用和提交', () => {
    it('应该调用updateResume API', async () => {
      mockUpdateResume.mockResolvedValue({} as any)
      wrapper = await createWrapper()

      // 修改数据
      const textarea = wrapper.find('textarea')
      await textarea.setValue('新备注')

      // 提交
      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 等待异步操作
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockUpdateResume).toHaveBeenCalledWith('test-resume-123', {
        notes: '新备注',
        tags: ['标签1', '标签2', '标签3']
      })
    })

    it('提交成功后应该显示成功消息', async () => {
      mockUpdateResume.mockResolvedValue({} as any)
      wrapper = await createWrapper()

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(ElMessage.success).toHaveBeenCalledWith('元数据更新成功')
    })

    it('提交成功后应该关闭对话框', async () => {
      mockUpdateResume.mockResolvedValue({} as any)
      wrapper = await createWrapper()

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })

    it('提交成功后应该触发success事件', async () => {
      mockUpdateResume.mockResolvedValue({} as any)
      wrapper = await createWrapper()

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.emitted('success')).toBeTruthy()
    })

    it('提交失败时应该显示错误消息', async () => {
      const errorMessage = 'API调用失败'
      mockUpdateResume.mockRejectedValue(new Error(errorMessage))
      wrapper = await createWrapper()

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(ElMessage.error).toHaveBeenCalled()
    })

    it('提交时应该显示loading状态', async () => {
      mockUpdateResume.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      wrapper = await createWrapper()

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')
      await wrapper.vm.$nextTick()

      // 检查loading属性
      expect(submitButton.attributes('loading')).toBeDefined()
    })

    it('空备注应该作为null提交', async () => {
      mockUpdateResume.mockResolvedValue({} as any)
      wrapper = await createWrapper({ initialNotes: '' })

      const submitButton = wrapper.findAll('.dialog-footer button')[1]
      await submitButton.trigger('click')

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockUpdateResume).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ notes: null })
      )
    })
  })

  describe('取消操作', () => {
    it('点击取消按钮应该关闭对话框', async () => {
      wrapper = await createWrapper()

      const cancelButton = wrapper.findAll('.dialog-footer button')[0]
      await cancelButton.trigger('click')

      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })

    it('取消时应该触发cancel事件', async () => {
      wrapper = await createWrapper()

      const cancelButton = wrapper.findAll('.dialog-footer button')[0]
      await cancelButton.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('Props变化响应', () => {
    it('对话框打开时应该重置表单数据', async () => {
      wrapper = await createWrapper({ visible: false })

      // 修改内部状态
      await wrapper.setProps({ visible: true })
      await wrapper.vm.$nextTick()

      // 应该重新加载初始数据
      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('这是初始备注')
    })

    it('应该响应initialNotes的变化', async () => {
      wrapper = await createWrapper({ visible: false })

      await wrapper.setProps({
        visible: true,
        initialNotes: '新的初始备注'
      })
      await wrapper.vm.$nextTick()

      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('新的初始备注')
    })

    it('应该响应initialTags的变化', async () => {
      wrapper = await createWrapper({ visible: false, initialTags: [] })

      await wrapper.setProps({
        visible: true,
        initialTags: ['新标签1', '新标签2']
      })
      await wrapper.vm.$nextTick()

      const tags = wrapper.findAll('.tag-item')
      expect(tags.length).toBe(2)
    })
  })

  describe('标签颜色', () => {
    it('应该为不同位置的标签分配不同颜色', async () => {
      wrapper = await createWrapper()

      const tags = wrapper.findAll('.tag-item')
      const types = tags.map(tag => tag.attributes('type'))

      // 验证至少有不同的type
      const uniqueTypes = new Set(types)
      expect(uniqueTypes.size).toBeGreaterThan(1)
    })
  })

  describe('可访问性', () => {
    it('应该为输入框提供placeholder', async () => {
      wrapper = await createWrapper()

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('placeholder')).toBeTruthy()

      const input = wrapper.find('.tag-input input')
      expect(input.attributes('placeholder')).toBeTruthy()
    })

    it('应该显示标签示例', async () => {
      wrapper = await createWrapper()

      const examples = wrapper.find('.tag-examples')
      expect(examples.exists()).toBe(true)
      expect(examples.text()).toContain('标签示例')
    })
  })
})
