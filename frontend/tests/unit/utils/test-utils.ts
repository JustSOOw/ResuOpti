/**
 * 测试工具函数
 * 提供常用的测试辅助方法和Mock配置
 */

import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Router } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'

/**
 * 创建测试用的Pinia实例
 */
export function createTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * 创建测试用的Vue Router实例
 */
export function createTestRouter(): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/positions', name: 'positions', component: { template: '<div>Positions</div>' } },
      { path: '/resumes', name: 'resumes', component: { template: '<div>Resumes</div>' } }
    ]
  })
  return router
}

/**
 * 扩展的挂载选项
 */
export interface MountOptions {
  /** 是否包含全局插件（Pinia, Router, Element Plus） */
  withPlugins?: boolean
  /** 自定义Pinia实例 */
  pinia?: ReturnType<typeof createPinia>
  /** 自定义Router实例 */
  router?: Router
  /** 初始路由路径 */
  initialRoute?: string
  /** 其他vue-test-utils的挂载选项 */
  [key: string]: any
}

/**
 * 通用组件挂载函数
 * 自动配置常用的全局插件和依赖
 *
 * @param component - 要挂载的组件
 * @param options - 挂载选项
 * @returns VueWrapper实例
 */
export async function mountComponent(
  component: any,
  options: MountOptions = {}
): Promise<VueWrapper<any>> {
  const { withPlugins = true, pinia, router, initialRoute, ...mountOptions } = options

  const globalPlugins = []
  const globalConfig: any = {
    plugins: globalPlugins
  }

  // 添加Pinia
  if (withPlugins) {
    const testPinia = pinia || createTestPinia()
    globalPlugins.push(testPinia)
  }

  // 添加Router
  if (withPlugins && router !== false) {
    const testRouter = router || createTestRouter()
    globalPlugins.push(testRouter)

    // 导航到初始路由
    if (initialRoute) {
      await testRouter.push(initialRoute)
      await testRouter.isReady()
    }
  }

  // 添加Element Plus（带默认配置）
  if (withPlugins) {
    globalPlugins.push(ElementPlus)
  }

  // 合并全局配置
  const finalOptions = {
    ...mountOptions,
    global: {
      ...(mountOptions.global || {}),
      plugins: [...globalPlugins, ...(mountOptions.global?.plugins || [])],
      stubs: {
        // 默认stub一些复杂的Element Plus组件
        ElMessage: true,
        ElMessageBox: true,
        ElNotification: true,
        ...(mountOptions.global?.stubs || {})
      }
    }
  }

  return mount(component, finalOptions)
}

/**
 * 等待DOM更新
 * @param wrapper - VueWrapper实例
 */
export async function flushPromises(wrapper?: VueWrapper<any>): Promise<void> {
  if (wrapper) {
    await wrapper.vm.$nextTick()
  }
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 触发表单提交
 * @param wrapper - VueWrapper实例
 * @param formSelector - 表单选择器（默认为'form'）
 */
export async function submitForm(wrapper: VueWrapper<any>, formSelector = 'form'): Promise<void> {
  const form = wrapper.find(formSelector)
  if (form.exists()) {
    await form.trigger('submit.prevent')
    await flushPromises(wrapper)
  }
}

/**
 * 设置输入框值
 * @param wrapper - VueWrapper实例
 * @param selector - 输入框选择器
 * @param value - 要设置的值
 */
export async function setInputValue(
  wrapper: VueWrapper<any>,
  selector: string,
  value: string
): Promise<void> {
  const input = wrapper.find(selector)
  if (input.exists()) {
    await input.setValue(value)
    await input.trigger('blur')
    await flushPromises(wrapper)
  }
}

/**
 * 点击按钮
 * @param wrapper - VueWrapper实例
 * @param selector - 按钮选择器
 */
export async function clickButton(wrapper: VueWrapper<any>, selector: string): Promise<void> {
  const button = wrapper.find(selector)
  if (button.exists()) {
    await button.trigger('click')
    await flushPromises(wrapper)
  }
}

/**
 * Mock API响应
 */
export const mockApiResponse = {
  /**
   * 成功响应
   */
  success: (data: any = {}) => ({
    success: true,
    data,
    message: '操作成功'
  }),

  /**
   * 错误响应
   */
  error: (message = '操作失败', code = 'ERROR') => ({
    success: false,
    error: {
      code,
      message
    }
  })
}

/**
 * Mock用户数据
 */
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

/**
 * Mock简历数据
 */
export const mockResume = {
  id: '1',
  userId: '1',
  positionId: '1',
  title: '测试简历',
  type: 'file' as const,
  fileName: 'resume.pdf',
  filePath: '/uploads/resume.pdf',
  fileSize: 1024000,
  content: null,
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

/**
 * Mock岗位数据
 */
export const mockPosition = {
  id: '1',
  userId: '1',
  name: '前端开发工程师',
  description: '负责前端开发工作',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

/**
 * 等待指定毫秒数
 * @param ms - 毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 创建Mock函数的工厂函数
 */
export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T
): jest.Mock<ReturnType<T>, Parameters<T>> {
  return vi.fn(implementation) as any
}

/**
 * 检查元素是否可见
 * @param wrapper - VueWrapper实例
 * @param selector - 元素选择器
 */
export function isVisible(wrapper: VueWrapper<any>, selector: string): boolean {
  const element = wrapper.find(selector)
  return element.exists() && element.isVisible()
}

/**
 * 获取元素文本内容
 * @param wrapper - VueWrapper实例
 * @param selector - 元素选择器
 */
export function getText(wrapper: VueWrapper<any>, selector: string): string {
  const element = wrapper.find(selector)
  return element.exists() ? element.text() : ''
}
