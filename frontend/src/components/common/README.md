# 通用组件说明文档

本目录包含ResuOpti项目的通用基础组件，所有组件均支持暗黑主题和响应式布局。

## 组件列表

### 1. Header.vue - 顶部导航栏

**功能特性：**
- 显示应用Logo和名称"ResuOpti"
- 主题切换按钮（亮色/暗黑）
- 用户信息显示（头像和邮箱）
- 退出登录功能
- 响应式布局适配

**Props：**
```typescript
interface HeaderProps {
  showLogo?: boolean  // 是否显示Logo，默认true
}
```

**使用示例：**
```vue
<script setup>
import { Header } from '@/components/common'
</script>

<template>
  <Header :show-logo="true" />
</template>
```

**依赖的Store：**
- `useAuthStore` - 用户认证信息
- `useThemeStore` - 主题状态管理

**使用的Element Plus组件：**
- `el-header` - 头部容器
- `el-button` - 按钮
- `el-avatar` - 用户头像
- `el-dropdown` - 下拉菜单
- `el-tooltip` - 提示框

**使用的图标：**
- `Moon` - 暗黑主题图标
- `Sunny` - 亮色主题图标
- `User` - 用户图标
- `SwitchButton` - 退出登录图标

---

### 2. Sidebar.vue - 侧边栏导航

**功能特性：**
- 主要导航菜单（仪表板、目标岗位、我的简历）
- 支持折叠/展开
- 自动高亮当前路由
- 响应式布局
- 平滑过渡动画

**Props：**
```typescript
interface SidebarProps {
  defaultCollapsed?: boolean  // 是否默认折叠，默认false
  width?: string              // 展开时宽度，默认'240px'
  collapsedWidth?: string     // 折叠时宽度，默认'64px'
}
```

**Emits：**
```typescript
interface SidebarEmits {
  (e: 'collapse-change', collapsed: boolean): void  // 折叠状态变化事件
}
```

**使用示例：**
```vue
<script setup>
import { Sidebar } from '@/components/common'

const handleCollapseChange = (collapsed) => {
  console.log('侧边栏折叠状态:', collapsed)
}
</script>

<template>
  <Sidebar
    :default-collapsed="false"
    width="240px"
    @collapse-change="handleCollapseChange"
  />
</template>
```

**菜单配置：**
```typescript
const menuItems = [
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
```

**使用的Element Plus组件：**
- `el-aside` - 侧边栏容器
- `el-menu` - 菜单组件
- `el-menu-item` - 菜单项
- `el-button` - 折叠按钮

**使用的图标：**
- `Odometer` - 仪表板图标
- `Document` - 简历图标
- `FolderOpened` - 岗位图标
- `Fold` - 折叠图标
- `Expand` - 展开图标

---

### 3. Loading.vue - 加载指示器

**功能特性：**
- 全屏或局部加载遮罩
- 自定义加载文本
- 流畅的旋转动画
- 支持不同尺寸
- 暗黑主题适配

**Props：**
```typescript
interface LoadingProps {
  loading?: boolean           // 是否显示加载状态，默认false
  text?: string              // 加载提示文本，默认'加载中...'
  fullscreen?: boolean       // 是否全屏遮罩，默认true
  backgroundOpacity?: number // 背景遮罩透明度(0-1)，默认0.8
  size?: 'small' | 'default' | 'large' // 加载图标大小，默认'default'
}
```

**使用示例：**
```vue
<script setup>
import { ref } from 'vue'
import { Loading } from '@/components/common'

const isLoading = ref(false)

const loadData = async () => {
  isLoading.value = true
  try {
    // 执行异步操作
    await fetchData()
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page">
    <!-- 页面内容 -->

    <!-- 加载指示器 -->
    <Loading
      :loading="isLoading"
      text="正在加载数据..."
      :fullscreen="true"
      size="default"
    />
  </div>
</template>
```

**局部加载示例：**
```vue
<template>
  <div class="container" style="position: relative; height: 400px;">
    <!-- 容器内容 -->

    <!-- 局部加载（需要父容器有position: relative） -->
    <Loading
      :loading="isLoading"
      text="加载中..."
      :fullscreen="false"
      size="small"
    />
  </div>
</template>
```

**依赖的Store：**
- `useThemeStore` - 主题状态管理（用于暗黑主题适配）

---

## 统一导入

所有组件可以通过index.ts统一导入：

```vue
<script setup>
// 方式1：按需导入
import { Header, Sidebar, Loading } from '@/components/common'

// 方式2：全部导入
import CommonComponents from '@/components/common'
const { Header, Sidebar, Loading } = CommonComponents
</script>
```

---

## 完整布局示例

典型的应用布局组合：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Header, Sidebar, Loading } from '@/components/common'

const isLoading = ref(false)
const isSidebarCollapsed = ref(false)

const handleSidebarCollapse = (collapsed: boolean) => {
  isSidebarCollapsed.value = collapsed
}
</script>

<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <Header />

    <div class="main-layout">
      <!-- 侧边栏 -->
      <Sidebar @collapse-change="handleSidebarCollapse" />

      <!-- 主内容区域 -->
      <main class="content-area">
        <router-view />
      </main>
    </div>

    <!-- 全局加载 -->
    <Loading :loading="isLoading" text="加载中..." />
  </div>
</template>

<style scoped>
.app-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}
</style>
```

---

## 主题支持

所有组件都完全支持Element Plus的暗黑主题系统：

- 自动适配`dark`类名
- 使用CSS变量实现主题色
- 通过`useThemeStore`控制主题切换
- 平滑的主题切换过渡效果

---

## 响应式断点

组件的响应式设计断点：

- **桌面端**: > 768px（完整功能）
- **平板**: 480px - 768px（部分UI调整）
- **手机**: < 480px（紧凑布局）

---

## 注意事项

1. **Header组件**：需要配置路由导航到登录页（/login）
2. **Sidebar组件**：菜单路由需要在router中配置对应的路由
3. **Loading组件**：局部加载需要父容器设置`position: relative`
4. **主题切换**：确保在应用启动时调用`themeStore.initTheme()`
5. **认证状态**：确保在应用启动时调用`authStore.loadAuthFromStorage()`

---

## 依赖项

这些组件依赖以下技术栈：

- Vue 3 (Composition API)
- TypeScript
- Element Plus
- @element-plus/icons-vue
- Vue Router
- Pinia

确保项目中已正确安装和配置这些依赖。