/**
 * 简历版本状态管理
 * 使用Pinia管理简历版本的增删改查、文件上传等状态
 */

import { defineStore } from 'pinia'
import {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  uploadResumeFile,
  type ResumeVersion,
  type ResumeDetail,
  type CreateResumeDto,
  type UpdateResumeDto,
  type ResumeType
} from '../services/resumes'

// ============ TypeScript接口定义 ============

/**
 * 简历状态管理Store的State接口
 */
export interface ResumesState {
  /** 简历版本列表 */
  resumes: ResumeVersion[]
  /** 当前正在编辑的简历详情 */
  currentResume: ResumeDetail | null
  /** 加载状态 */
  isLoading: boolean
  /** 文件上传进度（0-100） */
  uploadProgress: number
  /** 错误信息 */
  error: string | null
}

// ============ Pinia Store定义 ============

/**
 * 简历版本状态管理Store
 * 提供简历的CRUD操作、文件上传、列表过滤等功能
 */
export const useResumesStore = defineStore('resumes', {
  // ============ State ============
  state: (): ResumesState => ({
    resumes: [],
    currentResume: null,
    isLoading: false,
    uploadProgress: 0,
    error: null
  }),

  // ============ Getters ============
  getters: {
    /**
     * 获取简历总数
     */
    resumeCount: (state): number => {
      return state.resumes.length
    },

    /**
     * 获取文件类型简历列表
     */
    fileResumes: (state): ResumeVersion[] => {
      return state.resumes.filter(resume => resume.type === 'file')
    },

    /**
     * 获取在线创建简历列表
     */
    onlineResumes: (state): ResumeVersion[] => {
      return state.resumes.filter(resume => resume.type === 'online')
    },

    /**
     * 根据ID查找简历
     * @param id 简历ID
     * @returns 简历对象或undefined
     */
    getResumeById: (state) => {
      return (id: string): ResumeVersion | undefined => {
        return state.resumes.find(resume => resume.id === id)
      }
    },

    /**
     * 根据岗位ID过滤简历
     * @param positionId 目标岗位ID
     * @returns 该岗位下的所有简历
     */
    getResumesByPosition: (state) => {
      return (positionId: string): ResumeVersion[] => {
        return state.resumes.filter(resume => resume.targetPositionId === positionId)
      }
    },

    /**
     * 判断是否有错误
     */
    hasError: (state): boolean => {
      return state.error !== null
    },

    /**
     * 判断是否正在上传文件
     */
    isUploading: (state): boolean => {
      return state.uploadProgress > 0 && state.uploadProgress < 100
    }
  },

  // ============ Actions ============
  actions: {
    /**
     * 获取简历列表
     * @param positionId 可选，目标岗位ID，用于筛选
     */
    async fetchResumes(positionId?: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const resumes = await getResumes(positionId)
        this.resumes = resumes
      } catch (error: any) {
        this.error = error.message || '获取简历列表失败'
        console.error('获取简历列表失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 根据ID获取简历详情
     * @param id 简历ID
     */
    async fetchResumeById(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const resume = await getResumeById(id)
        this.currentResume = resume

        // 同时更新列表中的对应项
        const index = this.resumes.findIndex(r => r.id === id)
        if (index !== -1) {
          this.resumes[index] = resume
        }
      } catch (error: any) {
        this.error = error.message || '获取简历详情失败'
        console.error('获取简历详情失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 创建新简历
     * @param data 创建简历数据
     */
    async createResume(data: CreateResumeDto): Promise<ResumeVersion> {
      this.isLoading = true
      this.error = null

      try {
        const newResume = await createResume(data)

        // 添加到列表头部
        this.resumes.unshift(newResume)

        return newResume
      } catch (error: any) {
        this.error = error.message || '创建简历失败'
        console.error('创建简历失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 更新简历
     * @param id 简历ID
     * @param data 更新数据
     */
    async updateResume(id: string, data: UpdateResumeDto): Promise<ResumeVersion> {
      this.isLoading = true
      this.error = null

      try {
        const updatedResume = await updateResume(id, data)

        // 更新列表中的对应项
        const index = this.resumes.findIndex(r => r.id === id)
        if (index !== -1) {
          this.resumes[index] = updatedResume
        }

        // 如果是当前编辑的简历，也更新currentResume
        if (this.currentResume?.id === id) {
          this.currentResume = { ...this.currentResume, ...updatedResume }
        }

        return updatedResume
      } catch (error: any) {
        this.error = error.message || '更新简历失败'
        console.error('更新简历失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 删除简历
     * @param id 简历ID
     */
    async deleteResume(id: string): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        await deleteResume(id)

        // 从列表中移除
        this.resumes = this.resumes.filter(r => r.id !== id)

        // 如果删除的是当前编辑的简历，清空currentResume
        if (this.currentResume?.id === id) {
          this.currentResume = null
        }
      } catch (error: any) {
        this.error = error.message || '删除简历失败'
        console.error('删除简历失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 上传简历文件
     * @param file 文件对象
     * @param positionId 目标岗位ID
     * @param title 简历标题
     */
    async uploadFile(file: File, positionId: string, title: string): Promise<ResumeVersion> {
      this.isLoading = true
      this.error = null
      this.uploadProgress = 0

      try {
        // 调用上传API，并传入进度回调
        const newResume = await uploadResumeFile(
          file,
          positionId,
          title,
          (progress: number) => {
            this.updateUploadProgress(progress)
          }
        )

        // 上传完成后，将新简历添加到列表头部
        this.resumes.unshift(newResume)

        // 重置上传进度
        this.uploadProgress = 100

        return newResume
      } catch (error: any) {
        this.error = error.message || '上传简历文件失败'
        console.error('上传简历文件失败:', error)
        throw error
      } finally {
        this.isLoading = false
        // 延迟重置进度条，让用户看到100%完成状态
        setTimeout(() => {
          this.uploadProgress = 0
        }, 1000)
      }
    },

    /**
     * 设置当前正在编辑的简历
     * @param resume 简历对象或null
     */
    setCurrentResume(resume: ResumeDetail | null): void {
      this.currentResume = resume
    },

    /**
     * 更新文件上传进度
     * @param progress 进度值（0-100）
     */
    updateUploadProgress(progress: number): void {
      this.uploadProgress = Math.min(100, Math.max(0, progress))
    },

    /**
     * 清除错误信息
     */
    clearError(): void {
      this.error = null
    },

    /**
     * 重置整个Store状态
     */
    resetState(): void {
      this.resumes = []
      this.currentResume = null
      this.isLoading = false
      this.uploadProgress = 0
      this.error = null
    },

    /**
     * 根据类型过滤简历（辅助方法）
     * @param type 简历类型
     * @returns 指定类型的简历列表
     */
    getResumesByType(type: ResumeType): ResumeVersion[] {
      return this.resumes.filter(resume => resume.type === type)
    },

    /**
     * 批量删除简历
     * @param ids 简历ID数组
     */
    async deleteMultipleResumes(ids: string[]): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        // 并发删除所有指定的简历
        await Promise.all(ids.map(id => deleteResume(id)))

        // 从列表中移除所有已删除的简历
        this.resumes = this.resumes.filter(r => !ids.includes(r.id))

        // 如果当前编辑的简历被删除，清空currentResume
        if (this.currentResume && ids.includes(this.currentResume.id)) {
          this.currentResume = null
        }
      } catch (error: any) {
        this.error = error.message || '批量删除简历失败'
        console.error('批量删除简历失败:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})

// ============ 类型导出 ============
export type {
  ResumeVersion,
  ResumeDetail,
  CreateResumeDto,
  UpdateResumeDto,
  ResumeType
} from '../services/resumes'