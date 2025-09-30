/**
 * 使用示例
 *
 * 演示如何在前后端使用共享类型定义
 */

// ============================================
// 示例1: 后端API处理器中使用类型
// ============================================

import type {
  User,
  LoginRequest,
  AuthResponse,
  ApiResponse,
  CreateTargetPositionRequest,
  TargetPosition,
} from '../types'

import {
  USER_VALIDATION,
  POSITION_VALIDATION,
  AUTH_ENDPOINTS,
} from '../constants'

// 后端登录处理器示例
async function handleLogin(req: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(req.email)) {
    throw new Error('邮箱格式无效')
  }

  // 验证密码
  if (!USER_VALIDATION.PASSWORD_PATTERN.test(req.password)) {
    throw new Error('密码格式无效')
  }

  // 模拟用户认证...
  const user: User = {
    id: 'uuid-123',
    email: req.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const authResponse: AuthResponse = {
    accessToken: 'jwt-token',
    user,
  }

  return {
    success: true,
    message: '登录成功',
    data: authResponse,
  }
}

// 后端创建岗位处理器示例
async function handleCreatePosition(
  userId: string,
  req: CreateTargetPositionRequest
): Promise<ApiResponse<TargetPosition>> {
  // 验证岗位名称长度
  if (
    req.name.length < POSITION_VALIDATION.NAME_MIN_LENGTH ||
    req.name.length > POSITION_VALIDATION.NAME_MAX_LENGTH
  ) {
    throw new Error(
      `岗位名称长度必须在 ${POSITION_VALIDATION.NAME_MIN_LENGTH}-${POSITION_VALIDATION.NAME_MAX_LENGTH} 字符之间`
    )
  }

  // 模拟创建岗位...
  const position: TargetPosition = {
    id: 'uuid-456',
    userId,
    name: req.name,
    description: req.description || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return {
    success: true,
    message: '岗位创建成功',
    data: position,
  }
}

// ============================================
// 示例2: 前端API调用中使用类型
// ============================================

import type { ApiErrorResponse } from '../types'

// 前端登录函数示例
async function login(email: string, password: string): Promise<AuthResponse> {
  const loginRequest: LoginRequest = {
    email,
    password,
  }

  const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginRequest),
  })

  const data: ApiResponse<AuthResponse> | ApiErrorResponse = await response.json()

  if (!data.success) {
    throw new Error(data.message)
  }

  return data.data
}

// 前端创建岗位函数示例
async function createPosition(
  name: string,
  description?: string
): Promise<TargetPosition> {
  // 前端验证
  if (name.length > POSITION_VALIDATION.NAME_MAX_LENGTH) {
    throw new Error(`岗位名称不能超过 ${POSITION_VALIDATION.NAME_MAX_LENGTH} 字符`)
  }

  const createRequest: CreateTargetPositionRequest = {
    name,
    description,
  }

  const response = await fetch('/api/v1/positions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(createRequest),
  })

  const data: ApiResponse<TargetPosition> | ApiErrorResponse = await response.json()

  if (!data.success) {
    throw new Error(data.message)
  }

  return data.data
}

// ============================================
// 示例3: 后端数据转换（snake_case ↔ camelCase）
// ============================================

// 数据库查询结果（snake_case）
interface DBUser {
  id: string
  email: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

// 转换函数：数据库结果 -> API响应
function dbUserToUser(dbUser: DBUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    createdAt: dbUser.created_at.toISOString(),
    updatedAt: dbUser.updated_at.toISOString(),
  }
}

// 转换函数：API请求 -> 数据库插入
function userToDBUser(user: User, passwordHash: string): DBUser {
  return {
    id: user.id,
    email: user.email,
    password_hash: passwordHash,
    created_at: new Date(user.createdAt),
    updated_at: new Date(user.updatedAt),
  }
}

// ============================================
// 示例4: 使用枚举类型
// ============================================

import type { ResumeType, ApplicationStatus } from '../types'

// 简历类型检查
function isOnlineResume(type: ResumeType): boolean {
  return type === 'online'
}

// 投递状态处理
function getStatusColor(status: ApplicationStatus): string {
  switch (status) {
    case '已投递':
      return 'blue'
    case '面试邀请':
      return 'orange'
    case '已拒绝':
      return 'red'
    case '已录用':
      return 'green'
    default:
      return 'gray'
  }
}

// ============================================
// 示例5: 分页处理
// ============================================

import type { PaginationParams, PaginatedResponse } from '../types'
import { PAGINATION_DEFAULTS } from '../constants'

// 后端分页查询
async function getPaginatedPositions(
  userId: string,
  params?: Partial<PaginationParams>
): Promise<PaginatedResponse<TargetPosition>> {
  const page = params?.page || PAGINATION_DEFAULTS.DEFAULT_PAGE
  const pageSize = Math.min(
    params?.pageSize || PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
    PAGINATION_DEFAULTS.MAX_PAGE_SIZE
  )

  // 模拟数据库查询...
  const positions: TargetPosition[] = []
  const total = 100

  return {
    items: positions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export {
  handleLogin,
  handleCreatePosition,
  login,
  createPosition,
  dbUserToUser,
  userToDBUser,
  isOnlineResume,
  getStatusColor,
  getPaginatedPositions,
}