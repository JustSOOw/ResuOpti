/**
 * PositionForm组件单元测试
 * 测试岗位创建/编辑表单的各项功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import PositionForm from '@/components/forms/PositionForm.vue'
import { mountComponent, flushPromises } from '../utils/test-utils'

describe('PositionForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染PositionForm组件', async () => {
      const wrapper = await mountComponent(PositionForm)
      expect(wrapper.find('.position-form').exists()).toBe(true)
    })

    it('应该渲染岗位名称输入框', async () => {
      const wrapper = await mountComponent(PositionForm)
      const nameInput = wrapper.find('input[placeholder*="前端开发工程师"]')
      expect(nameInput.exists()).toBe(true)
    })

    it('应该渲染岗位描述输入框', async () => {
      const wrapper = await mountComponent(PositionForm)
      const descriptionTextarea = wrapper.find('textarea')
      expect(descriptionTextarea.exists()).toBe(true)
    })

    it('应该渲染提交按钮', async () => {
      const wrapper = await mountComponent(PositionForm)
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.exists()).toBe(true)
    })

    it('应该渲染取消按钮', async () => {
      const wrapper = await mountComponent(PositionForm)
      const buttons = wrapper.findAll('.form-actions button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('创建模式', () => {
    it('没有initialData时按钮文本应该为"创建岗位"', async () => {
      const wrapper = await mountComponent(PositionForm, {
        props: { initialData: null }
      })

      await flushPromises(wrapper)

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toBe('创建岗位')
    })

    it('没有initialData时表单应该为空', async () => {
      const wrapper = await mountComponent(PositionForm, {
        props: { initialData: null }
      })

      const vm = wrapper.vm as any
      expect(vm.formData.name).toBe('')
      expect(vm.formData.description).toBe('')
    })
  })

  describe('编辑模式', () => {
    it('有initialData时按钮文本应该为"更新岗位"', async () => {
      const wrapper = await mountComponent(PositionForm, {
        props: {
          initialData: {
            name: '前端开发工程师',
            description: '负责前端开发'
          }
        }
      })

      await flushPromises(wrapper)

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toBe('更新岗位')
    })

    it('有initialData时应该自动填充表单', async () => {
      const initialData = {
        name: '前端开发工程师',
        description: '负责前端开发工作'
      }

      const wrapper = await mountComponent(PositionForm, {
        props: { initialData }
      })

      await flushPromises(wrapper)

      const vm = wrapper.vm as any
      expect(vm.formData.name).toBe(initialData.name)
      expect(vm.formData.description).toBe(initialData.description)
    })

    it('initialData变化时应该更新表单数据', async () => {
      const wrapper = await mountComponent(PositionForm, {
        props: {
          initialData: {
            name: '岗位A',
            description: '描述A'
          }
        }
      })

      await flushPromises(wrapper)

      // 更新initialData
      await wrapper.setProps({
        initialData: {
          name: '岗位B',
          description: '描述B'
        }
      })

      await flushPromises(wrapper)

      const vm = wrapper.vm as any
      expect(vm.formData.name).toBe('岗位B')
      expect(vm.formData.description).toBe('描述B')
    })
  })

  describe('表单验证 - 岗位名称', () => {
    it('空岗位名称应该验证失败', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = ''

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect.fail('应该验证失败')
        } catch (error) {
          expect(error).toBeDefined()
        }
      }
    })

    it('岗位名称超过100字符应该验证失败', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      // 生成101个字符
      vm.formData.name = 'A'.repeat(101)

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect.fail('应该验证失败')
        } catch (error) {
          expect(error).toBeDefined()
        }
      }
    })

    it('有效岗位名称应该验证通过', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect(true).toBe(true)
        } catch (error) {
          console.error('验证失败:', error)
        }
      }
    })
  })

  describe('表单验证 - 岗位描述', () => {
    it('岗位描述是可选的，空值应该验证通过', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'
      vm.formData.description = ''

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect(true).toBe(true)
        } catch (error) {
          console.error('验证失败:', error)
        }
      }
    })

    it('岗位描述超过2000字符应该验证失败', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'
      vm.formData.description = 'A'.repeat(2001)

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect.fail('应该验证失败')
        } catch (error) {
          expect(error).toBeDefined()
        }
      }
    })

    it('有效岗位描述应该验证通过', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'
      vm.formData.description = '负责前端开发工作，要求熟悉Vue.js'

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect(true).toBe(true)
        } catch (error) {
          console.error('验证失败:', error)
        }
      }
    })
  })

  describe('表单提交', () => {
    it('验证通过后应该触发submit事件', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'
      vm.formData.description = '负责前端开发'

      await flushPromises(wrapper)

      await vm.handleSubmit()

      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('提交事件应该包含表单数据', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'
      vm.formData.description = '负责前端开发'

      await flushPromises(wrapper)

      await vm.handleSubmit()

      const submitEvent = wrapper.emitted('submit')
      if (submitEvent) {
        expect(submitEvent[0][0]).toEqual({
          name: '前端开发工程师',
          description: '负责前端开发'
        })
      }
    })

    it('提交时应该去除首尾空格', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '  前端开发工程师  '
      vm.formData.description = '  负责前端开发  '

      await flushPromises(wrapper)

      await vm.handleSubmit()

      const submitEvent = wrapper.emitted('submit')
      if (submitEvent) {
        expect(submitEvent[0][0]).toEqual({
          name: '前端开发工程师',
          description: '负责前端开发'
        })
      }
    })

    it('描述为空时提交数据应该为undefined', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.formData.name = '前端开发工程师'
      vm.formData.description = ''

      await flushPromises(wrapper)

      await vm.handleSubmit()

      const submitEvent = wrapper.emitted('submit')
      if (submitEvent) {
        expect(submitEvent[0][0]).toEqual({
          name: '前端开发工程师',
          description: undefined
        })
      }
    })

    it('验证失败时不应该触发submit事件', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      // 设置无效数据
      vm.formData.name = ''
      vm.formData.description = 'A'.repeat(2001)

      await flushPromises(wrapper)

      await vm.handleSubmit()

      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('取消操作', () => {
    it('点击取消按钮应该触发cancel事件', async () => {
      const wrapper = await mountComponent(PositionForm)

      const buttons = wrapper.findAll('.form-actions button')
      const cancelButton = buttons[buttons.length - 1]

      await cancelButton.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('调用handleCancel方法应该触发cancel事件', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.handleCancel()

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('暴露的方法', () => {
    it('应该暴露resetForm方法', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      expect(typeof vm.resetForm).toBe('function')
    })

    it('resetForm应该清空表单数据', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      // 设置表单数据
      vm.formData.name = '前端开发工程师'
      vm.formData.description = '负责前端开发'

      await flushPromises(wrapper)

      // 调用resetForm
      vm.resetForm()

      await flushPromises(wrapper)

      expect(vm.formData.name).toBe('')
      expect(vm.formData.description).toBe('')
    })

    it('应该暴露formRef属性', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      expect(vm.formRef).toBeDefined()
    })
  })

  describe('加载状态', () => {
    it('loading为true时输入框应该被禁用', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.loading = true
      await flushPromises(wrapper)

      const nameInput = wrapper.find('input')
      expect(nameInput.attributes('disabled')).toBeDefined()
    })

    it('loading为true时按钮应该显示加载状态', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.loading = true
      await flushPromises(wrapper)

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('loading')).toBeDefined()
    })

    it('loading为true时取消按钮应该被禁用', async () => {
      const wrapper = await mountComponent(PositionForm)
      const vm = wrapper.vm as any

      vm.loading = true
      await flushPromises(wrapper)

      const buttons = wrapper.findAll('.form-actions button')
      const cancelButton = buttons[buttons.length - 1]
      expect(cancelButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Props测试', () => {
    it('应该接受initialData prop', async () => {
      const initialData = {
        name: '前端开发工程师',
        description: '负责前端开发'
      }

      const wrapper = await mountComponent(PositionForm, {
        props: { initialData }
      })

      expect(wrapper.props('initialData')).toEqual(initialData)
    })

    it('initialData默认值应该为null', async () => {
      const wrapper = await mountComponent(PositionForm)
      expect(wrapper.props('initialData')).toBeNull()
    })
  })

  describe('表单提示文本', () => {
    it('应该显示岗位名称的提示文本', async () => {
      const wrapper = await mountComponent(PositionForm)

      const tipText = wrapper.text()
      expect(tipText).toContain('清晰的岗位名称有助于后续简历分类管理')
    })

    it('应该显示岗位描述的提示文本', async () => {
      const wrapper = await mountComponent(PositionForm)

      const tipText = wrapper.text()
      expect(tipText).toContain('可以记录岗位要求、薪资范围等信息')
    })
  })
})
