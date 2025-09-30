/**
 * 用户相关类型定义
 *
 * 包含用户实体、认证请求和响应类型
 */

/**
 * 用户实体
 */
export interface User {
  /** 用户唯一标识 (UUID) */
  id: string
  /**
   * 邮箱地址，用作登录账号
   * @format email
   */
  email: string
  /** 账户创建时间 (ISO 8601格式) */
  createdAt: string
  /** 最后更新时间 (ISO 8601格式) */
  updatedAt: string
}

/**
 * 用户注册请求
 */
export interface RegisterRequest {
  /**
   * 邮箱地址
   * @format email
   * @maxLength 255
   */
  email: string
  /**
   * 密码
   * @minLength 8
   * @pattern ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$
   * @description 至少8位，包含字母和数字
   */
  password: string
}

/**
 * 用户登录请求
 */
export interface LoginRequest {
  /**
   * 邮箱地址
   * @format email
   */
  email: string
  /** 密码 */
  password: string
}

/**
 * 认证响应
 */
export interface AuthResponse {
  /** JWT访问令牌 */
  accessToken: string
  /** 用户信息 */
  user: User
}

/**
 * 密码修改请求
 */
export interface ChangePasswordRequest {
  /** 旧密码 */
  oldPassword: string
  /**
   * 新密码
   * @minLength 8
   * @pattern ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$
   */
  newPassword: string
}

/**
 * 用户资料更新请求
 */
export interface UpdateUserRequest {
  /**
   * 邮箱地址
   * @format email
   * @maxLength 255
   */
  email?: string
}