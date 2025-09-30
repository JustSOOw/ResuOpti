/**
 * 文件上传Composable
 * 提供文件上传进度管理的Composition API逻辑复用
 * 支持文件类型验证、大小验证、上传进度追踪等功能
 */

import { ref, computed, type Ref } from 'vue'
import apiClient from '@/services/api'
import type { AxiosProgressEvent, AxiosRequestConfig, CancelTokenSource } from 'axios'
import axios from 'axios'

/**
 * 文件上传配置接口
 */
export interface FileUploadConfig {
  /** 上传端点URL */
  url?: string
  /** 接受的文件类型（MIME类型或扩展名，如：'.pdf,.doc,.docx' 或 'application/pdf'） */
  accept?: string
  /** 最大文件大小（字节），默认10MB */
  maxSize?: number
  /** 额外的请求头 */
  headers?: Record<string, string>
  /** 额外的请求数据 */
  data?: Record<string, any>
  /** 文件字段名，默认'file' */
  fieldName?: string
}

/**
 * 上传结果接口
 */
export interface UploadResult<T = any> {
  /** 是否成功 */
  success: boolean
  /** 服务器响应数据 */
  data?: T
  /** 错误信息 */
  error?: string
  /** HTTP状态码 */
  status?: number
}

/**
 * 文件验证结果接口
 */
export interface FileValidationResult {
  /** 是否通过验证 */
  valid: boolean
  /** 错误消息（验证失败时） */
  error?: string
}

/**
 * 已上传文件信息接口
 */
export interface UploadedFileInfo {
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** 文件类型 */
  type: string
  /** 上传时间戳 */
  uploadTime: number
  /** 服务器返回的数据 */
  response?: any
}

/**
 * 文件上传Composable
 * @param defaultConfig 默认配置
 * @returns 文件上传相关的状态和方法
 */
