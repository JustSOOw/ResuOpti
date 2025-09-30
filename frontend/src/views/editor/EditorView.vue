<!--
  Tiptap富文本编辑器页面
  用于创建和编辑在线简历内容
-->

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Edit,
  Download,
  Close,
  Check,
  ArrowLeft,
  RefreshLeft
} from '@element-plus/icons-vue'
import Header from '@/components/common/Header.vue'
import Loading from '@/components/common/Loading.vue'
import { useResumesStore } from '@/stores/resumes'
import type { ResumeDetail } from '@/services/resumes'

// ==================== 路由和Store ====================

const router = useRouter()
const route = useRoute()
const resumesStore = useResumesStore()

// ==================== 响应式状态 ====================

/** 简历ID（从路由参数获取） */
const resumeId = computed(() => route.params.id as string)

/** 当前简历详情 */
const resume = ref<ResumeDetail | null>(null)

/** 页面加载状态 */
const isLoading = ref(true)

/** 保存加载状态 */
const isSaving = ref(false)

/** 是否有未保存的修改 */
const hasUnsavedChanges = ref(false)

/** 最后保存时间 */
const lastSavedTime = ref<Date | null>(null)

/** 自动保存定时器 */
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// ==================== Tiptap编辑器配置 ====================

/**
 * Tiptap编辑器实例
 */
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: {
        depth: 100 // 撤销/重做历史记录深度
      }
    })
  ],
  content: '<p>开始编写你的简历...</p>',
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none'
    }
  },
  onUpdate: () => {
    // 内容发生变化时标记为未保存
    hasUnsavedChanges.value = true
  }
})

// ==================== 计算属性 ====================

/**
 * 格式化最后保存时间
 */
