/**
 * 全局错误处理工具
 * 提供统一的错误处理、日志记录和用户提示功能
 */

import { ElMessage, ElNotification } from 'element-plus'
import type { AxiosError } from 'axios'
import router from '@/router'

/**
 * API错误响应接口
 */
interface ApiErrorResponse {
  success: false
  message: string
  error?: string
  stack?: string
}

/**
 * 错误日志接口
 */
interface ErrorLog {
  type: string
  message: string
  stack?: string
  info?: any
  timestamp: string
  url?: string
  userAgent?: string
}

/**
 * 错误日志存储
 */
const errorLogs: ErrorLog[] = []
const MAX_ERROR_LOGS = 50 // 最多保存50条错误日志

/**
 * 保存错误日志
 */
function saveErrorLog(log: ErrorLog) {
  errorLogs.unshift(log)

  // 限制日志数量
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.pop()
  }

  // 开发环境打印到控制台
  if (import.meta.env.DEV) {
    console.error('[Error Log]', log)
  }

  // 生产环境可以上报到错误监控服务
  if (import.meta.env.PROD) {
    // TODO: 集成错误监控服务（如 Sentry）
    // Sentry.captureException(new Error(log.message), {
    //   extra: log
    // })
  }
}

/**
 * 获取所有错误日志
 */
export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs]
}

/**
 * 清空错误日志
 */
export function clearErrorLogs() {
  errorLogs.length = 0
}

/**
 * 处理API错误
 * @param error Axios错误对象
 * @param showMessage 是否显示错误提示消息
 */
export function handleApiError(error: AxiosError<ApiErrorResponse>, showMessage = true) {
  let message = '网络请求失败，请稍后重试'
  let statusCode = 0

  if (error.response) {
    // 服务器返回错误响应
    statusCode = error.response.status
    const data = error.response.data

    if (data && data.message) {
      message = data.message
    } else {
      // 根据状态码提供默认消息
      switch (statusCode) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 跳转到登录页
          router.push('/auth/login')
          break
        case 403:
          message = '权限不足，无法访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 409:
          message = '资源冲突，操作无法完成'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务暂时不可用'
          break
        default:
          message = `请求失败 (${statusCode})`
      }
    }

    // 记录错误日志
    saveErrorLog({
      type: 'API_ERROR',
      message: `[${statusCode}] ${message}`,
      stack: error.stack,
      info: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        response: data
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  } else if (error.request) {
    // 请求已发送但没有收到响应
    message = '网络连接失败，请检查网络'

    saveErrorLog({
      type: 'NETWORK_ERROR',
      message,
      info: {
        url: error.config?.url,
        method: error.config?.method
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  } else {
    // 请求配置错误
    message = '请求配置错误'

    saveErrorLog({
      type: 'REQUEST_CONFIG_ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  // 显示错误提示
  if (showMessage) {
    if (statusCode === 401) {
      ElNotification({
        title: '认证失败',
        message: '您的登录已过期，请重新登录',
        type: 'warning',
        duration: 3000
      })
    } else if (statusCode >= 500) {
      ElNotification({
        title: '服务器错误',
        message,
        type: 'error',
        duration: 5000
      })
    } else {
      ElMessage.error(message)
    }
  }

  return {
    message,
    statusCode,
    error
  }
}

/**
 * 处理Vue组件错误
 * @param error 错误对象
 * @param info 错误来源信息
 */
export function handleVueError(error: Error, info: string) {
  const message = `Vue组件错误: ${error.message}`

  saveErrorLog({
    type: 'VUE_ERROR',
    message,
    stack: error.stack,
    info: {
      componentInfo: info
    },
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  })

  // 开发环境显示详细错误
  if (import.meta.env.DEV) {
    ElNotification({
      title: 'Vue组件错误',
      message: error.message,
      type: 'error',
      duration: 0 // 不自动关闭
    })
  } else {
    ElMessage.error('页面加载失败，请刷新重试')
  }
}

/**
 * 处理Promise未捕获的拒绝
 * @param reason 拒绝原因
 */
export function handleUnhandledRejection(reason: any) {
  const message = typeof reason === 'string' ? reason : reason?.message || '未知错误'

  saveErrorLog({
    type: 'UNHANDLED_REJECTION',
    message: `Promise拒绝: ${message}`,
    stack: reason?.stack,
    info: reason,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  })

  if (import.meta.env.DEV) {
    console.error('Unhandled Promise Rejection:', reason)
  }
}

/**
 * 处理全局JavaScript错误
 * @param error 错误对象
 */
export function handleGlobalError(error: Error | ErrorEvent) {
  let message: string
  let stack: string | undefined

  if (error instanceof ErrorEvent) {
    message = error.message
    stack = error.error?.stack
  } else {
    message = error.message
    stack = error.stack
  }

  saveErrorLog({
    type: 'GLOBAL_ERROR',
    message: `全局错误: ${message}`,
    stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  })

  if (import.meta.env.DEV) {
    console.error('Global Error:', error)
  }
}

/**
 * 手动上报错误
 * @param error 错误对象或错误消息
 * @param context 上下文信息
 */
export function reportError(error: Error | string, context?: any) {
  const message = typeof error === 'string' ? error : error.message
  const stack = typeof error === 'string' ? undefined : error.stack

  saveErrorLog({
    type: 'MANUAL_REPORT',
    message,
    stack,
    info: context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  })
}

/**
 * 下载错误日志 (用于调试)
 */
export function downloadErrorLogs() {
  const logs = getErrorLogs()
  const dataStr = JSON.stringify(logs, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `error-logs-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('错误日志已下载')
}

export default {
  handleApiError,
  handleVueError,
  handleUnhandledRejection,
  handleGlobalError,
  reportError,
  getErrorLogs,
  clearErrorLogs,
  downloadErrorLogs
}
