/**
 * HTTP请求工具函数
 * 提供便捷的请求方法、配置工具和辅助函数
 */

import type { AxiosRequestConfig, CancelTokenSource } from 'axios'
import axios, { AxiosResponse } from 'axios'
import apiClient from '@/services/api'

/**
 * 导出apiClient实例，供简单场景直接使用
 */
export { default as apiClient } from '@/services/api'

/**
 * 查询参数类型
 */
export type QueryParams = Record<string, string | number | boolean | undefined | null>

/**
 * 表单数据类型
 */
export type FormDataValue = string | Blob | File | number | boolean | undefined | null

/**
 * ==================== 便捷请求方法 ====================
 */

/**
 * GET请求简化版
 * @param url - 请求URL
 * @param params - 查询参数
 * @param config - axios配置
 * @returns Promise<响应数据>
 */
export async function get<T = any>(
  url: string,
  params?: QueryParams,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiClient.get<T, T>(url, {
    ...config,
    params
  })
}

/**
 * POST请求简化版
 * @param url - 请求URL
 * @param data - 请求数据
 * @param config - axios配置
 * @returns Promise<响应数据>
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiClient.post<T, T>(url, data, config)
}

/**
 * PUT请求简化版
 * @param url - 请求URL
 * @param data - 请求数据
 * @param config - axios配置
 * @returns Promise<响应数据>
 */
export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiClient.put<T, T>(url, data, config)
}

/**
 * DELETE请求简化版
 * @param url - 请求URL
 * @param config - axios配置
 * @returns Promise<响应数据>
 */
export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.delete<T, T>(url, config)
}

/**
 * PATCH请求简化版
 * @param url - 请求URL
 * @param data - 请求数据
 * @param config - axios配置
 * @returns Promise<响应数据>
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiClient.patch<T, T>(url, data, config)
}

/**
 * ==================== 请求配置工具 ====================
 */

/**
 * 构建查询字符串
 * @param params - 查询参数对象
 * @returns 查询字符串（不含?前缀）
 * @example
 * buildQueryString({ page: 1, size: 10 }) // "page=1&size=10"
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    // 跳过undefined和null
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

/**
 * 构建FormData对象
 * @param data - 表单数据对象
 * @returns FormData对象
 * @example
 * buildFormData({ file: fileObject, name: 'test' })
 */
export function buildFormData(data: Record<string, FormDataValue | FormDataValue[]>): FormData {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    // 处理数组
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          formData.append(key, item instanceof Blob ? item : String(item))
        }
      })
    } else {
      // 处理单个值
      formData.append(key, value instanceof Blob ? value : String(value))
    }
  })

  return formData
}

/**
 * 合并axios配置
 * @param config1 - 基础配置
 * @param config2 - 需要合并的配置
 * @returns 合并后的配置
 */
export function mergeConfig(
  config1: AxiosRequestConfig,
  config2: AxiosRequestConfig
): AxiosRequestConfig {
  return {
    ...config1,
    ...config2,
    headers: {
      ...config1.headers,
      ...config2.headers
    },
    params: {
      ...config1.params,
      ...config2.params
    }
  }
}

/**
 * ==================== 请求辅助函数 ====================
 */

/**
 * 创建带重试功能的请求
 * @param retryCount - 重试次数，默认3次
 * @returns 带重试功能的请求函数
 * @example
 * const requestWithRetry = createRequestWithRetry(3)
 * await requestWithRetry(() => get('/api/data'))
 */
export function createRequestWithRetry(retryCount: number = 3) {
  return async function <T>(requestFn: () => Promise<T>, delay: number = 1000): Promise<T> {
    let lastError: any

    for (let i = 0; i <= retryCount; i++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error

        // 如果还有重试次数，等待后重试
        if (i < retryCount) {
          if (import.meta.env.DEV) {
            console.log(`[Request Retry] 第 ${i + 1} 次重试，${delay}ms 后重试...`)
          }
          await new Promise((resolve) => setTimeout(resolve, delay))
          // 指数退避：每次重试延迟翻倍
          delay *= 2
        }
      }
    }

    // 所有重试都失败
    throw lastError
  }
}

