<!--
  通用侧边栏导航组件
  功能：
  1. 显示主要导航菜单
  2. 支持折叠/展开
  3. 高亮当前路由
  4. 响应式布局
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Odometer, Document, FolderOpened, Fold, Expand } from '@element-plus/icons-vue'

/**
 * Props定义
 */
interface SidebarProps {
  /** 是否默认折叠 */
  defaultCollapsed?: boolean
  /** 侧边栏宽度（展开时） */
  width?: string
  /** 侧边栏宽度（折叠时） */
  collapsedWidth?: string
}

const props = withDefaults(defineProps<SidebarProps>(), {
  defaultCollapsed: false,
  width: '240px',
  collapsedWidth: '64px'
})

/**
 * Emits定义
 */
interface SidebarEmits {
  (e: 'collapse-change', collapsed: boolean): void
}

const emit = defineEmits<SidebarEmits>()

// ==================== 路由 ====================

/** 当前路由 */
const route = useRoute()

/** 路由实例 */
const router = useRouter()

// ==================== 状态 ====================

/**
 * 是否折叠侧边栏
 */
const isCollapsed = ref<boolean>(props.defaultCollapsed)

// ==================== 计算属性 ====================

/**
 * 当前激活的菜单项
 * 基于当前路由路径
 */
const activeMenu = computed(() => {
  const path = route.path
  // 匹配第一级路由路径
  if (path.startsWith('/dashboard')) return '/dashboard'
  if (path.startsWith('/positions')) return '/positions'
  if (path.startsWith('/resumes')) return '/resumes'
  return path
})

/**
 * 侧边栏实际宽度
 */
const sidebarWidth = computed(() => (isCollapsed.value ? props.collapsedWidth : props.width))

// ==================== 菜单配置 ====================

/**
 * 菜单项接口定义
 */
interface MenuItem {
  /** 菜单唯一标识（路由路径） */
  id: string
  /** 菜单显示文本 */
  title: string
  /** 菜单图标组件 */
  icon: any
  /** 路由路径 */
  path: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 菜单配置列表
 */
const menuItems: MenuItem[] = [
  {
    id: '/dashboard',
    title: '仪表板',
    icon: Odometer,
    path: '/dashboard'
  },
  {
    id: '/positions',
    title: '目标岗位',
    icon: FolderOpened,
    path: '/positions'
  },
  {
    id: '/resumes',
    title: '我的简历',
    icon: Document,
    path: '/resumes'
  }
]

// ==================== 方法 ====================

/**
 * 切换折叠状态
 */
const toggleCollapse = (): void => {
  isCollapsed.value = !isCollapsed.value
  emit('collapse-change', isCollapsed.value)
}

/**
 * 处理菜单项点击
 * @param item - 点击的菜单项
 */
const handleMenuSelect = (item: MenuItem): void => {
  if (item.disabled) return

  // 使用vue-router进行导航
  router.push(item.path)
}
</script>

<template>
  <el-aside class="app-sidebar" :width="sidebarWidth">
    <div class="sidebar-content">
      <!-- 菜单区域 -->
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapsed"
        :collapse-transition="true"
      >
        <!-- 遍历菜单项 -->
        <el-menu-item
          v-for="item in menuItems"
          :key="item.id"
          :index="item.id"
          :disabled="item.disabled"
          @click="handleMenuSelect(item)"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>
            <span>{{ item.title }}</span>
          </template>
        </el-menu-item>
      </el-menu>

      <!-- 折叠/展开按钮 -->
      <div class="sidebar-footer">
        <el-button
          class="collapse-btn"
          :icon="isCollapsed ? Expand : Fold"
          text
          @click="toggleCollapse"
        >
          <span v-if="!isCollapsed">折叠菜单</span>
        </el-button>
      </div>
    </div>
  </el-aside>
</template>

<style scoped>
/**
 * 侧边栏容器
 */
.app-sidebar {
  height: 100%;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s ease;
  overflow: hidden;
}

/**
 * 侧边栏内容容器
 */
.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/**
 * 菜单容器
 */
.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  overflow-x: hidden;
}

/**
 * 自定义滚动条样式
 */
.sidebar-menu::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color);
  border-radius: 3px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background-color: transparent;
}

/**
 * 菜单项图标样式
 */
.sidebar-menu :deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
  transition: all 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.sidebar-menu :deep(.el-menu-item:hover .el-icon) {
  transform: scale(1.1);
}

/**
 * 激活菜单项样式
 */
.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

/**
 * 暗黑主题下的激活样式
 */
.dark .sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: var(--el-color-primary-dark-2);
}

/**
 * 侧边栏底部区域
 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

/**
 * 折叠/展开按钮
 */
.collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
}

/**
 * 折叠状态样式调整
 */
.app-sidebar :deep(.el-menu--collapse) {
  width: 100%;
}

.app-sidebar :deep(.el-menu--collapse .el-menu-item) {
  padding: 0;
  text-align: center;
}

/**
 * 响应式设计 - 平板
 */
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  }
}

/**
 * 响应式设计 - 手机
 * 在小屏幕上，侧边栏默认隐藏，需要手动展开
 */
@media (max-width: 480px) {
  .app-sidebar {
    transform: translateX(-100%);
    transition:
      transform 0.3s ease,
      width 0.3s ease;
  }

  .app-sidebar.show {
    transform: translateX(0);
  }
}

/**
 * 暗黑主题特定样式
 */
:deep(.dark) .app-sidebar {
  background-color: var(--el-bg-color);
  border-right-color: var(--el-border-color);
}

:deep(.dark) .sidebar-footer {
  border-top-color: var(--el-border-color);
}
</style>
