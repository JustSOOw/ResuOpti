/**
 * 前后端共享类型定义 - 统一导出
 *
 * 本模块提供前后端共享的TypeScript类型定义，确保数据一致性
 *
 * 命名规范：
 * - 使用camelCase字段命名（前端风格）
 * - 后端使用snake_case时需要进行转换
 *
 * @module shared/types
 */

// API通用类型
export type {
  ApiResponse,
  ApiErrorResponse,
  PaginationParams,
  PaginatedResponse,
  SortParams,
} from './api'

// 用户类型
export type {
  User,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ChangePasswordRequest,
  UpdateUserRequest,
} from './user'

// 岗位类型
export type {
  TargetPosition,
  CreateTargetPositionRequest,
  UpdateTargetPositionRequest,
  TargetPositionWithStats,
} from './position'

// 简历类型
export type {
  ResumeVersion,
  ResumeMetadata,
  ApplicationRecord,
  CreateFileResumeRequest,
  CreateOnlineResumeRequest,
  UpdateResumeVersionRequest,
  UpdateResumeMetadataRequest,
  CreateApplicationRecordRequest,
  UpdateApplicationRecordRequest,
  ResumeVersionWithMetadata,
  ResumeVersionWithStats,
  ResumeType,
  ApplicationStatus,
} from './resume'