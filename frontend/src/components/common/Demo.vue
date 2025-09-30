<!--
  通用组件使用示例页面
  展示如何使用Header、Sidebar和Loading组件
-->

<script setup lang="ts">
import { ref } from 'vue'
import { Header, Sidebar, Loading } from '@/components/common'

/**
 * 演示用的加载状态
 */
const isLoading = ref(false)

/**
 * 侧边栏折叠状态
 */
const isSidebarCollapsed = ref(false)

/**
 * 模拟加载操作
 */
const simulateLoading = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 2000)
}

/**
 * 处理侧边栏折叠变化
 */
const handleSidebarCollapse = (collapsed: boolean) => {
  isSidebarCollapsed.value = collapsed
  console.log('侧边栏折叠状态:', collapsed)
}
</script>

<template>
  <div class="demo-container">
    <!-- 顶部导航栏 -->
    <Header :show-logo="true" />

    <div class="main-container">
      <!-- 侧边栏 -->
      <Sidebar
        :default-collapsed="false"
        @collapse-change="handleSidebarCollapse"
      />

      <!-- 主内容区域 -->
      <div class="content-area">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>通用组件演示</span>
            </div>
          </template>

          <div class="demo-content">
            <h3>组件说明</h3>

            <el-divider />

            <h4>1. Header 组件</h4>
            <p>顶部导航栏包含：Logo、应用名称、主题切换、用户信息和退出登录</p>

            <el-divider />

            <h4>2. Sidebar 组件</h4>
            <p>侧边栏导航包含：仪表板、目标岗位、我的简历等菜单项</p>
            <p>当前折叠状态: {{ isSidebarCollapsed ? '已折叠' : '已展开' }}</p>

            <el-divider />

            <h4>3. Loading 组件</h4>
            <p>全局加载指示器，支持自定义文本和样式</p>
            <el-button type="primary" @click="simulateLoading">
              测试加载效果
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 加载指示器 -->
    <Loading
      :loading="isLoading"
      text="正在加载中..."
      :fullscreen="true"
    />
  </div>
</template>

<style scoped>
.demo-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.demo-content {
  line-height: 1.8;
}

.demo-content h3 {
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.demo-content h4 {
  margin: 16px 0 8px;
  color: var(--el-text-color-regular);
}

.demo-content p {
  margin: 8px 0;
  color: var(--el-text-color-secondary);
}
</style>