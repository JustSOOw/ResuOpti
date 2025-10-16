/**
 * FileUpload组件单元测试
 * 测试文件上传的各项功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import FileUpload from '@/components/business/FileUpload.vue'
import { mountComponent, flushPromises } from '../utils/test-utils'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'

// Mock Element Plus Message
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn()
    }
  }
})

describe('FileUpload.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染FileUpload组件', async () => {
      const wrapper = await mountComponent(FileUpload)
      expect(wrapper.find('.file-upload').exists()).toBe(true)
    })

    it('应该显示上传区域', async () => {
      const wrapper = await mountComponent(FileUpload)
      expect(wrapper.find('.upload-container').exists()).toBe(true)
    })

    it('应该显示上传图标', async () => {
      const wrapper = await mountComponent(FileUpload)
      expect(wrapper.find('.upload-icon').exists()).toBe(true)
    })

    it('应该显示上传提示文本', async () => {
      const wrapper = await mountComponent(FileUpload)
      expect(wrapper.find('.upload-text').exists()).toBe(true)
    })

    it('应该显示选择文件按钮', async () => {
      const wrapper = await mountComponent(FileUpload)
      expect(wrapper.find('.upload-text button').exists()).toBe(true)
    })
  })

  describe('Props配置', () => {
    it('应该接受accept prop', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { accept: '.pdf' }
      })

      expect(wrapper.props('accept')).toBe('.pdf')
    })

    it('应该接受maxSize prop', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 5 * 1024 * 1024 }
      })

      expect(wrapper.props('maxSize')).toBe(5 * 1024 * 1024)
    })

    it('应该接受multiple prop', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { multiple: true }
      })

      expect(wrapper.props('multiple')).toBe(true)
    })

    it('应该接受autoUpload prop', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { autoUpload: false }
      })

      expect(wrapper.props('autoUpload')).toBe(false)
    })

    it('默认Props应该正确设置', async () => {
      const wrapper = await mountComponent(FileUpload)

      expect(wrapper.props('accept')).toBe('.pdf,.doc,.docx')
      expect(wrapper.props('maxSize')).toBe(10 * 1024 * 1024)
      expect(wrapper.props('multiple')).toBe(false)
      expect(wrapper.props('autoUpload')).toBe(true)
    })
  })

  describe('文件类型验证', () => {
    it('应该接受PDF文件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const result = vm.validateFileType(file)

      expect(result).toBe(true)
    })

    it('应该接受.doc文件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.doc', { type: 'application/msword' })
      const result = vm.validateFileType(file)

      expect(result).toBe(true)
    })

    it('应该接受.docx文件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      const result = vm.validateFileType(file)

      expect(result).toBe(true)
    })

    it('应该拒绝不支持的文件类型', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = vm.validateFileType(file)

      expect(result).toBe(false)
    })

    it('应该拒绝图片文件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const result = vm.validateFileType(file)

      expect(result).toBe(false)
    })
  })

  describe('文件大小验证', () => {
    it('应该接受小于最大限制的文件', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 10 * 1024 * 1024 }
      })
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const result = vm.validateFileSize(file)

      expect(result).toBe(true)
    })

    it('应该拒绝超过最大限制的文件', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 10 * 1024 * 1024 }
      })
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })

      const result = vm.validateFileSize(file)

      expect(result).toBe(false)
    })

    it('应该接受刚好等于最大限制的文件', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 10 * 1024 * 1024 }
      })
      const vm = wrapper.vm as any

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 })

      const result = vm.validateFileSize(file)

      expect(result).toBe(true)
    })
  })

  describe('文件大小格式化', () => {
    it('应该正确格式化字节为B', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(vm.formatFileSize(500)).toBe('500 B')
    })

    it('应该正确格式化字节为KB', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(vm.formatFileSize(1024)).toBe('1.00 KB')
      expect(vm.formatFileSize(2048)).toBe('2.00 KB')
    })

    it('应该正确格式化字节为MB', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(vm.formatFileSize(1024 * 1024)).toBe('1.00 MB')
      expect(vm.formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB')
    })

    it('0字节应该返回"0 B"', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(vm.formatFileSize(0)).toBe('0 B')
    })
  })

  describe('上传前验证', () => {
    it('文件类型无效时应该返回false并显示错误', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = {
        name: 'test.txt',
        type: 'text/plain',
        size: 1000
      } as UploadRawFile

      const result = vm.handleBeforeUpload(file)

      expect(result).toBe(false)
      expect(ElMessage.error).toHaveBeenCalled()
    })

    it('文件大小超限时应该返回false并显示错误', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 1024 }
      })
      const vm = wrapper.vm as any

      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 2048
      } as UploadRawFile

      const result = vm.handleBeforeUpload(file)

      expect(result).toBe(false)
      expect(ElMessage.error).toHaveBeenCalled()
    })

    it('有效文件应该返回true并触发beforeUpload事件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1000
      } as UploadRawFile

      const result = vm.handleBeforeUpload(file)

      expect(result).toBe(true)
      expect(wrapper.emitted('beforeUpload')).toBeTruthy()
    })
  })

  describe('文件选择变化', () => {
    it('文件选择变化时应该触发change事件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = {
        name: 'test.pdf',
        status: 'ready'
      } as UploadFile

      const fileList = [file]

      vm.handleFileChange(file, fileList)

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')?.[0]).toEqual([file, fileList])
    })

    it('文件选择变化应该更新fileList', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = {
        name: 'test.pdf',
        status: 'ready'
      } as UploadFile

      const fileList = [file]

      vm.handleFileChange(file, fileList)

      expect(vm.fileList).toEqual(fileList)
    })
  })

  describe('文件移除', () => {
    it('文件移除时应该触发remove事件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const file = {
        name: 'test.pdf',
        status: 'success'
      } as UploadFile

      vm.handleFileRemove(file)

      expect(wrapper.emitted('remove')).toBeTruthy()
      expect(wrapper.emitted('remove')?.[0]).toEqual([file])
    })

    it('文件移除时应该重置上传进度', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 50

      const file = {
        name: 'test.pdf',
        status: 'success'
      } as UploadFile

      vm.handleFileRemove(file)

      expect(vm.uploadProgress).toBe(0)
    })
  })

  describe('文件超出限制', () => {
    it('文件超出限制时应该显示警告', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.handleExceed()

      expect(ElMessage.warning).toHaveBeenCalled()
    })
  })

  describe('上传成功', () => {
    it('上传成功时应该触发success事件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const response = { success: true, data: {} }
      const file = {
        name: 'test.pdf',
        raw: new File(['content'], 'test.pdf')
      } as UploadFile

      vm.handleSuccess(response, file)

      expect(wrapper.emitted('success')).toBeTruthy()
      expect(wrapper.emitted('success')?.[0]).toEqual([response, file.raw])
    })

    it('上传成功时应该显示成功消息', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const response = { success: true }
      const file = {
        name: 'test.pdf',
        raw: new File(['content'], 'test.pdf')
      } as UploadFile

      vm.handleSuccess(response, file)

      expect(ElMessage.success).toHaveBeenCalled()
    })

    it('上传成功时应该设置进度为100%', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const response = { success: true }
      const file = {
        name: 'test.pdf',
        raw: new File(['content'], 'test.pdf')
      } as UploadFile

      vm.handleSuccess(response, file)

      expect(vm.uploadProgress).toBe(100)
    })
  })

  describe('上传失败', () => {
    it('上传失败时应该触发error事件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const error = new Error('上传失败')

      vm.handleError(error)

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(wrapper.emitted('error')?.[0]).toEqual([error])
    })

    it('上传失败时应该显示错误消息', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const error = new Error('上传失败')

      vm.handleError(error)

      expect(ElMessage.error).toHaveBeenCalled()
    })

    it('上传失败时应该重置进度', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 50

      const error = new Error('上传失败')

      vm.handleError(error)

      expect(vm.uploadProgress).toBe(0)
    })
  })

  describe('上传进度', () => {
    it('上传进度变化时应该更新进度值', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const event = {
        loaded: 5000,
        total: 10000
      }

      vm.handleProgress(event)

      expect(vm.uploadProgress).toBe(50)
    })

    it('上传进度变化时应该触发progress事件', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      const event = {
        loaded: 7500,
        total: 10000
      }

      vm.handleProgress(event)

      expect(wrapper.emitted('progress')).toBeTruthy()
      expect(wrapper.emitted('progress')?.[0]).toEqual([75])
    })

    it('total为0时不应该更新进度', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 0

      const event = {
        loaded: 5000,
        total: 0
      }

      vm.handleProgress(event)

      expect(vm.uploadProgress).toBe(0)
    })
  })

  describe('暴露的方法', () => {
    it('应该暴露submit方法', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(typeof vm.submit).toBe('function')
    })

    it('应该暴露clearFiles方法', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(typeof vm.clearFiles).toBe('function')
    })

    it('clearFiles应该清空文件列表和进度', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.fileList = [{ name: 'test.pdf' }] as any
      vm.uploadProgress = 50

      vm.clearFiles()

      await flushPromises(wrapper)

      expect(vm.fileList.length).toBe(0)
      expect(vm.uploadProgress).toBe(0)
    })

    it('应该暴露abort方法', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(typeof vm.abort).toBe('function')
    })

    it('abort应该重置上传进度', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 50

      vm.abort()

      expect(vm.uploadProgress).toBe(0)
    })
  })

  describe('拖拽状态', () => {
    it('应该初始化为非拖拽状态', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      expect(vm.isDragging).toBe(false)
    })
  })

  describe('接受类型文本', () => {
    it('应该正确格式化accept文本', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { accept: '.pdf,.doc,.docx' }
      })

      const vm = wrapper.vm as any
      expect(vm.acceptText).toBe('.PDF, .DOC, .DOCX')
    })

    it('应该正确格式化单个类型', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { accept: '.pdf' }
      })

      const vm = wrapper.vm as any
      expect(vm.acceptText).toBe('.PDF')
    })
  })

  describe('最大文件大小文本', () => {
    it('应该正确格式化最大文件大小', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 10 * 1024 * 1024 }
      })

      const vm = wrapper.vm as any
      expect(vm.maxSizeText).toBe('10.00 MB')
    })

    it('应该正确格式化KB大小', async () => {
      const wrapper = await mountComponent(FileUpload, {
        props: { maxSize: 500 * 1024 }
      })

      const vm = wrapper.vm as any
      expect(vm.maxSizeText).toBe('500.00 KB')
    })
  })

  describe('进度条显示', () => {
    it('进度为0时不应该显示进度条', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 0
      await flushPromises(wrapper)

      expect(wrapper.find('.progress-section').exists()).toBe(false)
    })

    it('进度在0-100之间时应该显示进度条', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 50
      await flushPromises(wrapper)

      expect(wrapper.find('.progress-section').exists()).toBe(true)
    })

    it('进度为100时不应该显示进度条', async () => {
      const wrapper = await mountComponent(FileUpload)
      const vm = wrapper.vm as any

      vm.uploadProgress = 100
      await flushPromises(wrapper)

      expect(wrapper.find('.progress-section').exists()).toBe(false)
    })
  })
})
