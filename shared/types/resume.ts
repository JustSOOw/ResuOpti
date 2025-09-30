/**
 * 简历相关类型定义
 *
 * 包含简历版本、简历元数据、投递记录和相关枚举类型
 */

/**
 * 简历类型枚举
 * - file: 上传文件
 * - online: 在线创建
 */
export type ResumeType = 'file' | 'online'

/**
 * 投递状态枚举
 */
export type ApplicationStatus = '已投递' | '面试邀请' | '已拒绝' | '已录用'

/**
 * 简历版本实体
 */
export interface ResumeVersion {
  /** 简历版本唯一标识 (UUID) */
  id: string
  /** 所属目标岗位ID (UUID) */
  targetPositionId: string
  /** 简历类型：file=上传文件，online=在线创建 */
  type: ResumeType
  /**
   * 简历标题
   * @minLength 1
   * @maxLength 200
   */
  title: string
  /**
   * 文件存储路径（type=file时必填）
   * @maxLength 500
   */
  filePath?: string | null
  /**
   * 原始文件名
   * @maxLength 255
   */
  fileName?: string | null
  /**
   * 文件大小（字节）
   * @maximum 10485760
   * @description 最大10MB
   */
  fileSize?: number | null
  /**
   * 富文本内容（type=online时必填）
   */
  content?: string | null
  /** 创建时间 (ISO 8601格式) */
  createdAt: string
  /** 最后更新时间 (ISO 8601格式) */
  updatedAt: string
}

/**
 * 简历元数据实体
 */
export interface ResumeMetadata {
  /** 元数据唯一标识 (UUID) */
  id: string
  /** 所属简历版本ID (UUID) */
  resumeId: string
  /**
   * 用户备注，支持富文本
   * @maxLength 2000
   */
  notes?: string | null
  /**
   * 自定义标签数组
   * @maxItems 20
   * @description 每个标签最多50字符
   * @example ["技术重点", "XX公司定制"]
   */
  tags: string[]
  /** 创建时间 (ISO 8601格式) */
  createdAt: string
  /** 最后更新时间 (ISO 8601格式) */
  updatedAt: string
}

/**
 * 投递记录实体
 */
export interface ApplicationRecord {
  /** 投递记录唯一标识 (UUID) */
  id: string
  /** 关联的简历版本ID (UUID) */
  resumeId: string
  /**
   * 目标公司名称
   * @minLength 1
   * @maxLength 200
   */
  companyName: string
  /**
   * 具体职位名称
   * @maxLength 200
   */
  positionTitle?: string | null
  /**
   * 投递日期
   * @format date
   * @description 不能为未来日期
   */
  applyDate: string
  /** 当前状态 */
  status: ApplicationStatus
  /**
   * 投递备注，面试反馈等
   * @maxLength 2000
   */
  notes?: string | null
  /** 记录创建时间 (ISO 8601格式) */
  createdAt: string
  /** 最后更新时间 (ISO 8601格式) */
  updatedAt: string
}

/**
 * 创建文件类型简历请求
 */
export interface CreateFileResumeRequest {
  /** 所属目标岗位ID */
  targetPositionId: string
  /**
   * 简历标题
   * @minLength 1
   * @maxLength 200
   */
  title: string
  /** 文件信息（通过FormData上传） */
  file: File
}

/**
 * 创建在线简历请求
 */
export interface CreateOnlineResumeRequest {
  /** 所属目标岗位ID */
  targetPositionId: string
  /**
   * 简历标题
   * @minLength 1
   * @maxLength 200
   */
  title: string
  /** 富文本内容 */
  content: string
}

/**
 * 更新简历版本请求
 */
export interface UpdateResumeVersionRequest {
  /**
   * 简历标题
   * @minLength 1
   * @maxLength 200
   */
  title?: string
  /** 富文本内容（仅online类型可更新） */
  content?: string
}

/**
 * 更新简历元数据请求
 */
export interface UpdateResumeMetadataRequest {
  /**
   * 用户备注
   * @maxLength 2000
   */
  notes?: string
  /**
   * 自定义标签数组
   * @maxItems 20
   */
  tags?: string[]
}

/**
 * 创建投递记录请求
 */
export interface CreateApplicationRecordRequest {
  /** 关联的简历版本ID */
  resumeId: string
  /**
   * 目标公司名称
   * @minLength 1
   * @maxLength 200
   */
  companyName: string
  /**
   * 具体职位名称
   * @maxLength 200
   */
  positionTitle?: string
  /**
   * 投递日期
   * @format date
   */
  applyDate: string
  /** 投递备注 */
  notes?: string
}

/**
 * 更新投递记录请求
 */
export interface UpdateApplicationRecordRequest {
  /**
   * 目标公司名称
   * @minLength 1
   * @maxLength 200
   */
  companyName?: string
  /**
   * 具体职位名称
   * @maxLength 200
   */
  positionTitle?: string
  /**
   * 投递日期
   * @format date
   */
  applyDate?: string
  /** 当前状态 */
  status?: ApplicationStatus
  /**
   * 投递备注
   * @maxLength 2000
   */
  notes?: string
}

/**
 * 简历版本详情（包含元数据）
 */
export interface ResumeVersionWithMetadata extends ResumeVersion {
  /** 简历元数据 */
  metadata?: ResumeMetadata
}

/**
 * 简历版本详情（包含投递记录统计）
 */
export interface ResumeVersionWithStats extends ResumeVersion {
  /** 投递记录数量 */
  applicationCount?: number
  /** 最近投递日期 */
  lastApplyDate?: string | null
}