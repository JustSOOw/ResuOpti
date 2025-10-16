/**
 * API端点常量
 *
 * 定义前后端共享的API路径常量
 */

/**
 * API基础路径
 */
export const API_BASE = '/api/v1' as const

/**
 * 认证相关端点
 */
export const AUTH_ENDPOINTS = {
  /** 用户注册 */
  REGISTER: `${API_BASE}/auth/register`,
  /** 用户登录 */
  LOGIN: `${API_BASE}/auth/login`,
  /** 获取当前用户信息 */
  ME: `${API_BASE}/auth/me`,
  /** 修改密码 */
  CHANGE_PASSWORD: `${API_BASE}/auth/change-password`,
} as const

/**
 * 用户相关端点
 */
export const USER_ENDPOINTS = {
  /** 用户资料 */
  PROFILE: `${API_BASE}/users/profile`,
  /** 更新用户信息 */
  UPDATE: `${API_BASE}/users`,
} as const

/**
 * 目标岗位相关端点
 */
export const POSITION_ENDPOINTS = {
  /** 岗位列表 */
  LIST: `${API_BASE}/positions`,
  /** 创建岗位 */
  CREATE: `${API_BASE}/positions`,
  /** 获取岗位详情 */
  DETAIL: (id: string) => `${API_BASE}/positions/${id}`,
  /** 更新岗位 */
  UPDATE: (id: string) => `${API_BASE}/positions/${id}`,
  /** 删除岗位 */
  DELETE: (id: string) => `${API_BASE}/positions/${id}`,
} as const

/**
 * 简历版本相关端点
 */
export const RESUME_ENDPOINTS = {
  /** 简历列表 */
  LIST: `${API_BASE}/resumes`,
  /** 创建文件简历 */
  CREATE_FILE: `${API_BASE}/resumes/file`,
  /** 创建在线简历 */
  CREATE_ONLINE: `${API_BASE}/resumes/online`,
  /** 获取简历详情 */
  DETAIL: (id: string) => `${API_BASE}/resumes/${id}`,
  /** 更新简历 */
  UPDATE: (id: string) => `${API_BASE}/resumes/${id}`,
  /** 删除简历 */
  DELETE: (id: string) => `${API_BASE}/resumes/${id}`,
  /** 下载简历文件 */
  DOWNLOAD: (id: string) => `${API_BASE}/resumes/${id}/download`,
  /** 导出为PDF */
  EXPORT_PDF: (id: string) => `${API_BASE}/resumes/${id}/export-pdf`,
  /** 按岗位查询简历 */
  BY_POSITION: (positionId: string) => `${API_BASE}/resumes?targetPositionId=${positionId}`,
} as const

/**
 * 简历元数据相关端点
 */
export const METADATA_ENDPOINTS = {
  /** 获取元数据 */
  DETAIL: (resumeId: string) => `${API_BASE}/resumes/${resumeId}/metadata`,
  /** 更新元数据 */
  UPDATE: (resumeId: string) => `${API_BASE}/resumes/${resumeId}/metadata`,
} as const

/**
 * 投递记录相关端点
 */
export const APPLICATION_ENDPOINTS = {
  /** 投递记录列表 */
  LIST: `${API_BASE}/applications`,
  /** 创建投递记录 */
  CREATE: `${API_BASE}/applications`,
  /** 获取投递记录详情 */
  DETAIL: (id: string) => `${API_BASE}/applications/${id}`,
  /** 更新投递记录 */
  UPDATE: (id: string) => `${API_BASE}/applications/${id}`,
  /** 删除投递记录 */
  DELETE: (id: string) => `${API_BASE}/applications/${id}`,
  /** 按简历查询投递记录 */
  BY_RESUME: (resumeId: string) => `${API_BASE}/applications?resumeId=${resumeId}`,
  /** 按状态查询投递记录 */
  BY_STATUS: (status: string) => `${API_BASE}/applications?status=${status}`,
} as const