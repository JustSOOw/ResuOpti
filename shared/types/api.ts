/**
 * API通用类型定义
 *
 * 定义了API响应格式、错误处理和分页参数
 */

/**
 * 通用API成功响应格式
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
 * 通用API错误响应格式
 */
export interface ApiErrorResponse {
  /** 请求是否成功（始终为false） */
  success: false
  /** 错误消息 */
  message: string
  /** 错误代码 */
  errorCode?: string
  /** 详细错误信息（仅开发环境） */
  details?: unknown
  /** 字段验证错误 */
  validationErrors?: Record<string, string[]>
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page: number
  /** 每页数量 */
  pageSize: number
}

/**
 * 分页响应数据
 * @template T 列表项类型
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  items: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

/**
 * 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  sortBy: string
  /** 排序方向 */
  sortOrder: 'asc' | 'desc'
}