const lastSavedTimeText = computed(() => {
  if (!lastSavedTime.value) return '未保存'

  const now = new Date()
  const diff = now.getTime() - lastSavedTime.value.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 10) return '刚刚保存'
  if (seconds < 60) return `${seconds}秒前保存`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前保存`

  return lastSavedTime.value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

/**
 * 是否可以撤销
 */
const canUndo = computed(() => editor.value?.can().undo() ?? false)

/**
 * 是否可以重做
 */
const canRedo = computed(() => editor.value?.can().redo() ?? false)

// ==================== 生命周期 ====================

/**
 * 组件挂载时加载简历数据
 */
onMounted(async () => {
  await loadResume()

  // 启动自动保存（每30秒）
  startAutoSave()

  // 监听浏览器关闭/刷新事件
  window.addEventListener('beforeunload', handleBeforeUnload)
})

/**
 * 组件卸载前清理
 */
onBeforeUnmount(() => {
  // 清除自动保存定时器
  stopAutoSave()

  // 销毁编辑器实例
  editor.value?.destroy()

  // 移除事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// ==================== 数据加载 ====================

/**
 * 加载简历数据
 */
const loadResume = async () => {
  isLoading.value = true

  try {
    // 从store获取简历详情
    await resumesStore.fetchResumeById(resumeId.value)
    resume.value = resumesStore.currentResume

    if (!resume.value) {
      ElMessage.error('简历不存在')
      router.push('/dashboard')
      return
    }

    // 检查是否为online类型
    if (resume.value.type !== 'online') {
      ElMessage.error('只能编辑在线创建的简历')
      router.back()
      return
    }

    // 设置编辑器内容
    if (resume.value.content) {
      editor.value?.commands.setContent(resume.value.content)
    } else {
      editor.value?.commands.setContent('<p>开始编写你的简历...</p>')
    }

    // 重置未保存状态
    hasUnsavedChanges.value = false

  } catch (error: any) {
    console.error('加载简历失败:', error)
    ElMessage.error(error.message || '加载简历失败')
    router.push('/dashboard')
  } finally {
    isLoading.value = false
  }
}

// ==================== 保存功能 ====================

/**
 * 保存简历内容
 */
const saveResume = async () => {
  if (!editor.value || !resume.value) return

  isSaving.value = true

  try {
    // 获取编辑器HTML内容
    const content = editor.value.getHTML()

    // 调用store更新简历
    await resumesStore.updateResume(resumeId.value, {
      content
    })

    // 更新状态
    hasUnsavedChanges.value = false
    lastSavedTime.value = new Date()

    ElMessage.success('保存成功')

  } catch (error: any) {
    console.error('保存简历失败:', error)
    ElMessage.error(error.message || '保存简历失败')
  } finally {
    isSaving.value = false
  }
}

/**
 * 启动自动保存
 */
const startAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges.value) {
      saveResume()
    }
  }, 30000) // 30秒
}

/**
 * 停止自动保存
 */
const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

/**
 * 处理浏览器关闭/刷新前的警告
 */
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = '你有未保存的修改，确定要离开吗？'
  }
}

// ==================== 编辑器操作 ====================

/**
 * 撤销
 */
const undo = () => {
  editor.value?.chain().focus().undo().run()
}

/**
 * 重做
 */
const redo = () => {
  editor.value?.chain().focus().redo().run()
}

/**
 * 设置标题级别
 */
const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

/**
 * 设置段落
 */
const setParagraph = () => {
  editor.value?.chain().focus().setParagraph().run()
}

/**
 * 切换粗体
 */
const toggleBold = () => {
  editor.value?.chain().focus().toggleBold().run()
}

/**
 * 切换斜体
 */
const toggleItalic = () => {
  editor.value?.chain().focus().toggleItalic().run()
}

/**
 * 切换删除线
 */
const toggleStrike = () => {
  editor.value?.chain().focus().toggleStrike().run()
}

/**
 * 切换无序列表
 */
const toggleBulletList = () => {
  editor.value?.chain().focus().toggleBulletList().run()
}

/**
 * 切换有序列表
 */
const toggleOrderedList = () => {
  editor.value?.chain().focus().toggleOrderedList().run()
}

/**
 * 切换引用块
 */
const toggleBlockquote = () => {
  editor.value?.chain().focus().toggleBlockquote().run()
}

/**
 * 插入水平线
 */
const setHorizontalRule = () => {
  editor.value?.chain().focus().setHorizontalRule().run()
}

/**
 * 清除格式
 */
const clearFormat = () => {
  editor.value?.chain().focus().clearNodes().unsetAllMarks().run()
}

// ==================== 导航操作 ====================

/**
 * 返回上一页
 */
const goBack = async () => {
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm(
        '你有未保存的修改，确定要离开吗？',
        '提示',
        {
          confirmButtonText: '保存并离开',
          cancelButtonText: '放弃修改',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      )

      // 用户选择保存
      await saveResume()
      router.back()

    } catch (action) {
      if (action === 'cancel') {
        // 用户选择放弃修改
        router.back()
      }
      // 用户点击关闭或ESC，不执行任何操作
    }
  } else {
    router.back()
  }
}

/**
 * 导出PDF
 * 将当前简历内容导出为PDF文件
 */
const exportPDF = async () => {
  if (!editor.value || !resume.value) return

  try {
    // 显示加载提示
    const loadingMessage = ElMessage({
      message: '正在生成PDF，请稍候...',
      type: 'info',
      duration: 0, // 不自动关闭
      showClose: false
    })

    // 动态导入html2pdf库（代码分割）
    const html2pdf = (await import('html2pdf.js')).default

    // 获取编辑器HTML内容
    const content = editor.value.getHTML()

    // 创建一个临时容器用于PDF生成
    const tempContainer = document.createElement('div')
    tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 800px;
      padding: 48px;
      background: white;
      font-family: 'Helvetica Neue', Arial, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #333;
    `
    tempContainer.innerHTML = content
    document.body.appendChild(tempContainer)

    // PDF配置选项
    const opt = {
      margin: [15, 15, 15, 15], // 上右下左边距（mm）
      filename: `${resume.value.title || '简历'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, // 提高清晰度
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' // 纵向
      }
    }

    // 生成PDF
    await html2pdf().set(opt).from(tempContainer).save()

    // 移除临时容器
    document.body.removeChild(tempContainer)

    // 关闭加载提示
    loadingMessage.close()

    // 显示成功消息
    ElMessage.success('PDF导出成功')

  } catch (error: any) {
    console.error('导出PDF失败:', error)
    ElMessage.error(error.message || '导出PDF失败，请稍后重试')
  }
}
</script>

<template>
  <div class="editor-view">
    <!-- 页面头部 -->
    <Header />

    <!-- 加载状态 -->
    <Loading v-if="isLoading" />

    <!-- 编辑器主体 -->
    <div v-else class="editor-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 左侧：返回按钮和标题 -->
        <div class="toolbar-left">
          <el-button
            :icon="ArrowLeft"
            circle
            @click="goBack"
            title="返回"
          />

          <div class="resume-info">
            <h2 class="resume-title">
              <el-icon><Document /></el-icon>
              {{ resume?.title || '未命名简历' }}
            </h2>
            <span class="save-status" :class="{ 'has-changes': hasUnsavedChanges }">
              <el-icon v-if="isSaving"><Loading /></el-icon>
              <el-icon v-else-if="hasUnsavedChanges"><Edit /></el-icon>
              <el-icon v-else><Check /></el-icon>
              {{ isSaving ? '保存中...' : lastSavedTimeText }}
            </span>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="toolbar-right">
          <el-button
            type="primary"
            :icon="Check"
            :loading="isSaving"
            @click="saveResume"
          >
            保存
          </el-button>

          <el-button
            :icon="Download"
            @click="exportPDF"
          >
            导出PDF
          </el-button>
        </div>
      </div>

      <!-- 编辑器工具栏 -->
      <div class="editor-toolbar" v-if="editor">
        <!-- 撤销/重做 -->
        <div class="toolbar-group">
          <el-button
            size="small"
            :icon="RefreshLeft"
            :disabled="!canUndo"
            @click="undo"
            title="撤销"
          />
          <el-button
            size="small"
            :icon="RefreshLeft"
            :disabled="!canRedo"
            @click="redo"
            title="重做"
            class="redo-icon"
          />
        </div>

        <!-- 标题级别 -->
        <div class="toolbar-group">
          <el-button
            size="small"
            :type="editor.isActive('paragraph') ? 'primary' : ''"
            @click="setParagraph"
          >
            正文
          </el-button>
          <el-button
            size="small"
            :type="editor.isActive('heading', { level: 1 }) ? 'primary' : ''"
            @click="setHeading(1)"
          >
            H1
          </el-button>
          <el-button
            size="small"
            :type="editor.isActive('heading', { level: 2 }) ? 'primary' : ''"
            @click="setHeading(2)"
          >
            H2
          </el-button>
          <el-button
            size="small"
            :type="editor.isActive('heading', { level: 3 }) ? 'primary' : ''"
            @click="setHeading(3)"
          >
            H3
          </el-button>
        </div>

        <!-- 文本格式 -->
        <div class="toolbar-group">
          <el-button
            size="small"
            :type="editor.isActive('bold') ? 'primary' : ''"
            @click="toggleBold"
          >
            <strong>B</strong>
          </el-button>
          <el-button
            size="small"
            :type="editor.isActive('italic') ? 'primary' : ''"
            @click="toggleItalic"
          >
            <em>I</em>
          </el-button>
          <el-button
            size="small"
            :type="editor.isActive('strike') ? 'primary' : ''"
            @click="toggleStrike"
          >
            <s>S</s>
          </el-button>
        </div>

        <!-- 列表 -->
        <div class="toolbar-group">
          <el-button
            size="small"
            :type="editor.isActive('bulletList') ? 'primary' : ''"
            @click="toggleBulletList"
            title="无序列表"
          >
            •
          </el-button>
          <el-button
            size="small"
            :type="editor.isActive('orderedList') ? 'primary' : ''"
            @click="toggleOrderedList"
            title="有序列表"
          >
            1.
          </el-button>
        </div>

        <!-- 其他格式 -->
        <div class="toolbar-group">
          <el-button
            size="small"
            :type="editor.isActive('blockquote') ? 'primary' : ''"
            @click="toggleBlockquote"
            title="引用"
          >
            "
          </el-button>
          <el-button
            size="small"
            @click="setHorizontalRule"
            title="水平线"
          >
            —
          </el-button>
        </div>

        <!-- 清除格式 -->
        <div class="toolbar-group">
          <el-button
            size="small"
            :icon="Close"
            @click="clearFormat"
            title="清除格式"
          >
            清除
          </el-button>
        </div>
      </div>

      <!-- 编辑器内容区域 -->
      <div class="editor-content-wrapper">
        <EditorContent :editor="editor" class="editor-content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/**
 * 编辑器视图容器
 */
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--el-bg-color-page);
}

/**
 * 编辑器主容器
 */
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/**
 * 顶部工具栏
 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/**
 * 简历信息
 */
.resume-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.resume-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.save-status.has-changes {
  color: var(--el-color-warning);
}

/**
 * 编辑器工具栏
 */
.editor-toolbar {
  display: flex;
  gap: 12px;
  padding: 12px 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  overflow-x: auto;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  padding-right: 12px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.toolbar-group:last-child {
  border-right: none;
}

.redo-icon {
  transform: scaleX(-1);
}

/**
 * 编辑器内容包装器
 */
.editor-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--el-fill-color-lighter);
}

/**
 * 编辑器内容区域
 */
.editor-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  min-height: calc(100vh - 240px);
}

/**
 * Tiptap编辑器样式
 */
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 500px;
}

.editor-content :deep(.ProseMirror p) {
  margin: 1em 0;
  line-height: 1.8;
}

.editor-content :deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 1.5em 0 0.5em;
}

.editor-content :deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 1.2em 0 0.5em;
}

.editor-content :deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: bold;
  margin: 1em 0 0.5em;
}

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: 2em;
  margin: 1em 0;
}

.editor-content :deep(.ProseMirror li) {
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--el-color-primary);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.editor-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid var(--el-border-color);
  margin: 2em 0;
}

.editor-content :deep(.ProseMirror strong) {
  font-weight: bold;
}

.editor-content :deep(.ProseMirror em) {
  font-style: italic;
}

.editor-content :deep(.ProseMirror s) {
  text-decoration: line-through;
}

/**
 * 响应式设计
 */
@media screen and (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .toolbar-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-right {
    width: 100%;
  }

  .toolbar-right .el-button {
    flex: 1;
  }

  .editor-toolbar {
    padding: 8px 12px;
    gap: 8px;
  }

  .toolbar-group {
    gap: 2px;
    padding-right: 8px;
  }

  .editor-content-wrapper {
    padding: 12px;
  }

  .editor-content {
    padding: 24px;
  }

  .resume-title {
    font-size: 16px;
  }
}

@media screen and (max-width: 480px) {
  .editor-content {
    padding: 16px;
  }

  .toolbar-group .el-button {
    padding: 4px 8px;
  }
}

/**
 * 暗黑主题适配
 */
@media (prefers-color-scheme: dark) {
  .editor-content-wrapper {
    background-color: var(--el-bg-color);
  }
}

.dark .editor-content-wrapper {
  background-color: var(--el-bg-color);
}
</style>