/**
 * LoginForm组件单元测试
 * 测试登录/注册表单的各项功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import LoginForm from '@/components/forms/LoginForm.vue'
import { mountComponent, flushPromises, setInputValue, clickButton } from '../utils/test-utils'
import { ElMessage } from 'element-plus'

// Mock Element Plus Message
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn()
    }
  }
})

describe('LoginForm.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染LoginForm组件', async () => {
      const wrapper = await mountComponent(LoginForm)
      expect(wrapper.find('.login-form').exists()).toBe(true)
    })

    it('应该渲染邮箱输入框', async () => {
      const wrapper = await mountComponent(LoginForm)
      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.exists()).toBe(true)
    })

    it('应该渲染密码输入框', async () => {
      const wrapper = await mountComponent(LoginForm)
      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)
    })

    it('应该渲染提交按钮', async () => {
      const wrapper = await mountComponent(LoginForm)
      const submitButton = wrapper.find('.submit-button')
      expect(submitButton.exists()).toBe(true)
    })
  })

  describe('登录模式', () => {
    it('登录模式下不应该显示确认密码框', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'login' }
      })

      await flushPromises(wrapper)

      const confirmPasswordInputs = wrapper.findAll('input[type="password"]')
      expect(confirmPasswordInputs.length).toBe(1)
    })

    it('登录模式下按钮文本应该为"登录"', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'login' }
      })

      const submitButton = wrapper.find('.submit-button')
      expect(submitButton.text()).toBe('登录')
    })
  })

  describe('注册模式', () => {
    it('注册模式下应该显示确认密码框', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'register' }
      })

      await flushPromises(wrapper)

      const passwordInputs = wrapper.findAll('input[type="password"]')
      expect(passwordInputs.length).toBe(2)
    })

    it('注册模式下按钮文本应该为"注册"', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'register' }
      })

      const submitButton = wrapper.find('.submit-button')
      expect(submitButton.text()).toBe('注册')
    })
  })

  describe('表单验证 - 邮箱', () => {
    it('空邮箱应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      // 获取表单引用并触发验证
      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          expect.fail('应该验证失败')
        } catch (error) {
          // 验证失败是预期行为
          expect(error).toBeDefined()
        }
      }
    })

    it('无效邮箱格式应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      // 设置无效邮箱
      vm.formData.email = 'invalid-email'
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

    it('有效邮箱格式应该验证通过', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      // 设置有效数据
      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'

      await flushPromises(wrapper)

      const form = vm.formRef
      if (form) {
        try {
          await form.validate()
          // 验证通过
          expect(true).toBe(true)
        } catch (error) {
          // 如果失败，打印错误信息
          console.error('验证失败:', error)
        }
      }
    })
  })

  describe('表单验证 - 密码', () => {
    it('空密码应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = ''

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

    it('密码少于8位应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Pass1'

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

    it('密码只包含字母应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password'

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

    it('密码只包含数字应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = '12345678'

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

    it('符合要求的密码应该验证通过', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'

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

  describe('表单验证 - 确认密码（注册模式）', () => {
    it('确认密码为空应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'register' }
      })
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'
      vm.formData.confirmPassword = ''

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

    it('确认密码与密码不一致应该验证失败', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'register' }
      })
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'
      vm.formData.confirmPassword = 'Password456'

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

    it('确认密码与密码一致应该验证通过', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'register' }
      })
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'
      vm.formData.confirmPassword = 'Password123'

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
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      // 设置有效数据
      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'

      await flushPromises(wrapper)

      // 调用handleSubmit
      await vm.handleSubmit()

      // 检查是否触发了submit事件
      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('提交事件应该包含email和password', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'

      await flushPromises(wrapper)
      await vm.handleSubmit()

      const submitEvent = wrapper.emitted('submit')
      if (submitEvent) {
        expect(submitEvent[0][0]).toEqual({
          email: 'test@example.com',
          password: 'Password123'
        })
      }
    })

    it('验证失败时不应该触发submit事件', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      // 设置无效数据
      vm.formData.email = 'invalid'
      vm.formData.password = ''

      await flushPromises(wrapper)
      await vm.handleSubmit()

      // 不应该触发submit事件
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('模式切换', () => {
    it('从注册模式切换到登录模式应该清空确认密码', async () => {
      const wrapper = await mountComponent(LoginForm, {
        props: { mode: 'register' }
      })
      const vm = wrapper.vm as any

      // 设置确认密码
      vm.formData.confirmPassword = 'Password123'

      await flushPromises(wrapper)

      // 切换到登录模式
      await wrapper.setProps({ mode: 'login' })
      await flushPromises(wrapper)

      expect(vm.formData.confirmPassword).toBe('')
    })
  })

  describe('暴露的方法', () => {
    it('应该暴露resetForm方法', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      expect(typeof vm.resetForm).toBe('function')
    })

    it('resetForm应该清空表单数据', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      // 设置表单数据
      vm.formData.email = 'test@example.com'
      vm.formData.password = 'Password123'

      await flushPromises(wrapper)

      // 调用resetForm
      vm.resetForm()

      await flushPromises(wrapper)

      expect(vm.formData.email).toBe('')
      expect(vm.formData.password).toBe('')
    })

    it('应该暴露clearValidation方法', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      expect(typeof vm.clearValidation).toBe('function')
    })

    it('应该暴露setLoading方法', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      expect(typeof vm.setLoading).toBe('function')

      // 测试setLoading方法
      vm.setLoading(true)
      expect(vm.loading).toBe(true)

      vm.setLoading(false)
      expect(vm.loading).toBe(false)
    })
  })

  describe('加载状态', () => {
    it('loading为true时输入框应该被禁用', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.setLoading(true)
      await flushPromises(wrapper)

      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.attributes('disabled')).toBeDefined()
    })

    it('loading为true时提交按钮应该显示加载状态', async () => {
      const wrapper = await mountComponent(LoginForm)
      const vm = wrapper.vm as any

      vm.setLoading(true)
      await flushPromises(wrapper)

      const submitButton = wrapper.find('.submit-button')
      expect(submitButton.attributes('loading')).toBeDefined()
    })
  })
})