export function useFileUpload(defaultConfig: FileUploadConfig = {}) {
  // ============ 默认配置 ============
  const config = {
    url: defaultConfig.url || '/upload',
    accept: defaultConfig.accept || '.pdf,.doc,.docx',
    maxSize: defaultConfig.maxSize || 10 * 1024 * 1024, // 10MB
    fieldName: defaultConfig.fieldName || 'file',
    headers: defaultConfig.headers || {},
    data: defaultConfig.data || {}
  }

  // ============ 响应式状态 ============
  /** 上传进度（0-100） */
  const uploadProgress: Ref<number> = ref(0)

  /** 是否正在上传 */
  const isUploading: Ref<boolean> = ref(false)

  /** 已上传文件列表 */
  const uploadedFiles: Ref<UploadedFileInfo[]> = ref([])

  /** 错误信息 */
  const error: Ref<string | null> = ref(null)

  /** 取消令牌源（用于取消上传） */
  let cancelTokenSource: CancelTokenSource | null = null

  // ============ 计算属性 ============
  /**
   * 格式化的上传进度文本
   */
  const progressText = computed(() => {
    return `${uploadProgress.value}%`
  })

  /**
   * 是否有错误
   */
  const hasError = computed(() => {
    return error.value !== null
  })

  /**
   * 已上传文件数量
   */
  const uploadedFileCount = computed(() => {
    return uploadedFiles.value.length
  })

  // ============ 工具方法 ============
  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的文件大小字符串（B/KB/MB/GB）
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  /**
   * 解析文件扩展名
   * @param fileName 文件名
   * @returns 文件扩展名（包含点号，如：'.pdf'）
   */
  const getFileExtension = (fileName: string): string => {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot >= 0 ? fileName.substring(lastDot).toLowerCase() : ''
  }

  /**
   * 验证文件类型
   * @param file 文件对象
   * @param acceptTypes 接受的类型字符串（如：'.pdf,.doc,.docx'）
   * @returns 是否通过验证
   */
  const validateFileType = (file: File, acceptTypes: string): boolean => {
    // 解析accept参数中的MIME类型和扩展名
    const types = acceptTypes.split(',').map(t => t.trim().toLowerCase())

    // 获取文件扩展名和MIME类型
    const fileName = file.name.toLowerCase()
    const fileExtension = getFileExtension(fileName)
    const fileMimeType = file.type.toLowerCase()

    // 检查是否匹配任一类型
    return types.some(type => {
      // 检查扩展名匹配
      if (type.startsWith('.')) {
        return fileExtension === type
      }

      // 检查MIME类型匹配
      if (type.includes('/')) {
        // 支持通配符，如 'image/*'
        if (type.endsWith('/*')) {
          const prefix = type.replace('/*', '')
          return fileMimeType.startsWith(prefix)
        }
        return fileMimeType === type
      }

      return false
    })
  }

  /**
   * 验证文件大小
   * @param file 文件对象
   * @param maxSize 最大文件大小（字节）
   * @returns 是否通过验证
   */
  const validateFileSize = (file: File, maxSize: number): boolean => {
    return file.size <= maxSize
  }

  /**
   * 验证文件
   * @param file 文件对象
   * @param customConfig 自定义配置（可选）
   * @returns 验证结果
   */
  const validateFile = (
    file: File,
    customConfig?: Partial<FileUploadConfig>
  ): FileValidationResult => {
    const mergedConfig = { ...config, ...customConfig }

    // 验证文件类型
    if (mergedConfig.accept && !validateFileType(file, mergedConfig.accept)) {
      const acceptTypes = mergedConfig.accept
        .split(',')
        .map(t => t.trim().toUpperCase())
        .join(', ')

      return {
        valid: false,
        error: `文件类型不支持。仅支持：${acceptTypes}`
      }
    }

    // 验证文件大小
    if (mergedConfig.maxSize && !validateFileSize(file, mergedConfig.maxSize)) {
      return {
        valid: false,
        error: `文件大小超出限制。最大允许：${formatFileSize(mergedConfig.maxSize)}`
      }
    }

    // 验证通过
    return { valid: true }
  }

  // ============ 上传方法 ============
  /**
   * 上传文件
   * @param file 要上传的文件对象
   * @param customConfig 自定义配置（可选）
   * @returns 上传结果Promise
   */
  const uploadFile = async <T = any>(
    file: File,
    customConfig?: Partial<FileUploadConfig>
  ): Promise<UploadResult<T>> => {
    // 合并配置
    const mergedConfig = { ...config, ...customConfig }

    // 验证文件
    const validation = validateFile(file, customConfig)
    if (!validation.valid) {
      error.value = validation.error || '文件验证失败'
      return {
        success: false,
        error: error.value
      }
    }

    // 重置状态
    error.value = null
    uploadProgress.value = 0
    isUploading.value = true

    // 创建取消令牌
    cancelTokenSource = axios.CancelToken.source()

    try {
      // 构造FormData
      const formData = new FormData()
      formData.append(mergedConfig.fieldName!, file)

      // 添加额外的数据
      if (mergedConfig.data) {
        Object.entries(mergedConfig.data).forEach(([key, value]) => {
          formData.append(key, value)
        })
      }

      // 配置axios请求
      const axiosConfig: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...mergedConfig.headers
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          // 更新上传进度
          if (progressEvent.total && progressEvent.total > 0) {
            uploadProgress.value = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            )
          }
        },
        cancelToken: cancelTokenSource.token
      }

      // 发送上传请求
      const response = await apiClient.post<any, T>(
        mergedConfig.url!,
        formData,
        axiosConfig
      )

      // 上传成功
      uploadProgress.value = 100
      isUploading.value = false

      // 添加到已上传文件列表
      const uploadedFileInfo: UploadedFileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: Date.now(),
        response
      }
      uploadedFiles.value.push(uploadedFileInfo)

      return {
        success: true,
        data: response,
        status: 200
      }
    } catch (err: any) {
      // 上传失败
      isUploading.value = false
      uploadProgress.value = 0

      // 处理取消上传
      if (axios.isCancel(err)) {
        error.value = '上传已取消'
        return {
          success: false,
          error: error.value
        }
      }

      // 处理其他错误
      error.value = err.message || '上传失败，请稍后重试'
      return {
        success: false,
        error: error.value,
        status: err.status
      }
    } finally {
      cancelTokenSource = null
    }
  }

  /**
   * 取消上传
   * @param message 取消消息（可选）
   */
  const cancelUpload = (message?: string) => {
    if (cancelTokenSource && isUploading.value) {
      cancelTokenSource.cancel(message || '用户取消上传')
      cancelTokenSource = null
      isUploading.value = false
      uploadProgress.value = 0
    }
  }

  /**
   * 重置上传状态
   * @param clearHistory 是否清空上传历史，默认false
   */
  const resetUpload = (clearHistory: boolean = false) => {
    uploadProgress.value = 0
    isUploading.value = false
    error.value = null

    if (clearHistory) {
      uploadedFiles.value = []
    }

    // 取消正在进行的上传
    if (cancelTokenSource) {
      cancelTokenSource.cancel('重置上传状态')
      cancelTokenSource = null
    }
  }

  /**
   * 移除已上传的文件
   * @param index 文件索引
   */
  const removeUploadedFile = (index: number) => {
    if (index >= 0 && index < uploadedFiles.value.length) {
      uploadedFiles.value.splice(index, 1)
    }
  }

  /**
   * 清空已上传文件列表
   */
  const clearUploadedFiles = () => {
    uploadedFiles.value = []
  }

  // ============ 返回公共API ============
  return {
    // 状态
    uploadProgress,
    isUploading,
    uploadedFiles,
    error,

    // 计算属性
    progressText,
    hasError,
    uploadedFileCount,

    // 方法
    uploadFile,
    validateFile,
    formatFileSize,
    cancelUpload,
    resetUpload,
    removeUploadedFile,
    clearUploadedFiles
  }
}

export default useFileUpload