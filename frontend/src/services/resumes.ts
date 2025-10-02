/**
 * 简历版本API服务
 * 提供简历CRUD操作和文件上传功能
 */

import apiClient from './api'

// ============ TypeScript接口定义 ============

/**
 * 简历版本类型
 */
export type ResumeType = 'file' | 'online'

/**
 * 简历版本实体
 */
export interface ResumeVersion {
  id: string
  targetPositionId: string
  type: ResumeType
  title: string
  filePath?: string // 仅file类型
  fileName?: string // 仅file类型
  fileSize?: number // 仅file类型
  content?: string // 仅online类型
  createdAt: string
  updatedAt: string
}

/**
 * 简历元数据实体
 */
export interface ResumeMetadata {
  id: string
  resumeId: string
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 创建简历DTO
 */
export interface CreateResumeDto {
  targetPositionId: string
  type: ResumeType
  title: string
  content?: string // online类型必需
  filePath?: string // file类型必需
  fileName?: string
  fileSize?: number
}

/**
 * 更新简历DTO
 */
export interface UpdateResumeDto {
  title?: string
  content?: string
  notes?: string
  tags?: string[]
}

/**
 * 简历详情（包含元数据）
 */
export interface ResumeDetail extends ResumeVersion {
  metadata?: ResumeMetadata
}

/**
 * 上传进度回调类型
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * API响应格式
 */
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

// ============ API函数 ============

/**
 * 获取简历列表
 * @param positionId 可选，目标职位ID，用于筛选该职位的简历
 * @returns 简历版本数组
 */
export const getResumes = async (positionId?: string): Promise<ResumeVersion[]> => {
  try {
    const params = positionId ? { positionId } : {}
    const response = await apiClient.get<any, ApiResponse<ResumeVersion[]>>('/resumes', { params })
    return response.data
  } catch (error: any) {
    console.error('获取简历列表失败:', error)
    throw new Error(error.response?.data?.message || '获取简历列表失败')
  }
}

/**
 * 根据ID获取简历详情
 * @param id 简历ID
 * @returns 简历详情（包含元数据）
 */
export const getResumeById = async (id: string): Promise<ResumeDetail> => {
  try {
    const response = await apiClient.get<any, ApiResponse<ResumeDetail>>(`/resumes/${id}`)
    return response.data
  } catch (error: any) {
    console.error('获取简历详情失败:', error)
    throw new Error(error.response?.data?.message || '获取简历详情失败')
  }
}

/**
 * 创建新简历
 * @param data 创建简历DTO
 * @returns 创建的简历版本
 */
export const createResume = async (data: CreateResumeDto): Promise<ResumeVersion> => {
  try {
    // 验证在线简历必须提供content字段（允许空字符串，用户可以在编辑器中填充）
    if (data.type === 'online' && data.content === undefined) {
      throw new Error('在线简历必须提供content字段')
    }

    // 验证文件简历必须有文件路径
    if (data.type === 'file' && !data.filePath) {
      throw new Error('文件简历必须提供文件路径')
    }

    // 显式构造一个干净的请求负载，避免序列化过程中把必须的键丢掉。
    const payload: Record<string, unknown> = {
      targetPositionId: data.targetPositionId,
      type: data.type,
      title: typeof data.title === 'string' ? data.title.trim() : data.title
    }

    if (data.type === 'online') {
      payload.content = data.content ?? ''
    }

    if (data.type === 'file') {
      if (data.filePath) payload.filePath = data.filePath
      if (data.fileName) payload.fileName = data.fileName
      if (data.fileSize !== undefined) payload.fileSize = data.fileSize
    }

    const response = await apiClient.post<any, ApiResponse<ResumeVersion>>('/resumes', payload)
    return response.data
  } catch (error: any) {
    console.error('创建简历失败:', error)
    throw new Error(error.response?.data?.message || error.message || '创建简历失败')
  }
}

/**
 * 更新简历
 * @param id 简历ID
 * @param data 更新简历DTO
 * @returns 更新后的简历版本
 */
export const updateResume = async (id: string, data: UpdateResumeDto): Promise<ResumeVersion> => {
  try {
    const response = await apiClient.put<any, ApiResponse<ResumeVersion>>(`/resumes/${id}`, data)
    return response.data
  } catch (error: any) {
    console.error('更新简历失败:', error)
    throw new Error(error.response?.data?.message || '更新简历失败')
  }
}

/**
 * 删除简历
 * @param id 简历ID
 */
export const deleteResume = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<any, ApiResponse<void>>(`/resumes/${id}`)
  } catch (error: any) {
    console.error('删除简历失败:', error)
    throw new Error(error.response?.data?.message || '删除简历失败')
  }
}

/**
 * 上传简历文件
 * @param file 文件对象（PDF或Word文档）
 * @param targetPositionId 目标职位ID
 * @param title 简历标题
 * @param onProgress 可选，上传进度回调函数
 * @returns 创建的简历版本
 */
export const uploadResumeFile = async (
  file: File,
  targetPositionId: string,
  title: string,
  onProgress?: UploadProgressCallback
): Promise<ResumeVersion> => {
  try {
    // 客户端文件类型验证
    const allowedTypes = [
      'application/pdf', // PDF
      'application/msword', // Word 97-2003
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Word 2007+
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的文件格式，仅支持PDF和Word文档（.pdf, .doc, .docx）')
    }

    // 客户端文件大小验证（10MB限制）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('文件大小不能超过10MB')
    }

    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', file)
    formData.append('targetPositionId', targetPositionId)
    formData.append('title', title)

    // 发送multipart/form-data请求，带上传进度回调
    const response = await apiClient.post<any, ApiResponse<ResumeVersion>>(
      '/resumes/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          // 计算上传进度百分比
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      }
    )

    return response.data
  } catch (error: any) {
    console.error('上传简历文件失败:', error)

    // 如果是我们自己抛出的验证错误，直接抛出
    if (
      error.message &&
      (error.message.includes('不支持的文件格式') || error.message.includes('文件大小不能超过'))
    ) {
      throw error
    }

    // 处理服务器返回的错误
    throw new Error(error.response?.data?.message || '上传简历文件失败')
  }
}

// 导出所有API函数
export default {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  uploadResumeFile
}
