/**
 * 岗位相关类型定义
 *
 * 包含目标岗位实体和DTO
 */

/**
 * 目标岗位实体
 */
export interface TargetPosition {
  /** 岗位分类唯一标识 (UUID) */
  id: string
  /** 所属用户ID (UUID) */
  userId: string
  /**
   * 岗位名称
   * @minLength 1
   * @maxLength 100
   * @example "前端开发"
   */
  name: string
  /**
   * 岗位描述或备注
   * @maxLength 2000
   */
  description?: string | null
  /** 创建时间 (ISO 8601格式) */
  createdAt: string
  /** 最后更新时间 (ISO 8601格式) */
  updatedAt: string
}

/**
 * 创建目标岗位请求
 */
export interface CreateTargetPositionRequest {
  /**
   * 岗位名称
   * @minLength 1
   * @maxLength 100
   */
  name: string
  /**
   * 岗位描述或备注
   * @maxLength 2000
   */
  description?: string
}

/**
 * 更新目标岗位请求
 */
export interface UpdateTargetPositionRequest {
  /**
   * 岗位名称
   * @minLength 1
   * @maxLength 100
   */
  name?: string
  /**
   * 岗位描述或备注
   * @maxLength 2000
   */
  description?: string
}

/**
 * 目标岗位列表项（包含简历数量统计）
 */
export interface TargetPositionWithStats extends TargetPosition {
  /** 该岗位下的简历版本数量 */
  resumeCount?: number
}