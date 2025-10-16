/**
 * ResumeCard组件单元测试
 * 测试简历卡片展示和操作功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import ResumeCard from '@/components/business/ResumeCard.vue'
import { mountComponent, flushPromises } from '../utils/test-utils'
import type { ResumeVersion, ResumeMetadata } from '@/services/resumes'
import { ElMessageBox } from 'element-plus'

// Mock Element Plus MessageBox
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessageBox: {
      confirm: vi.fn()
    }
  }
})

describe('ResumeCard.vue', () => {
  // 模拟简历数据
  const mockResume: ResumeVersion = {
    id: '1',
    targetPositionId: '1',
    title: '前端开发工程师简历',
    type: 'file',
    fileName: 'resume.pdf',
    filePath: '/uploads/resume.pdf',
    fileSize: 1024000, // 1MB
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  const mockMetadata: ResumeMetadata = {
    id: '1',
    resumeId: '1',
    notes: '这是一份测试简历，包含了前端开发的相关经验和技能',
    tags: ['Vue.js', 'TypeScript', 'React'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染ResumeCard组件', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      expect(wrapper.find('.resume-card').exists()).toBe(true)
    })

    it('应该显示简历标题', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      expect(wrapper.find('.title').text()).toBe(mockResume.title)
    })

    it('应该显示文件类型图标', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      expect(wrapper.find('.type-icon').exists()).toBe(true)
    })

    it('file类型应该显示文件信息', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const infoText = wrapper.text()
      expect(infoText).toContain(mockResume.fileName)
    })

    it('online类型不应该显示文件信息', async () => {
      const onlineResume: ResumeVersion = {
        ...mockResume,
        type: 'online',
        fileName: undefined,
        filePath: undefined,
        fileSize: undefined,
        content: '<p>简历内容</p>'
      }

      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: onlineResume }
      })

      expect(wrapper.find('.info-row').exists()).toBe(false)
    })
  })

  describe('操作按钮', () => {
    it('showActions为true时应该显示操作按钮', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume, showActions: true }
      })

      expect(wrapper.find('.header-actions').exists()).toBe(true)
    })

    it('showActions为false时不应该显示操作按钮', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume, showActions: false }
      })

      expect(wrapper.find('.header-actions').exists()).toBe(false)
    })

    it('应该显示查看按钮', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const viewButton = wrapper.find('button')
      expect(viewButton.text()).toContain('查看')
    })
  })

  describe('文件大小格式化', () => {
    it('应该正确格式化字节为B', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: { ...mockResume, fileSize: 500 }
        }
      })

      const vm = wrapper.vm as any
      expect(vm.formatFileSize(500)).toBe('500 B')
    })

    it('应该正确格式化字节为KB', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      expect(vm.formatFileSize(1024)).toBe('1.00 KB')
    })

    it('应该正确格式化字节为MB', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      expect(vm.formatFileSize(1024 * 1024)).toBe('1.00 MB')
    })

    it('0字节应该返回"0 B"', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      expect(vm.formatFileSize(0)).toBe('0 B')
    })
  })

  describe('日期格式化', () => {
    it('应该正确格式化最近的日期为相对时间', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      const now = new Date()
      const recentDate = new Date(now.getTime() - 5 * 60 * 1000).toISOString() // 5分钟前

      const formatted = vm.formatDate(recentDate)
      expect(formatted).toContain('分钟前')
    })

    it('刚刚创建的应该显示"刚刚"', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      const now = new Date().toISOString()

      const formatted = vm.formatDate(now)
      expect(formatted).toBe('刚刚')
    })

    it('应该正确格式化小时前', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      const now = new Date()
      const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2小时前

      const formatted = vm.formatDate(hoursAgo)
      expect(formatted).toContain('小时前')
    })

    it('应该正确格式化天数前', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      const now = new Date()
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3天前

      const formatted = vm.formatDate(daysAgo)
      expect(formatted).toContain('天前')
    })
  })

  describe('标签显示', () => {
    it('有标签时应该显示标签区域', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: mockResume,
          metadata: mockMetadata
        }
      })

      expect(wrapper.find('.tags-section').exists()).toBe(true)
    })

    it('没有标签时不应该显示标签区域', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: mockResume,
          metadata: { ...mockMetadata, tags: [] }
        }
      })

      expect(wrapper.find('.tags-section').exists()).toBe(false)
    })

    it('应该最多显示3个标签', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: mockResume,
          metadata: mockMetadata
        }
      })

      const vm = wrapper.vm as any
      expect(vm.displayTags.length).toBeLessThanOrEqual(3)
    })

    it('超过3个标签时应该显示剩余数量', async () => {
      const manyTags = {
        ...mockMetadata,
        tags: ['Vue.js', 'React', 'TypeScript', 'Node.js', 'Python']
      }

      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: mockResume,
          metadata: manyTags
        }
      })

      const vm = wrapper.vm as any
      expect(vm.remainingTagsCount).toBe(2) // 5 - 3 = 2
    })
  })

  describe('备注显示', () => {
    it('有备注时应该显示备注区域', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: mockResume,
          metadata: mockMetadata
        }
      })

      expect(wrapper.find('.notes-section').exists()).toBe(true)
    })

    it('没有备注时不应该显示备注区域', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: {
          resume: mockResume,
          metadata: { ...mockMetadata, notes: undefined }
        }
      })

      expect(wrapper.find('.notes-section').exists()).toBe(false)
    })

    it('备注超过50字符应该截断', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      const longText = 'A'.repeat(60)
      const truncated = vm.truncateNotes(longText)

      expect(truncated.length).toBeLessThanOrEqual(53) // 50 + '...'
      expect(truncated).toContain('...')
    })

    it('备注少于50字符不应该截断', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      const shortText = '简短备注'
      const result = vm.truncateNotes(shortText)

      expect(result).toBe(shortText)
      expect(result).not.toContain('...')
    })
  })

  describe('事件触发', () => {
    it('点击查看按钮应该触发view事件', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      vm.handleView()

      expect(wrapper.emitted('view')).toBeTruthy()
      expect(wrapper.emitted('view')?.[0]).toEqual([mockResume.id])
    })

    it('下拉菜单选择编辑应该触发edit事件', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      vm.handleCommand('edit')

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockResume.id])
    })

    it('下拉菜单选择下载应该触发download事件', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      vm.handleCommand('download')

      expect(wrapper.emitted('download')).toBeTruthy()
      expect(wrapper.emitted('download')?.[0]).toEqual([mockResume.id])
    })

    it('确认删除后应该触发delete事件', async () => {
      // Mock确认对话框返回确认
      ;(ElMessageBox.confirm as any).mockResolvedValue(true)

      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      await vm.handleDelete()

      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockResume.id])
    })

    it('取消删除不应该触发delete事件', async () => {
      // Mock确认对话框返回取消
      ;(ElMessageBox.confirm as any).mockRejectedValue(new Error('cancel'))

      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any
      await vm.handleDelete()

      expect(wrapper.emitted('delete')).toBeFalsy()
    })
  })

  describe('标签类型', () => {
    it('应该根据索引返回不同的标签类型', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any

      expect(vm.getTagType(0)).toBe('primary')
      expect(vm.getTagType(1)).toBe('success')
      expect(vm.getTagType(2)).toBe('warning')
      expect(vm.getTagType(3)).toBe('danger')
      expect(vm.getTagType(4)).toBe('info')
    })

    it('索引超过类型数量时应该循环', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const vm = wrapper.vm as any

      // 索引5应该回到primary（5 % 5 = 0）
      expect(vm.getTagType(5)).toBe('primary')
    })
  })

  describe('悬停状态', () => {
    it('鼠标悬停时应该设置悬停状态', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const card = wrapper.find('.resume-card')
      await card.trigger('mouseenter')
      await flushPromises(wrapper)

      const vm = wrapper.vm as any
      expect(vm.isHovering).toBe(true)
    })

    it('鼠标离开时应该取消悬停状态', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      const card = wrapper.find('.resume-card')

      // 先触发悬停
      await card.trigger('mouseenter')
      await flushPromises(wrapper)

      // 再触发离开
      await card.trigger('mouseleave')
      await flushPromises(wrapper)

      const vm = wrapper.vm as any
      expect(vm.isHovering).toBe(false)
    })
  })

  describe('Props测试', () => {
    it('应该接受resume prop', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      expect(wrapper.props('resume')).toEqual(mockResume)
    })

    it('应该接受metadata prop', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume, metadata: mockMetadata }
      })

      expect(wrapper.props('metadata')).toEqual(mockMetadata)
    })

    it('应该接受showActions prop', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume, showActions: false }
      })

      expect(wrapper.props('showActions')).toBe(false)
    })

    it('showActions默认值应该为true', async () => {
      const wrapper = await mountComponent(ResumeCard, {
        props: { resume: mockResume }
      })

      expect(wrapper.props('showActions')).toBe(true)
    })
  })
})
