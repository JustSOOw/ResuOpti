<!--
  应用根组件
  负责渲染路由视图和初始化全局状态
-->

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

// ==================== Stores ====================

/** 认证Store */
const authStore = useAuthStore()

/** 主题Store */
const themeStore = useThemeStore()

// ==================== 生命周期 ====================

/**
 * 应用挂载时初始化
 */
onMounted(() => {
  // 从localStorage恢复认证状态
  authStore.loadAuthFromStorage()

  // 初始化主题
  themeStore.initTheme()
})
</script>

<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<style scoped>
/**
 * 应用根容器
 */
#app {
  width: 100%;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
  transition: background-color 0.3s ease;
}
</style>
