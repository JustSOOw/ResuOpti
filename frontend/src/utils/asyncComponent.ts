/**
 * 异步组件加载工具
 * 用于实现组件级别的代码分割和懒加载
 */

import { defineAsyncComponent, type Component } from 'vue'
import Loading from '@/components/common/Loading.vue'

/**
 * 异步组件配置选项
 */
export interface AsyncComponentOptions {
  /** 加载延迟时间（毫秒），避免闪烁 */
  delay?: number
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否在挂起时显示加载组件 */
  suspensible?: boolean
  /** 加载提示文本 */
  loadingText?: string
}

/**
 * 创建异步组件
 * @param loader 组件加载函数
 * @param options 配置选项
 * @returns 异步组件
 */
export function createAsyncComponent(
  loader: () => Promise<Component>,
  options: AsyncComponentOptions = {}
) {
  const { delay = 200, timeout = 30000, suspensible = false, loadingText = '加载中...' } = options

  return defineAsyncComponent({
    loader,
    // 加载中显示的组件
    loadingComponent: Loading,
    // 加载失败时显示的组件
    errorComponent: {
      template: `
        <div class="async-component-error">
          <div class="error-content">
            <el-icon :size="48" color="var(--el-color-danger)">
              <circle-close />
            </el-icon>
            <p class="error-message">组件加载失败</p>
            <el-button type="primary" size="small" @click="retry">重试</el-button>
          </div>
        </div>
      `,
      props: ['retry']
    },
    // 显示加载组件前的延迟时间（避免闪烁）
    delay,
    // 超时时间
    timeout,
    // 是否可挂起（与 Suspense 配合使用）
    suspensible,
    // 加载失败时的回调
    onError(error, retry, fail, attempts) {
      console.error('异步组件加载失败:', error)

      // 最多重试3次
      if (attempts <= 3) {
        // 延迟重试，间隔递增
        const retryDelay = Math.min(1000 * Math.pow(2, attempts - 1), 5000)
        setTimeout(() => {
          console.log(`第 ${attempts} 次重试加载组件...`)
          retry()
        }, retryDelay)
      } else {
        // 超过重试次数，放弃加载
        console.error('组件加载失败次数过多，停止重试')
        fail()
      }
    }
  })
}

/**
 * 创建路由级别的异步组件（用于路由懒加载）
 * 无需显示加载状态，因为路由切换时有全局加载提示
 * @param loader 组件加载函数
 * @returns 异步组件
 */
export function createRouteAsyncComponent(loader: () => Promise<Component>) {
  return defineAsyncComponent({
    loader,
    // 路由级别的组件不显示加载状态，由路由守卫统一处理
    delay: 0,
    timeout: 30000,
    onError(error, retry, fail, attempts) {
      console.error('路由组件加载失败:', error)

      if (attempts <= 2) {
        const retryDelay = 1000 * attempts
        setTimeout(retry, retryDelay)
      } else {
        fail()
      }
    }
  })
}

/**
 * 预加载组件
 * 用于在空闲时预加载可能会用到的组件
 * @param loader 组件加载函数
 */
export function preloadComponent(loader: () => Promise<Component>) {
  // 使用 requestIdleCallback 在浏览器空闲时预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loader().catch((error) => {
        console.warn('预加载组件失败:', error)
      })
    })
  } else {
    // 降级方案：使用 setTimeout
    setTimeout(() => {
      loader().catch((error) => {
        console.warn('预加载组件失败:', error)
      })
    }, 1000)
  }
}

/**
 * 创建带有Suspense支持的异步组件
 * @param loader 组件加载函数
 * @param fallback 加载中的占位内容
 * @returns 异步组件
 */
export function createSuspenseAsyncComponent(
  loader: () => Promise<Component>,
  fallback?: Component
) {
  return defineAsyncComponent({
    loader,
    loadingComponent: fallback || Loading,
    delay: 200,
    timeout: 30000,
    suspensible: true,
    onError(error, retry, fail, attempts) {
      console.error('Suspense异步组件加载失败:', error)

      if (attempts <= 3) {
        setTimeout(retry, 1000 * attempts)
      } else {
        fail()
      }
    }
  })
}
