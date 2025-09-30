/**
 * API请求响应类型定义
 * 定义与后端API交互的请求和响应数据结构
 */

import type {
  User,
  TargetPosition,
  ResumeVersion,
  ResumeMetadata,
  ResumeDetail,
  ApplicationRecord
} from './entities'
import type { ResumeType, ApplicationStatus } from './enums'

// ==================== 通用API响应 ====================

/**
 * 通用API响应格式
 * @template T 响应数据类型
 */
export interface ApiResponse<T> {
  /** 请求是否成功 */
  success: boolean
  /** 响应消息 */
  message?: string
  /** 响应数据 */
  data: T
}

/**
 * 通用错误响应格式
 */
export interface ApiError {
  /** 请求是否成功（固定为false） */
  success: false
  /** 错误消息 */
  message: string
  /** 错误代码（可选） */
  code?: string
  /** 详细错误信息（可选） */
  details?: any
}

// ==================== 认证相关API类型 ====================

/**
 * 用户注册请求
 */
export interface RegisterRequest {
  /** 用户邮箱（有效的邮箱格式） */
  email: string
  /** 用户密码（最少8位，包含字母和数字） */
  password: string
}

/**
 * 用户注册响应数据
 */
export interface RegisterResponseData {
  /** 用户ID */
  userId: string
  /** 用户邮箱 */
  email: string
}

/**
 * 用户注册响应
 */
export interface RegisterResponse {
  /** 请求是否成功 */
  success: boolean
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: RegisterResponseData
}

/**
 * 用户登录请求
 */
export interface LoginRequest {
  /** 用户邮箱 */
  email: string
  /** 用户密码 */
  password: string
}

/**
 * 用户登录响应数据
 */
export interface LoginResponseData {
  /** JWT认证令牌 */
  token: string
  /** 用户信息 */
  user: User
}

/**
 * 用户登录响应
 */
export interface LoginResponse {
  /** 请求是否成功 */
  success: boolean
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: LoginResponseData
}

// ==================== 目标岗位相关API类型 ====================

/**
 * 创建目标岗位请求
 */
export interface CreatePositionDto {
  /** 岗位名称（必需，1-100字符） */
  name: string
  /** 岗位描述（可选） */
  description?: string
}

/**
 * 更新目标岗位请求
 */
export interface UpdatePositionDto {
  /** 岗位名称（可选） */
  name?: string
  /** 岗位描述（可选） */
  description?: string
}

/**
 * 目标岗位列表响应
 */
export type GetPositionsResponse = ApiResponse<TargetPosition[]>

/**
 * 目标岗位详情响应
 */
export type GetPositionResponse = ApiResponse<TargetPosition>

/**
 * 创建目标岗位响应
 */
export type CreatePositionResponse = ApiResponse<TargetPosition>

/**
 * 更新目标岗位响应
 */
export type UpdatePositionResponse = ApiResponse<TargetPosition>

/**
 * 删除目标岗位响应
 */
export type DeletePositionResponse = ApiResponse<null>

// ==================== 简历相关API类型 ====================

/**
 * 创建简历请求
 */
export interface CreateResumeDto {
  /** 关联的目标岗位ID */
  targetPositionId: string
  /** 简历类型 */
  type: ResumeType
  /** 简历标题 */
  title: string
  /** 在线简历内容（online类型时必需） */
  content?: string
  /** 文件路径（file类型时必需） */
  filePath?: string
  /** 文件名 */
  fileName?: string
  /** 文件大小（字节） */
  fileSize?: number
}

/**
 * 更新简历请求
 */
export interface UpdateResumeDto {
  /** 简历标题（可选） */
  title?: string
  /** 在线简历内容（可选） */
  content?: string
  /** 备注信息（可选） */
  notes?: string
  /** 标签数组（可选） */
  tags?: string[]
}

/**
 * 简历列表查询参数
 */
export interface GetResumesParams {
  /** 目标岗位ID（可选，用于筛选） */
  positionId?: string
}

/**
 * 简历列表响应
 */
export type GetResumesResponse = ApiResponse<ResumeVersion[]>

/**
 * 简历详情响应
 */
export type GetResumeResponse = ApiResponse<ResumeDetail>

/**
 * 创建简历响应
 */
export type CreateResumeResponse = ApiResponse<ResumeVersion>

/**
 * 更新简历响应
 */
export type UpdateResumeResponse = ApiResponse<ResumeVersion>

/**
 * 删除简历响应
 */
export type DeleteResumeResponse = ApiResponse<null>

/**
 * 上传简历文件响应
 */
export type UploadResumeResponse = ApiResponse<ResumeVersion>

// ==================== 投递记录相关API类型 ====================

/**
 * 创建投递记录请求
 */
export interface CreateApplicationDto {
  /** 关联的简历ID */
  resumeId: string
  /** 公司名称（必需，1-200字符） */
  companyName: string
  /** 职位名称（可选） */
  positionTitle?: string
  /** 投递日期（YYYY-MM-DD格式） */
  applyDate: string
  /** 投递状态（默认：已投递） */
  status?: ApplicationStatus
  /** 备注信息（可选） */
  notes?: string
}

/**
 * 更新投递记录请求
 */
export interface UpdateApplicationDto {
  /** 公司名称（可选） */
  companyName?: string
  /** 职位名称（可选） */
  positionTitle?: string
  /** 投递日期（可选） */
  applyDate?: string
  /** 投递状态（可选） */
  status?: ApplicationStatus
  /** 备注信息（可选） */
  notes?: string
}

/**
 * 投递记录列表查询参数
 */
export interface GetApplicationsParams {
  /** 简历ID（可选，用于筛选） */
  resumeId?: string
  /** 投递状态（可选，用于筛选） */
  status?: ApplicationStatus
}

/**
 * 投递记录列表响应
 */
export type GetApplicationsResponse = ApiResponse<ApplicationRecord[]>

/**
 * 投递记录详情响应
 */
export type GetApplicationResponse = ApiResponse<ApplicationRecord>

/**
 * 创建投递记录响应
 */
export type CreateApplicationResponse = ApiResponse<ApplicationRecord>

/**
 * 更新投递记录响应
 */
export type UpdateApplicationResponse = ApiResponse<ApplicationRecord>

/**
 * 删除投递记录响应
 */
export type DeleteApplicationResponse = ApiResponse<null>

// ==================== 简历元数据相关API类型 ====================

/**
 * 更新简历元数据请求
 */
export interface UpdateMetadataDto {
  /** 备注信息（可选，最多2000字符） */
  notes?: string
  /** 标签数组（可选，最多20个，每个最多50字符） */
  tags?: string[]
}

/**
 * 简历元数据响应
 */
export type GetMetadataResponse = ApiResponse<ResumeMetadata>

/**
 * 更新简历元数据响应
 */
export type UpdateMetadataResponse = ApiResponse<ResumeMetadata>