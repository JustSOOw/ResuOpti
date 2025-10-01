<!--
  目标岗位详情页面
  功能：
  1. 显示岗位信息（名称、描述、统计等）
  2. 岗位编辑和删除功能
  3. 显示该岗位下的所有简历版本
  4. 上传简历和创建在线简历
  5. 简历查看、编辑、删除等操作
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePositionsStore } from '@/stores/positions'
import { useResumesStore } from '@/stores/resumes'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Delete, Plus, Upload, Document, Briefcase } from '@element-plus/icons-vue'

// 导入公共组件
import Header from '@/components/common/Header.vue'
import Loading from '@/components/common/Loading.vue'

// 异步导入业务组件（非首屏必需，延迟加载）
import { createAsyncComponent } from '@/utils/asyncComponent'
const ResumeCard = createAsyncComponent(() => import('@/components/business/ResumeCard.vue'), {
  loadingText: '加载简历卡片中...'
})
const PositionForm = createAsyncComponent(() => import('@/components/forms/PositionForm.vue'), {
  loadingText: '加载表单中...'
})

import type { PositionFormData } from '@/components/forms/PositionForm.vue'

// ==================== Router & Stores ====================

/** 路由实例 */
const router = useRouter()

/** 路由参数 */
const route = useRoute()

/** 岗位状态管理 */
const positionsStore = usePositionsStore()

/** 简历状态管理 */
const resumesStore = useResumesStore()

// ==================== 响应式状态 ====================

/** 是否正在加载数据 */
const isLoading = ref(false)

/** 是否显示编辑岗位对话框 */
const showEditDialog = ref(false)

/** 是否显示上传简历对话框 */
const showUploadDialog = ref(false)

/** 是否显示创建在线简历对话框 */
const showCreateOnlineDialog = ref(false)

/** 上传的文件对象 */
const uploadFile = ref<File | null>(null)

/** 上传简历标题 */
const uploadTitle = ref('')

/** 创建在线简历标题 */
const onlineResumeTitle = ref('')

/** 是否正在提交 */
const isSubmitting = ref(false)

/** 岗位是否存在（404错误） */
const positionNotFound = ref(false)

// ==================== 计算属性 ====================

/**
 * 岗位ID（从路由参数获取）
 */
const positionId = computed(() => route.params.id as string)

/**
 * 当前岗位信息
 */
const currentPosition = computed(() => positionsStore.currentPosition)

/**
 * 该岗位下的简历列表
 */
const positionResumes = computed(() => resumesStore.getResumesByPosition(positionId.value))

/**
 * 简历数量统计
 */
const resumeCount = computed(() => positionResumes.value.length)

/**
 * 格式化创建时间
 */
const formattedCreatedAt = computed(() => {
  if (!currentPosition.value) return ''
  return formatDateTime(currentPosition.value.created_at)
})

/**
 * 格式化更新时间
 */
const formattedUpdatedAt = computed(() => {
  if (!currentPosition.value) return ''
  return formatDateTime(currentPosition.value.updated_at)
})

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载时加载数据
 */
onMounted(async () => {
  await loadPageData()
})

// ==================== 方法 ====================

/**
 * 加载页面数据
 */
const loadPageData = async () => {
  isLoading.value = true
  positionNotFound.value = false

  try {
    // 并行加载岗位详情和简历列表
    await Promise.all([
      positionsStore.fetchPositionById(positionId.value),
      resumesStore.fetchResumes(positionId.value)
    ])
  } catch (error: any) {
    console.error('加载页面数据失败:', error)

    // 检查是否为404错误
    if (error.response?.status === 404 || error.message?.includes('未找到')) {
      positionNotFound.value = true
      ElMessage.error('岗位不存在或已被删除')
    } else {
      ElMessage.error(error.message || '加载数据失败，请稍后重试')
    }
  } finally {
    isLoading.value = false
  }
}

/**
 * 格式化日期时间
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期时间字符串
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 返回到仪表板页面
 */
const handleBackToDashboard = () => {
  router.push('/dashboard')
}

/**
 * 打开编辑岗位对话框
 */
const handleOpenEditDialog = () => {
  showEditDialog.value = true
}

/**
 * 处理编辑岗位表单提交
 * @param data 表单数据
 */
