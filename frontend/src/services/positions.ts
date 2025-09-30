/**
 * 目标岗位API服务
 * 提供岗位相关的CRUD操作
 */

import apiClient from './api'

/**
 * 目标岗位实体接口
 */
export interface TargetPosition {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * 创建岗位DTO
 */
export interface CreatePositionDto {
  name: string          // 必需，1-100字符
  description?: string  // 可选
}

/**
 * 更新岗位DTO
 */
export interface UpdatePositionDto {
  name?: string
  description?: string
}

/**
 * API响应泛型接口
 */
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

/**
 * 获取所有目标岗位
 * @returns Promise<TargetPosition[]> 岗位列表
 */
export const getPositions = async (): Promise<TargetPosition[]> => {
  try {
    const response = await apiClient.get<ApiResponse<TargetPosition[]>>('/target-positions')
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '获取岗位列表失败'
    throw new Error(errorMessage)
  }
}

/**
 * 根据ID获取岗位详情
 * @param id - 岗位UUID
 * @returns Promise<TargetPosition> 岗位详情
 */
export const getPositionById = async (id: string): Promise<TargetPosition> => {
  try {
    const response = await apiClient.get<ApiResponse<TargetPosition>>(`/target-positions/${id}`)
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '获取岗位详情失败'
    throw new Error(errorMessage)
  }
}

/**
 * 创建新岗位
 * @param data - 创建岗位数据
 * @returns Promise<TargetPosition> 创建的岗位
 */
export const createPosition = async (data: CreatePositionDto): Promise<TargetPosition> => {
  try {
    const response = await apiClient.post<ApiResponse<TargetPosition>>('/target-positions', data)
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '创建岗位失败'
    throw new Error(errorMessage)
  }
}

/**
 * 更新岗位信息
 * @param id - 岗位UUID
 * @param data - 更新数据
 * @returns Promise<TargetPosition> 更新后的岗位
 */
export const updatePosition = async (id: string, data: UpdatePositionDto): Promise<TargetPosition> => {
  try {
    const response = await apiClient.put<ApiResponse<TargetPosition>>(`/target-positions/${id}`, data)
    return response.data
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '更新岗位失败'
    throw new Error(errorMessage)
  }
}

/**
 * 删除岗位
 * @param id - 岗位UUID
 * @returns Promise<void>
 */
export const deletePosition = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<ApiResponse<null>>(`/target-positions/${id}`)
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '删除岗位失败'
    throw new Error(errorMessage)
  }
}