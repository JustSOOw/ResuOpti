<!--
  通用加载指示器组件
  功能：
  1. 全屏或局部加载提示
  2. 支持自定义加载文本
  3. 支持暗黑主题
  4. 流畅的动画效果
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

/**
 * Props定义
 */
interface LoadingProps {
  /** 是否显示加载状态 */
  loading?: boolean
  /** 加载提示文本 */
  text?: string
  /** 是否全屏遮罩 */
  fullscreen?: boolean
  /** 背景遮罩透明度 (0-1) */
  backgroundOpacity?: number
  /** 加载图标大小 */
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<LoadingProps>(), {
  loading: false,
  text: '加载中...',
  fullscreen: true,
  backgroundOpacity: 0.8,
  size: 'default'
})

// ==================== Stores ====================

/** 主题状态管理 */
const themeStore = useThemeStore()

// ==================== 计算属性 ====================

/**
 * 是否为暗黑主题
 */
const isDark = computed(() => themeStore.isDark)

/**
 * 背景遮罩样式
 */
const maskStyle = computed(() => ({
  backgroundColor: isDark.value
    ? `rgba(0, 0, 0, ${props.backgroundOpacity})`
    : `rgba(255, 255, 255, ${props.backgroundOpacity})`
}))

/**
 * 加载图标尺寸（像素）
 */
const spinnerSize = computed(() => {
  switch (props.size) {
    case 'small':
      return '32px'
    case 'large':
      return '64px'
    default:
      return '48px'
  }
})
</script>

<template>
  <transition name="loading-fade">
    <div
      v-if="props.loading"
      class="loading-container"
      :class="{
        'loading-fullscreen': props.fullscreen,
        'loading-dark': isDark
      }"
      :style="maskStyle"
    >
      <div class="loading-content">
        <!-- 加载动画 -->
        <div class="loading-spinner" :style="{ width: spinnerSize, height: spinnerSize }">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>

        <!-- 加载文本 -->
        <div v-if="props.text" class="loading-text">
          {{ props.text }}
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/**
 * 加载容器
 */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  transition: opacity 0.3s ease;
}

/**
 * 全屏模式
 */
.loading-fullscreen {
  position: fixed;
  z-index: 3000;
}

/**
 * 加载内容容器
 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/**
 * 加载动画容器
 */
.loading-spinner {
  position: relative;
  display: inline-block;
}

/**
 * 旋转环动画
 * 使用四个环形成层叠的旋转效果
 */
.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--el-color-primary);
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  border-right-color: var(--el-color-primary);
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: var(--el-color-primary);
  animation-delay: -0.15s;
}

.spinner-ring:nth-child(4) {
  border-left-color: var(--el-color-primary);
}

/**
 * 旋转动画关键帧
 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/**
 * 加载文本样式
 */
.loading-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  user-select: none;
  animation: pulse 1.5s ease-in-out infinite;
}

/**
 * 文本脉冲动画
 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/**
 * 暗黑主题下的文本颜色
 */
.loading-dark .loading-text {
  color: var(--el-text-color-primary);
}

/**
 * 淡入淡出过渡效果
 */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/**
 * 响应式设计 - 小屏幕
 */
@media (max-width: 480px) {
  .loading-content {
    gap: 12px;
  }

  .loading-text {
    font-size: 13px;
  }
}

/**
 * 暗黑主题特定样式
 * 增强暗黑模式下的视觉对比
 */
.loading-dark .spinner-ring:nth-child(1) {
  border-top-color: var(--el-color-primary-light-3);
}

.loading-dark .spinner-ring:nth-child(2) {
  border-right-color: var(--el-color-primary-light-3);
}

.loading-dark .spinner-ring:nth-child(3) {
  border-bottom-color: var(--el-color-primary-light-3);
}

.loading-dark .spinner-ring:nth-child(4) {
  border-left-color: var(--el-color-primary-light-3);
}

/**
 * 高性能优化
 * 启用硬件加速
 */
.loading-spinner,
.spinner-ring {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
