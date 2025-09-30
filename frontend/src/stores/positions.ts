/**
 * 目标岗位状态管理
 * 使用Pinia管理目标岗位相关的状态和操作
 */

import { defineStore } from 'pinia'
import apiClient from '../services/api'

/**
 * 目标岗位接口
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
 * 创建目标岗位DTO接口
 */
export interface CreatePositionDto {
  name: string
  description?: string
}

/**
 * 更新目标岗位DTO接口
 */
export interface UpdatePositionDto {
  name?: string
  description?: string
}

/**
 * 岗位状态接口
 */
export interface PositionsState {
  positions: TargetPosition[]
  currentPosition: TargetPosition | null
  isLoading: boolean
  error: string | null
}

/**
 * 目标岗位Store
 */
export const usePositionsStore = defineStore('positions', {
  /**
   * 状态定义
   */
  state: (): PositionsState => ({
    positions: [],
    currentPosition: null,
    isLoading: false,
    error: null
  }),

  /**
   * 计算属性
   */
  getters: {
    /**
     * 获取岗位总数
     */
    positionCount: (state): number => {
      return state.positions.length
    },

    /**
     * 根据ID查找岗位
     */
    getPositionById: (state) => {
      return (id: string): TargetPosition | undefined => {
        return state.positions.find((position) => position.id === id)
      }
    },

    /**
     * 按创建时间降序排列的岗位列表
     */
    sortedPositions: (state): TargetPosition[] => {
      return [...state.positions].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }
  },

  /**
   * 操作方法
   */
  actions: {
    /**
     * 获取所有目标岗位列表
     */
    async fetchPositions(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.get<{ data: TargetPosition[] }>(
          '/target-positions'
        )
        // API拦截器已经返回了response.data，所以这里直接访问data属性
        this.positions = (response as any).data || []
      } catch (error: any) {
        this.error = error.message || '获取岗位列表失败'
        console.error('获取岗位列表失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 根据ID获取特定岗位详情
     * @param id 岗位ID
     */
    async fetchPositionById(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.get<{ data: TargetPosition }>(
          `/target-positions/${id}`
        )
        // API拦截器已经返回了response.data，所以这里直接访问data属性
        this.currentPosition = (response as any).data
      } catch (error: any) {
        this.error = error.message || '获取岗位详情失败'
        console.error('获取岗位详情失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 创建新目标岗位
     * @param data 岗位创建数据
     */
    async createPosition(data: CreatePositionDto): Promise<TargetPosition> {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.post<{ data: TargetPosition }>(
          '/target-positions',
          data
        )
        // API拦截器已经返回了response.data，所以这里直接访问data属性
        const newPosition = (response as any).data

        // 将新岗位添加到列表中
        this.positions.push(newPosition)

        return newPosition
      } catch (error: any) {
        this.error = error.message || '创建岗位失败'
        console.error('创建岗位失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 更新岗位信息
     * @param id 岗位ID
     * @param data 更新数据
     */
    async updatePosition(
      id: string,
      data: UpdatePositionDto
    ): Promise<TargetPosition> {
      this.isLoading = true
      this.error = null

      try {
        const response = await apiClient.put<{ data: TargetPosition }>(
          `/target-positions/${id}`,
          data
        )
        // API拦截器已经返回了response.data，所以这里直接访问data属性
        const updatedPosition = (response as any).data

        // 更新本地列表中的岗位信息
        const index = this.positions.findIndex((position) => position.id === id)
        if (index !== -1) {
          this.positions[index] = updatedPosition
        }

        // 如果是当前选中的岗位，也更新它
        if (this.currentPosition?.id === id) {
          this.currentPosition = updatedPosition
        }

        return updatedPosition
      } catch (error: any) {
        this.error = error.message || '更新岗位失败'
        console.error('更新岗位失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 删除岗位
     * @param id 岗位ID
     */
    async deletePosition(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        await apiClient.delete(`/target-positions/${id}`)

        // 从本地列表中移除该岗位
        this.positions = this.positions.filter((position) => position.id !== id)

        // 如果删除的是当前选中的岗位，清空当前岗位
        if (this.currentPosition?.id === id) {
          this.currentPosition = null
        }
      } catch (error: any) {
        this.error = error.message || '删除岗位失败'
        console.error('删除岗位失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 设置当前选中的岗位
     * @param position 岗位对象
     */
    setCurrentPosition(position: TargetPosition | null): void {
      this.currentPosition = position
    },

    /**
     * 清除错误信息
     */
    clearError(): void {
      this.error = null
    }
  }
})