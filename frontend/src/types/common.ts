/**
 * 通用类型定义
 * 定义跨模块使用的通用工具类型
 */

import type { SortOrder } from './enums'

/**
 * 分页参数
 */
export interface Pagination {
  /** 当前页码（从1开始） */
  page: number
  /** 每页条数 */
  pageSize: number
}

/**
 * 分页响应元信息
 */
export interface PaginationMeta {
  /** 当前页码 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 总条数 */
  total: number
  /** 总页数 */
  totalPages: number
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  items: T[]
  /** 分页元信息 */
  meta: PaginationMeta
}

/**
 * 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  field: string
  /** 排序方向 */
  order: SortOrder
}

/**
 * 日期范围
 */
export interface DateRange {
  /** 开始日期（ISO 8601格式） */
  startDate: string
  /** 结束日期（ISO 8601格式） */
  endDate: string
}

/**
 * 通用筛选参数
 */
export interface FilterParams {
  /** 搜索关键词（可选） */
  keyword?: string
  /** 日期范围（可选） */
  dateRange?: DateRange
  /** 排序参数（可选） */
  sort?: SortParams
}

/**
 * 文件上传进度回调函数类型
 */
export type UploadProgressCallback = (progress: number) => void

/**
 * 通用选项接口（用于下拉选择等）
 */
export interface Option<T = string> {
  /** 显示标签 */
  label: string
  /** 选项值 */
  value: T
  /** 是否禁用 */
  disabled?: boolean
}
