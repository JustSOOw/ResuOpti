<!--
  主仪表板页面
  功能：
  1. 展示所有目标岗位的卡片列表
  2. 提供创建新岗位的入口
  3. 支持查看、编辑和删除岗位
  4. 空状态提示
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, Briefcase } from '@element-plus/icons-vue'

// 导入公共组件
import Header from '@/components/common/Header.vue'
import Loading from '@/components/common/Loading.vue'

// 异步导入业务组件（非首屏必需，延迟加载）
import { createAsyncComponent } from '@/utils/asyncComponent'
const PositionForm = createAsyncComponent(() => import('@/components/forms/PositionForm.vue'), {
  loadingText: '加载表单中...'
})

// 导入Store
import { useAuthStore } from '@/stores/auth'
import { usePositionsStore } from '@/stores/positions'
import type { TargetPosition, CreatePositionDto } from '@/stores/positions'
import type { PositionFormData } from '@/components/forms/PositionForm.vue'

// ==================== Stores & Router ====================

/** 认证Store */
const authStore = useAuthStore()

/** 岗位Store */
const positionsStore = usePositionsStore()

/** 路由实例 */
const router = useRouter()

// ==================== 响应式状态 ====================

/**
 * 创建岗位对话框显示状态
 */
const createDialogVisible = ref(false)

/**
 * 编辑岗位对话框显示状态
 */
const editDialogVisible = ref(false)

/**
 * 当前正在编辑的岗位
 */
const currentEditPosition = ref<TargetPosition | null>(null)

/**
 * 页面初始加载状态
 */
const initialLoading = ref(true)

// ==================== 计算属性 ====================

/**
 * 获取排序后的岗位列表
 */
const sortedPositions = computed(() => positionsStore.sortedPositions)

/**
 * 是否正在加载
 */
const isLoading = computed(() => positionsStore.isLoading)

/**
 * 岗位总数
 */
const positionCount = computed(() => positionsStore.positionCount)

/**
 * 是否为空状态
 */
const isEmpty = computed(() => !isLoading.value && positionCount.value === 0)

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载时初始化
 */
onMounted(async () => {
  // 检查认证状态
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 加载岗位列表
  await loadPositions()
  initialLoading.value = false
})

// ==================== 方法 ====================

/**
 * 加载岗位列表
 */
const loadPositions = async (): Promise<void> => {
  try {
    await positionsStore.fetchPositions()
  } catch (error: any) {
    ElMessage.error(error.message || '加载岗位列表失败')
  }
}

/**
 * 打开创建岗位对话框
 */
const handleOpenCreateDialog = (): void => {
  currentEditPosition.value = null
  createDialogVisible.value = true
}

/**
 * 关闭创建岗位对话框
 */
const handleCloseCreateDialog = (): void => {
  createDialogVisible.value = false
}

/**
 * 处理创建岗位
 */
const handleCreatePosition = async (formData: PositionFormData): Promise<void> => {
  try {
    const createData: CreatePositionDto = {
      name: formData.name,
      description: formData.description
    }

    await positionsStore.createPosition(createData)

    ElMessage.success('创建岗位成功')

    // 关闭对话框
    handleCloseCreateDialog()

    // 刷新列表
    await loadPositions()
  } catch (error: any) {
    ElMessage.error(error.message || '创建岗位失败')
  }
}

/**
 * 打开编辑岗位对话框
 */
const handleOpenEditDialog = (position: TargetPosition): void => {
  currentEditPosition.value = position
  editDialogVisible.value = true
}

/**
 * 关闭编辑岗位对话框
 */
const handleCloseEditDialog = (): void => {
  editDialogVisible.value = false
  currentEditPosition.value = null
}

/**
 * 处理编辑岗位
 */