const handleEditPosition = async (data: PositionFormData) => {
  isSubmitting.value = true

  try {
    await positionsStore.updatePosition(positionId.value, data)

    ElMessage.success('岗位信息更新成功')
    showEditDialog.value = false
  } catch (error: any) {
    console.error('更新岗位失败:', error)
    ElMessage.error(error.message || '更新岗位失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 取消编辑岗位
 */
const handleCancelEdit = () => {
  showEditDialog.value = false
}

/**
 * 处理删除岗位
 */
const handleDeletePosition = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除岗位"${currentPosition.value?.name}"吗？删除后该岗位下的所有简历也会被删除，此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 用户确认删除
    await positionsStore.deletePosition(positionId.value)

    ElMessage.success('岗位删除成功')

    // 跳转回仪表板
    router.push('/dashboard')
  } catch (error: any) {
    // 用户取消删除或删除失败
    if (error !== 'cancel') {
      console.error('删除岗位失败:', error)
      ElMessage.error(error.message || '删除岗位失败，请重试')
    }
  }
}

/**
 * 打开上传简历对话框
 */
const handleOpenUploadDialog = () => {
  uploadFile.value = null
  uploadTitle.value = ''
  showUploadDialog.value = true
}

/**
 * 处理文件选择
 * @param file 选择的文件
 */
const handleFileSelect = (file: any) => {
  uploadFile.value = file.raw

  // 自动设置简历标题为文件名（去掉扩展名）
  if (file.raw?.name) {
    const fileName = file.raw.name
    const lastDotIndex = fileName.lastIndexOf('.')
    uploadTitle.value = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
  }
}

/**
 * 确认上传简历
 */
const handleConfirmUpload = async () => {
  // 验证
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  if (!uploadTitle.value.trim()) {
    ElMessage.warning('请输入简历标题')
    return
  }

  isSubmitting.value = true

  try {
    await resumesStore.uploadFile(uploadFile.value, positionId.value, uploadTitle.value.trim())

    ElMessage.success('简历上传成功')
    showUploadDialog.value = false

    // 刷新简历列表
    await resumesStore.fetchResumes(positionId.value)
  } catch (error: any) {
    console.error('上传简历失败:', error)
    ElMessage.error(error.message || '上传简历失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 取消上传简历
 */
const handleCancelUpload = () => {
  showUploadDialog.value = false
  uploadFile.value = null
  uploadTitle.value = ''
}

/**
 * 打开创建在线简历对话框
 */
const handleOpenCreateOnlineDialog = () => {
  onlineResumeTitle.value = ''
  showCreateOnlineDialog.value = true
}

/**
 * 确认创建在线简历
 */
const handleConfirmCreateOnline = async () => {
  // 验证
  if (!onlineResumeTitle.value.trim()) {
    ElMessage.warning('请输入简历标题')
    return
  }

  isSubmitting.value = true

  try {
    const newResume = await resumesStore.createResume({
      targetPositionId: positionId.value,
      type: 'online',
      title: onlineResumeTitle.value.trim(),
      content: '' // 创建空内容的在线简历
    })

    ElMessage.success('在线简历创建成功')
    showCreateOnlineDialog.value = false

    // 跳转到编辑器页面
    router.push(`/editor/${newResume.id}`)
  } catch (error: any) {
    console.error('创建在线简历失败:', error)
    ElMessage.error(error.message || '创建在线简历失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 取消创建在线简历
 */
const handleCancelCreateOnline = () => {
  showCreateOnlineDialog.value = false
  onlineResumeTitle.value = ''
}

/**
 * 处理查看简历
 * @param resumeId 简历ID
 */
const handleViewResume = (resumeId: string) => {
  const resume = resumesStore.getResumeById(resumeId)

  if (!resume) {
    ElMessage.error('简历不存在')
    return
  }

  if (resume.type === 'online') {
    // 在线简历跳转到编辑器页面
    router.push(`/editor/${resumeId}`)
  } else {
    // 文件简历下载或预览
    handleDownloadResume(resumeId)
  }
}

/**
 * 处理编辑简历
 * @param resumeId 简历ID
 */
const handleEditResume = (resumeId: string) => {
  const resume = resumesStore.getResumeById(resumeId)

  if (!resume) {
    ElMessage.error('简历不存在')
    return
  }

  if (resume.type === 'online') {
    // 在线简历跳转到编辑器页面
    router.push(`/editor/${resumeId}`)
  } else {
    // 文件简历不支持编辑，只能下载
    ElMessage.warning('文件类型的简历不支持在线编辑，请下载后使用其他软件编辑')
  }
}

/**
 * 处理下载简历
 * @param resumeId 简历ID
 */
const handleDownloadResume = (resumeId: string) => {
  const resume = resumesStore.getResumeById(resumeId)

  if (!resume || resume.type !== 'file') {
    ElMessage.warning('只有文件类型的简历支持下载')
    return
  }

  // TODO: 实现文件下载功能（需要后端提供下载API）
  ElMessage.info('文件下载功能即将推出')
}

/**
 * 处理删除简历
 * @param resumeId 简历ID
 */
const handleDeleteResume = async (resumeId: string) => {
  try {
    await resumesStore.deleteResume(resumeId)

    ElMessage.success('简历删除成功')

    // 刷新简历列表
    await resumesStore.fetchResumes(positionId.value)
  } catch (error: any) {
    console.error('删除简历失败:', error)
    ElMessage.error(error.message || '删除简历失败，请重试')
  }
}
</script>

<template>
  <div class="position-detail-view">
    <!-- 顶部导航栏 -->
    <Header />

    <!-- 加载状态 -->
    <Loading v-if="isLoading" :loading="isLoading" text="正在加载岗位信息..." />

    <!-- 页面内容 -->
    <div v-else class="page-content">
      <!-- 404错误提示 -->
      <div v-if="positionNotFound" class="error-container">
        <el-result icon="error" title="岗位不存在" sub-title="该岗位可能已被删除或您没有访问权限">
          <template #extra>
            <el-button type="primary" @click="handleBackToDashboard">
              <el-icon><ArrowLeft /></el-icon>
              返回仪表板
            </el-button>
          </template>
        </el-result>
      </div>

      <!-- 正常内容 -->
      <div v-else-if="currentPosition" class="content-wrapper">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>目标岗位</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentPosition.name }}</el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 岗位信息卡片 -->
        <el-card class="position-info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon :size="24" class="position-icon">
                  <Briefcase />
                </el-icon>
                <h2 class="position-name">{{ currentPosition.name }}</h2>
              </div>
              <div class="header-actions">
                <el-button type="primary" :icon="Edit" @click="handleOpenEditDialog">
                  编辑岗位
                </el-button>
                <el-button type="danger" :icon="Delete" @click="handleDeletePosition">
                  删除岗位
                </el-button>
                <el-button :icon="ArrowLeft" @click="handleBackToDashboard"> 返回列表 </el-button>
              </div>
            </div>
          </template>

          <!-- 岗位详细信息 -->
          <div class="position-details">
            <!-- 岗位描述 -->
            <div v-if="currentPosition.description" class="detail-item">
              <div class="detail-label">岗位描述：</div>
              <div class="detail-value description">
                {{ currentPosition.description }}
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">简历数量：</span>
                <span class="stat-value">{{ resumeCount }} 个</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">创建时间：</span>
                <span class="stat-value">{{ formattedCreatedAt }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">更新时间：</span>
                <span class="stat-value">{{ formattedUpdatedAt }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 简历列表区域 -->
        <div class="resumes-section">
          <!-- 区域头部 -->
          <div class="section-header">
            <h3 class="section-title">
              <el-icon><Document /></el-icon>
              简历版本列表
              <span class="count-badge">{{ resumeCount }}</span>
            </h3>
            <div class="section-actions">
              <el-button type="primary" :icon="Upload" @click="handleOpenUploadDialog">
                上传简历
              </el-button>
              <el-button type="success" :icon="Plus" @click="handleOpenCreateOnlineDialog">
                创建在线简历
              </el-button>
            </div>
          </div>

          <!-- 简历列表 -->
          <div v-if="positionResumes.length > 0" class="resumes-grid">
            <ResumeCard
              v-for="resume in positionResumes"
              :key="resume.id"
              :resume="resume"
              @view="handleViewResume"
              @edit="handleEditResume"
              @download="handleDownloadResume"
              @delete="handleDeleteResume"
            />
          </div>

          <!-- 空状态 -->
          <el-empty v-else description="暂无简历版本，点击上方按钮创建或上传" :image-size="120">
            <el-button type="primary" @click="handleOpenUploadDialog"> 上传简历 </el-button>
            <el-button type="success" @click="handleOpenCreateOnlineDialog">
              创建在线简历
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 编辑岗位对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑岗位信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <PositionForm
        :initial-data="{
          name: currentPosition?.name || '',
          description: currentPosition?.description || ''
        }"
        @submit="handleEditPosition"
        @cancel="handleCancelEdit"
      />
    </el-dialog>

    <!-- 上传简历对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传简历文件"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="upload-dialog-content">
        <!-- 简历标题 -->
        <el-form-item label="简历标题" required>
          <el-input
            v-model="uploadTitle"
            placeholder="请输入简历标题"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item label="选择文件" required>
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :limit="1"
            accept=".pdf,.doc,.docx"
            :on-change="handleFileSelect"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或<em>点击选择</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式，大小不超过 10MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 已选文件提示 -->
        <div v-if="uploadFile" class="selected-file-info">
          <el-icon><Document /></el-icon>
          <span>{{ uploadFile.name }}</span>
          <span class="file-size"> ({{ (uploadFile.size / 1024 / 1024).toFixed(2) }} MB) </span>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button :disabled="isSubmitting" @click="handleCancelUpload"> 取消 </el-button>
          <el-button type="primary" :loading="isSubmitting" @click="handleConfirmUpload">
            确认上传
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 创建在线简历对话框 -->
    <el-dialog
      v-model="showCreateOnlineDialog"
      title="创建在线简历"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="简历标题" required>
          <el-input
            v-model="onlineResumeTitle"
            placeholder="请输入简历标题"
            maxlength="100"
            show-word-limit
            clearable
            @keyup.enter="handleConfirmCreateOnline"
          />
          <template #extra>
            <span class="form-tip"> 例如：前端工程师简历-V1.0、产品经理简历-通用版 </span>
          </template>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button :disabled="isSubmitting" @click="handleCancelCreateOnline"> 取消 </el-button>
          <el-button type="primary" :loading="isSubmitting" @click="handleConfirmCreateOnline">
            创建并进入编辑
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
/**
 * 页面根容器
 */
.position-detail-view {
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

/**
 * 页面内容容器
 */
.page-content {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/**
 * 错误容器
 */
.error-container {
  padding: 60px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
}

/**
 * 内容包装器
 */
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/**
 * 面包屑导航
 */
.breadcrumb {
  padding: 16px 0;
  font-size: 14px;
}

/**
 * 岗位信息卡片
 */
.position-info-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;

      .position-icon {
        flex-shrink: 0;
        color: var(--el-color-primary);
      }

      .position-name {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  .position-details {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .detail-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-regular);
      }

      .detail-value {
        font-size: 14px;
        color: var(--el-text-color-primary);
        line-height: 1.6;

        &.description {
          padding: 12px;
          background-color: var(--el-fill-color-light);
          border-radius: 4px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      }
    }

    .stats-row {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }
    }
  }
}

/**
 * 简历列表区域
 */
.resumes-section {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .count-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        padding: 0 8px;
        background-color: var(--el-color-primary);
        color: white;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .section-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
  }

  .resumes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }
}

/**
 * 上传对话框内容
 */
.upload-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .upload-area {
    width: 100%;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }

  .selected-file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    font-size: 14px;
    color: var(--el-text-color-primary);

    .el-icon {
      color: var(--el-color-primary);
    }

    .file-size {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}

/**
 * 表单提示
 */
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

/**
 * 对话框底部
 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/**
 * 暗黑主题适配
 */
html.dark {
  .position-info-card {
    .position-details {
      .detail-item {
        .detail-value.description {
          background-color: var(--el-fill-color-darker);
        }
      }
    }
  }

  .upload-dialog-content {
    .selected-file-info {
      background-color: var(--el-fill-color-darker);
    }
  }
}

/**
 * 响应式设计 - 平板
 */
@media (max-width: 1024px) {
  .page-content {
    padding: 16px;
  }

  .resumes-section {
    .resumes-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }
}

/**
 * 响应式设计 - 手机
 */
@media (max-width: 768px) {
  .page-content {
    padding: 12px;
  }

  .position-info-card {
    .card-header {
      flex-direction: column;
      align-items: flex-start;

      .header-left {
        width: 100%;

        .position-name {
          font-size: 20px;
        }
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;

        .el-button {
          flex: 1;
          min-width: 0;
        }
      }
    }

    .position-details {
      .stats-row {
        flex-direction: column;
        gap: 12px;
      }
    }
  }

  .resumes-section {
    .section-header {
      flex-direction: column;
      align-items: flex-start;

      .section-actions {
        width: 100%;

        .el-button {
          flex: 1;
        }
      }
    }

    .resumes-grid {
      grid-template-columns: 1fr;
    }
  }

  .upload-dialog-content {
    .upload-area {
      :deep(.el-upload-dragger) {
        padding: 30px 15px;
      }
    }
  }
}
</style>
