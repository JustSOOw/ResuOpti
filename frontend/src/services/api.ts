/**
 * API基础配置
 * 配置axios实例、请求/响应拦截器、错误处理
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * API错误响应接口
 */
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: unknown
}

/**
 * API通用响应接口
 */
export interface ApiResponse<T = any> {
  data: T
  message?: string
  code?: string
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器
 * - 自动添加认证token
 * - 开发环境下记录请求日志
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      })
    }

    return config
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error)
    }
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * - 统一处理响应数据
 * - 处理各类错误状态（401, 403, 404, 500等）
 * - 提取并格式化错误消息
 * - 开发环境下记录响应日志
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 开发环境日志
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }

    // 返回响应数据
    return response.data
  },
  (error: AxiosError<ApiError>) => {
    // 开发环境日志
    if (import.meta.env.DEV) {
      console.error('[API Response Error]', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
    }

    // 提取错误消息
    let errorMessage = '请求失败，请稍后重试'
    let errorCode = 'UNKNOWN_ERROR'

    if (error.response) {
      // 服务器返回错误响应
      const { status, data } = error.response

      // 提取服务器返回的错误消息
      errorMessage = data?.message || errorMessage
      errorCode = data?.code || `HTTP_${status}`

      // 处理特定状态码
      switch (status) {
        case 401:
          // 未授权 - 清除token并跳转登录
          errorMessage = data?.message || '登录已过期，请重新登录'
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          // 禁止访问
          errorMessage = data?.message || '没有权限访问该资源'
          break
        case 404:
          // 资源不存在
          errorMessage = data?.message || '请求的资源不存在'
          break
        case 422:
          // 验证错误
          errorMessage = data?.message || '提交的数据验证失败'
          break
        case 500:
          // 服务器错误
          errorMessage = data?.message || '服务器错误，请稍后重试'
          break
        case 503:
          // 服务不可用
          errorMessage = '服务暂时不可用，请稍后重试'
          break
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      if (error.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请检查网络连接'
        errorCode = 'TIMEOUT'
      } else {
        errorMessage = '网络连接失败，请检查网络'
        errorCode = 'NETWORK_ERROR'
      }
    } else {
      // 请求配置错误
      errorMessage = error.message || '请求配置错误'
      errorCode = 'CONFIG_ERROR'
    }

    // 构造标准化错误对象
    const apiError: ApiError = {
      message: errorMessage,
      code: errorCode,
      status: error.response?.status,
      details: error.response?.data?.details
    }

    return Promise.reject(apiError)
  }
)

export default apiClient