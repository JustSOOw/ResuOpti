/**
 * 应用入口文件
 * 配置Vue实例和全局插件
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router'
import App from './App.vue'
import './styles/theme.scss'
import './styles/global.scss'

// 导入错误处理工具
import {
  handleVueError,
  handleUnhandledRejection,
  handleGlobalError
} from './utils/errorHandler'

// 导入全局错误边界组件
import ErrorBoundary from './components/common/ErrorBoundary.vue'

// 创建Vue应用实例
const app = createApp(App)

// ==================== 全局错误处理 ====================

// Vue应用错误处理
app.config.errorHandler = (err: any, instance, info) => {
  handleVueError(err, info)
}

// Vue警告处理 (仅开发环境)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('%c Vue Warning ', 'background: #ff9800; color: white; padding: 2px 4px; border-radius: 2px', msg)
    console.warn('Warning Trace:', trace)
  }
}

// 全局Promise未处理拒绝错误捕获
window.addEventListener('unhandledrejection', (event) => {
  handleUnhandledRejection(event.reason)
  event.preventDefault()
})

// 全局JavaScript错误捕获
window.addEventListener('error', (event) => {
  handleGlobalError(event)
  event.preventDefault()
})

// ==================== 插件注册 ====================

// Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// Vue Router路由管理
app.use(router)

// Element Plus UI库
app.use(ElementPlus, {
  size: 'default',
  zIndex: 3000
})

// ==================== 全局组件注册 ====================

// 注册所有Element Plus图标为全局组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册全局错误边界组件
app.component('ErrorBoundary', ErrorBoundary)

// ==================== 全局属性和方法 ====================

// 全局属性
app.config.globalProperties.$appName = 'ResuOpti'
app.config.globalProperties.$appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'

// ==================== 应用挂载 ====================

// 挂载应用到DOM
app.mount('#app')

// ==================== 开发环境信息 ====================

if (import.meta.env.DEV) {
  console.log('%c ResuOpti 开发模式 ', 'background: #42b883; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold')
  console.log('Vue版本:', app.version)
  console.log('API地址:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
  console.log('环境变量:', {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD
  })

  // 暴露错误日志工具到控制台 (方便调试)
  import('./utils/errorHandler').then(module => {
    (window as any).__ERROR_HANDLER__ = module.default
    console.log('💡 提示: 可以使用 window.__ERROR_HANDLER__ 访问错误处理工具')
    console.log('   - getErrorLogs(): 获取所有错误日志')
    console.log('   - clearErrorLogs(): 清空错误日志')
    console.log('   - downloadErrorLogs(): 下载错误日志')
  })
}

// 导出app实例供外部使用（如测试）
export default app
