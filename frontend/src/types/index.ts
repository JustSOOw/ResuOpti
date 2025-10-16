/**
 * 类型定义主导出文件
 * 统一导出所有类型定义，方便在项目中使用
 *
 * @example
 * // 使用方式1：导入所有类型
 * import * as Types from '@/types'
 * const user: Types.User = { ... }
 *
 * @example
 * // 使用方式2：按需导入
 * import type { User, TargetPosition } from '@/types'
 *
 * @example
 * // 使用方式3：从子模块导入
 * import type { User } from '@/types/entities'
 * import type { LoginRequest } from '@/types/api'
 */

// ==================== 枚举类型 ====================
export type { ResumeType, ApplicationStatus, ThemeMode, SortOrder } from './enums'

// ==================== 业务实体 ====================
export type {
  User,
  TargetPosition,
  ResumeVersion,
  ResumeMetadata,
  ResumeDetail,
  ApplicationRecord
} from './entities'

// ==================== 通用类型 ====================
export type {
  Pagination,
  PaginationMeta,
  PaginatedResponse,
  SortParams,
  DateRange,
  FilterParams,
  UploadProgressCallback,
  Option
} from './common'

// ==================== API类型 ====================
export type {
  // 通用响应
  ApiResponse,
  ApiError,

  // 认证相关
  RegisterRequest,
  RegisterResponseData,
  RegisterResponse,
  LoginRequest,
  LoginResponseData,
  LoginResponse,

  // 目标岗位相关
  CreatePositionDto,
  UpdatePositionDto,
  GetPositionsResponse,
  GetPositionResponse,
  CreatePositionResponse,
  UpdatePositionResponse,
  DeletePositionResponse,

  // 简历相关
  CreateResumeDto,
  UpdateResumeDto,
  GetResumesParams,
  GetResumesResponse,
  GetResumeResponse,
  CreateResumeResponse,
  UpdateResumeResponse,
  DeleteResumeResponse,
  UploadResumeResponse,

  // 投递记录相关
  CreateApplicationDto,
  UpdateApplicationDto,
  GetApplicationsParams,
  GetApplicationsResponse,
  GetApplicationResponse,
  CreateApplicationResponse,
  UpdateApplicationResponse,
  DeleteApplicationResponse,

  // 简历元数据相关
  UpdateMetadataDto,
  GetMetadataResponse,
  UpdateMetadataResponse
} from './api'