/**
 * 创建带超时的请求
 * @param timeout - 超时时间（毫秒）
 * @returns 带超时的请求函数
 * @example
 * const requestWithTimeout = createRequestWithTimeout(5000)
 * await requestWithTimeout(() => get('/api/data'))
 */
export function createRequestWithTimeout(timeout: number) {
  return async function <T>(requestFn: () => Promise<T>): Promise<T> {
    return Promise.race([
      requestFn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject({
            message: `请求超时（${timeout}ms）`,
            code: 'REQUEST_TIMEOUT'
          })
        }, timeout)
      })
    ])
  }
}

/**
 * 获取取消token
 * @returns CancelTokenSource对象，包含token和cancel方法
 * @example
 * const { token, cancel } = getCancelToken()
 * get('/api/data', {}, { cancelToken: token })
 * // 取消请求
 * cancel('用户取消了请求')
 */
export function getCancelToken(): CancelTokenSource {
  return axios.CancelToken.source()
}

/**
 * 判断是否为取消错误
 * @param error - 错误对象
 * @returns 是否为取消错误
 */
export function isCancel(error: any): boolean {
  return axios.isCancel(error)
}

/**
 * ==================== URL工具函数 ====================
 */

/**
 * 解析API完整URL
 * @param path - API路径
 * @returns 完整的API URL
 * @example
 * resolveApiUrl('/users') // "http://localhost:3000/api/v1/users"
 */
export function resolveApiUrl(path: string): string {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

  // 移除path开头的斜杠（如果有）
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // 移除baseURL结尾的斜杠（如果有）
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL

  return `${cleanBaseURL}/${cleanPath}`
}

/**
 * 判断是否为绝对URL
 * @param url - 待判断的URL
 * @returns 是否为绝对URL
 * @example
 * isAbsoluteUrl('http://example.com') // true
 * isAbsoluteUrl('/api/users') // false
 */
export function isAbsoluteUrl(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
}

/**
 * 拼接URL路径
 * @param base - 基础路径
 * @param paths - 需要拼接的路径片段
 * @returns 拼接后的完整路径
 * @example
 * joinUrl('/api', 'users', '123') // "/api/users/123"
 */
export function joinUrl(base: string, ...paths: string[]): string {
  let result = base.endsWith('/') ? base.slice(0, -1) : base

  for (const path of paths) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    result += `/${cleanPath}`
  }

  return result
}

/**
 * ==================== 文件上传辅助 ====================
 */

/**
 * 上传文件
 * @param url - 上传URL
 * @param file - 文件对象
 * @param data - 附加的表单数据
 * @param onProgress - 上传进度回调
 * @returns Promise<响应数据>
 * @example
 * uploadFile('/api/upload', fileObject, { type: 'resume' }, (progress) => {
 *   console.log(`上传进度: ${progress}%`)
 * })
 */
export async function uploadFile<T = any>(
  url: string,
  file: File,
  data?: Record<string, FormDataValue>,
  onProgress?: (progress: number) => void
): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)

  // 添加附加数据
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof Blob ? value : String(value))
      }
    })
  }

  return apiClient.post<T, T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    }
  })
}

/**
 * 批量上传文件
 * @param url - 上传URL
 * @param files - 文件数组
 * @param data - 附加的表单数据
 * @param onProgress - 上传进度回调
 * @returns Promise<响应数据>
 */
export async function uploadFiles<T = any>(
  url: string,
  files: File[],
  data?: Record<string, FormDataValue>,
  onProgress?: (progress: number) => void
): Promise<T> {
  const formData = new FormData()

  // 添加所有文件
  files.forEach((file) => {
    formData.append('files', file)
  })

  // 添加附加数据
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof Blob ? value : String(value))
      }
    })
  }

  return apiClient.post<T, T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    }
  })
}

/**
 * ==================== 默认导出 ====================
 */

export default {
  // 便捷方法
  get,
  post,
  put,
  delete: del,
  patch,

  // 配置工具
  buildQueryString,
  buildFormData,
  mergeConfig,

  // 请求辅助
  createRequestWithRetry,
  createRequestWithTimeout,
  getCancelToken,
  isCancel,

  // URL工具
  resolveApiUrl,
  isAbsoluteUrl,
  joinUrl,

  // 文件上传
  uploadFile,
  uploadFiles,

  // apiClient实例
  apiClient
}
