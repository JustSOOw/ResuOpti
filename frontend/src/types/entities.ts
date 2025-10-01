/**
 * 业务实体类型定义
 * 定义与后端数据模型对应的前端实体类型
 */

import type { ResumeType, ApplicationStatus } from './enums'

/**
 * 用户实体
 */
export interface User {
  /** 用户ID（UUID） */
  id: string
  /** 用户邮箱 */
  email: string
  /** 账户创建时间（ISO 8601格式） */
  createdAt: string
  /** 账户更新时间（ISO 8601格式，可选） */
  updatedAt?: string
}

/**
 * 目标岗位实体
 */
export interface TargetPosition {
  /** 岗位ID（UUID） */
  id: string
  /** 所属用户ID（UUID） */
  userId: string
  /** 岗位名称（1-100字符） */
  name: string
  /** 岗位描述（可选） */
  description: string | null
  /** 创建时间（ISO 8601格式） */
  createdAt: string
  /** 更新时间（ISO 8601格式） */
  updatedAt: string
}

/**
 * 简历版本实体
 */
export interface ResumeVersion {
  /** 简历ID（UUID） */
  id: string
  /** 关联的目标岗位ID（UUID） */
  targetPositionId: string
  /** 简历类型 */
  type: ResumeType
  /** 简历标题（1-200字符） */
  title: string
  /** 文件路径（file类型时必需） */
  filePath?: string
  /** 文件名（file类型时有值） */
  fileName?: string
  /** 文件大小（字节，file类型时有值） */
  fileSize?: number
  /** 在线简历内容（online类型时必需） */
  content?: string
  /** 创建时间（ISO 8601格式） */
  createdAt: string
  /** 更新时间（ISO 8601格式） */
  updatedAt: string
}

/**
 * 简历元数据实体
 */
export interface ResumeMetadata {
  /** 元数据ID（UUID） */
  id: string
  /** 关联的简历ID（UUID） */
  resumeId: string
  /** 备注信息（最多2000字符） */
  notes?: string
  /** 标签数组（最多20个，每个最多50字符） */
  tags?: string[]
  /** 创建时间（ISO 8601格式） */
  createdAt: string
  /** 更新时间（ISO 8601格式） */
  updatedAt: string
}

/**
 * 简历详情（包含元数据）
 */
export interface ResumeDetail extends ResumeVersion {
  /** 简历元数据（可选） */
  metadata?: ResumeMetadata
}

/**
 * 投递记录实体
 */
export interface ApplicationRecord {
  /** 投递记录ID（UUID） */
  id: string
  /** 关联的简历ID（UUID） */
  resumeId: string
  /** 公司名称（1-200字符） */
  companyName: string
  /** 职位名称（可选） */
  positionTitle?: string
  /** 投递日期（YYYY-MM-DD格式） */
  applyDate: string
  /** 投递状态 */
  status: ApplicationStatus
  /** 备注信息（可选） */
  notes?: string
  /** 创建时间（ISO 8601格式） */
  createdAt: string
  /** 更新时间（ISO 8601格式） */
  updatedAt: string
}