const handleEditPosition = async (formData: PositionFormData): Promise<void> => {
  if (!currentEditPosition.value) return

  try {
    await positionsStore.updatePosition(currentEditPosition.value.id, {
      name: formData.name,
      description: formData.description
    })

    ElMessage.success('更新岗位成功')

    // 关闭对话框
    handleCloseEditDialog()

    // 刷新列表
    await loadPositions()
  } catch (error: any) {
    ElMessage.error(error.message || '更新岗位失败')
  }
}

/**
 * 查看岗位详情
 */
const handleViewPosition = (positionId: string): void => {
  router.push(`/positions/${positionId}`)
}

/**
 * 删除岗位（需要确认）
 */
const handleDeletePosition = async (position: TargetPosition): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要删除岗位"${position.name}"吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 用户确认删除
    await positionsStore.deletePosition(position.id)

    ElMessage.success('删除岗位成功')

    // 刷新列表
    await loadPositions()
  } catch (error: any) {
    // 用户取消删除或删除失败
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除岗位失败')
    }
  }
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else if (days < 30) {
    return `${Math.floor(days / 7)}周前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * 获取编辑表单的初始数据
 */
const getEditFormData = computed((): PositionFormData | null => {
  if (!currentEditPosition.value) return null

  return {
    name: currentEditPosition.value.name,
    description: currentEditPosition.value.description || undefined
  }
})
</script>

<template>
  <div class="dashboard-view">
    <!-- 顶部导航栏 -->
    <Header />

    <!-- 主内容区域 -->
    <div class="dashboard-main">
      <div class="dashboard-container">
        <!-- 页面头部 -->
        <div class="dashboard-header">
          <div class="header-title">
            <h1 class="title">我的目标岗位</h1>
            <p class="subtitle">管理您的求职目标岗位和简历版本</p>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" size="large" @click="handleOpenCreateDialog">
              创建新岗位
            </el-button>
          </div>
        </div>

        <!-- 加载状态 -->
        <Loading :loading="initialLoading" :fullscreen="false" text="加载岗位列表中..." />

        <!-- 岗位列表 -->
        <div v-if="!initialLoading" class="positions-content">
          <!-- 空状态 -->
          <div v-if="isEmpty" class="empty-state">
            <el-empty description="暂无目标岗位">
              <template #image>
                <el-icon :size="100" color="var(--el-color-info)">
                  <Briefcase />
                </el-icon>
              </template>
              <template #description>
                <p class="empty-text">暂无目标岗位</p>
                <p class="empty-hint">点击上方按钮创建第一个岗位</p>
              </template>
              <el-button type="primary" :icon="Plus" @click="handleOpenCreateDialog">
                创建第一个岗位
              </el-button>
            </el-empty>
          </div>

          <!-- 岗位卡片网格 -->
          <el-row v-else :gutter="20" class="positions-grid">
            <el-col
              v-for="position in sortedPositions"
              :key="position.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="8"
              :xl="6"
            >
              <el-card class="position-card" shadow="hover" @click="handleViewPosition(position.id)">
                <!-- 卡片头部 -->
                <template #header>
                  <div class="card-header">
                    <div class="position-name">
                      <el-icon class="position-icon"><Briefcase /></el-icon>
                      <span class="name-text">{{ position.name }}</span>
                    </div>
                  </div>
                </template>

                <!-- 卡片内容 -->
                <div class="card-body">
                  <!-- 岗位描述 -->
                  <div v-if="position.description" class="position-description">
                    {{ position.description }}
                  </div>
                  <div v-else class="position-description empty">暂无描述</div>

                  <!-- 统计信息 -->
                  <div class="position-stats">
                    <div class="stat-item">
                      <span class="stat-label">简历版本：</span>
                      <span class="stat-value">0个</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">创建时间：</span>
                      <span class="stat-value">{{ formatDate(position.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 卡片操作按钮 -->
                <template #footer>
                  <div class="card-actions" @click.stop>
                    <el-button
                      type="primary"
                      :icon="View"
                      size="small"
                      @click="handleViewPosition(position.id)"
                    >
                      查看详情
                    </el-button>
                    <el-button :icon="Edit" size="small" @click="handleOpenEditDialog(position)">
                      编辑
                    </el-button>
                    <el-button
                      type="danger"
                      :icon="Delete"
                      size="small"
                      plain
                      @click="handleDeletePosition(position)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 创建岗位对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建新岗位"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCloseCreateDialog"
    >
      <PositionForm @submit="handleCreatePosition" @cancel="handleCloseCreateDialog" />
    </el-dialog>

    <!-- 编辑岗位对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑岗位"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCloseEditDialog"
    >
      <PositionForm
        :initial-data="getEditFormData"
        @submit="handleEditPosition"
        @cancel="handleCloseEditDialog"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
/**
 * 仪表板视图容器
 */
.dashboard-view {
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

/**
 * 主内容区域
 */
.dashboard-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/**
 * 内容容器 - 限制最大宽度并居中
 */
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 400px;
}

/**
 * 页面头部
 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  gap: 20px;
}

.header-title {
  flex: 1;

  .title {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  .subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.header-actions {
  display: flex;
  gap: 12px;
}

/**
 * 岗位内容区域
 */
.positions-content {
  min-height: 400px;
}

/**
 * 空状态
 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;

  .empty-text {
    font-size: 18px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin: 16px 0 8px 0;
  }

  .empty-hint {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0 0 24px 0;
  }
}

/**
 * 岗位卡片网格
 */
.positions-grid {
  margin-bottom: 24px;

  .el-col {
    margin-bottom: 20px;
  }
}

/**
 * 岗位卡片样式
 */
.position-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--el-box-shadow-light);
  }

  /**
   * 卡片头部
   */
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-blank);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .position-name {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow: hidden;

    .position-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      flex-shrink: 0;
    }

    .name-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /**
   * 卡片内容
   */
  :deep(.el-card__body) {
    padding: 20px;
    flex: 1;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .position-description {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
    min-height: 44px;
    max-height: 66px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;

    &.empty {
      color: var(--el-text-color-placeholder);
      font-style: italic;
    }
  }

  .position-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;

      .stat-label {
        color: var(--el-text-color-secondary);
      }

      .stat-value {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }

  /**
   * 卡片底部操作区
   */
  :deep(.el-card__footer) {
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-blank);
  }

  .card-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .el-button {
      flex: 1;
      min-width: 80px;
    }
  }
}

/**
 * 响应式设计 - 平板
 */
@media (max-width: 992px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;

    .el-button {
      flex: 1;
    }
  }
}

/**
 * 响应式设计 - 手机
 */
@media (max-width: 768px) {
  .dashboard-main {
    padding: 16px;
  }

  .dashboard-header {
    margin-bottom: 24px;

    .title {
      font-size: 24px;
    }

    .subtitle {
      font-size: 13px;
    }
  }

  .positions-grid {
    .el-col {
      margin-bottom: 16px;
    }
  }

  .position-card {
    .card-actions {
      flex-direction: column;

      .el-button {
        width: 100%;
      }
    }
  }
}

/**
 * 响应式设计 - 小手机
 */
@media (max-width: 480px) {
  .dashboard-main {
    padding: 12px;
  }

  .dashboard-header {
    margin-bottom: 20px;

    .title {
      font-size: 22px;
    }
  }

  :deep(.el-dialog) {
    width: 95% !important;
    margin: 20px auto;
  }
}

/**
 * 暗黑主题适配
 */
html.dark {
  .dashboard-view {
    background-color: var(--el-bg-color-page);
  }

  .position-card {
    background-color: var(--el-bg-color);

    &:hover {
      box-shadow: var(--el-box-shadow);
    }

    :deep(.el-card__header),
    :deep(.el-card__footer) {
      background-color: var(--el-fill-color);
      border-color: var(--el-border-color);
    }
  }
}
</style>
