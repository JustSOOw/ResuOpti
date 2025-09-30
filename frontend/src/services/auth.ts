/**
 * 用户认证API服务
 * 提供注册和登录功能
 */

import apiClient from './api'

// ==================== TypeScript接口定义 ====================

/**
 * 用户注册请求参数
 */
export interface RegisterRequest {
  email: string
  password: string
}

/**
 * 用户注册响应数据
 */
export interface RegisterResponse {
  success: boolean
  message: string
  data: {
    userId: string
    email: string
  }
}

/**
 * 用户登录请求参数
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * 用户信息接口
 */
export interface User {
  id: string
  email: string
  createdAt: string
}

/**
 * 用户登录响应数据
 */
export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}

// ==================== API函数实现 ====================

/**
 * 用户注册
 * @param email 用户邮箱（必须是有效的邮箱格式）
 * @param password 用户密码（最少8位，包含字母和数字）
 * @returns Promise<RegisterResponse> 注册响应数据
 * @throws 400 - 请求参数验证失败
 * @throws 409 - 邮箱已存在
 */
export const register = async (
  email: string,
  password: string
): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post<RegisterResponse>(
      '/auth/register',
      {
        email,
        password
      }
    )
    return response as RegisterResponse
  } catch (error: any) {
    // 提取错误消息
    const errorMessage = error.response?.data?.message || '注册失败，请稍后重试'
    throw new Error(errorMessage)
  }
}

/**
 * 用户登录
 * @param email 用户邮箱
 * @param password 用户密码
 * @returns Promise<LoginResponse> 登录响应数据（包含token和用户信息）
 * @throws 400 - 请求参数验证失败
 * @throws 401 - 用户不存在或密码错误
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      {
        email,
        password
      }
    )

    // 登录成功后，将token保存到localStorage
    const loginData = response as LoginResponse
    if (loginData.success && loginData.data.token) {
      localStorage.setItem('token', loginData.data.token)
    }

    return loginData
  } catch (error: any) {
    // 提取错误消息
    const errorMessage = error.response?.data?.message || '登录失败，请稍后重试'
    throw new Error(errorMessage)
  }
}

/**
 * 用户登出
 * 清除本地存储的token
 */
export const logout = (): void => {
  localStorage.removeItem('token')
}

/**
 * 检查用户是否已登录
 * @returns boolean 是否存在有效的token
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token')
  return !!token
}