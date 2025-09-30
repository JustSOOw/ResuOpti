<!--
  全局错误边界组件
  捕获子组件中的所有错误，防止整个应用崩溃
  用法: 在需要错误保护的组件外包裹 <ErrorBoundary>
-->

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary-content">
      <el-result
        icon="error"
        title="页面加载失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-space>
            <el-button type="primary" @click="handleReset">
              重新加载
            </el-button>
            <el-button @click="handleGoBack">
              返回上一页
            </el-button>
            <el-button v-if="isDev" @click="showDetails = !showDetails">
              {{ showDetails ? '隐藏' : '查看' }}详情
            </el-button>
          </el-space>
        </template>
      </el-result>

      <!-- 开发环境显示错误详情 -->
      <div v-if="isDev && showDetails && errorInfo" class="error-details">
        <el-collapse>
          <el-collapse-item title="错误详情" name="error">
            <pre>{{ errorInfo }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>

  <!-- 正常渲染子组件 -->
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

/**
 * Props定义
 */
interface Props {
  // 自定义错误消息
  fallbackMessage?: string
  // 是否在控制台打印错误
  logError?: boolean
  // 错误回调函数
  onError?: (error: Error, info: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallbackMessage: '抱歉，页面遇到了一些问题',
  logError: true,
  onError: undefined
})

const router = useRouter()

// 状态管理
const hasError = ref(false)
const errorMessage = ref('')
const errorInfo = ref('')
const showDetails = ref(false)
const isDev = computed(() => import.meta.env.DEV)

/**
 * 捕获组件错误
 * Vue 3的onErrorCaptured生命周期钩子
 */
onErrorCaptured((error: Error, instance, info: string) => {
  // 设置错误状态
  hasError.value = true
  errorMessage.value = props.fallbackMessage
  errorInfo.value = `错误信息: ${error.message}\n\n错误来源: ${info}\n\n错误堆栈:\n${error.stack}`

  // 打印错误到控制台
  if (props.logError) {
    console.error('[ErrorBoundary] 捕获到错误:', {
      error,
      instance,
      info,
      timestamp: new Date().toISOString()
    })
  }

  // 调用错误回调
  if (props.onError) {
    props.onError(error, info)
  }

  // 在生产环境上报错误到监控服务
  if (import.meta.env.PROD) {
    // TODO: 集成错误监控服务（如 Sentry）
    // Sentry.captureException(error, { contexts: { vue: { componentName: info } } })
  }

  // 阻止错误继续向上传播
  return false
})

/**
 * 重置错误状态，重新渲染组件
 */
const handleReset = () => {
  hasError.value = false
  errorMessage.value = ''
  errorInfo.value = ''
  showDetails.value = false
  ElMessage.success('页面已重新加载')
}

/**
 * 返回上一页
 */
const handleGoBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.error-boundary {
  width: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;

  .error-boundary-content {
    max-width: 800px;
    width: 100%;
  }

  .error-details {
    margin-top: 24px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;

    pre {
      margin: 0;
      padding: 12px;
      background-color: var(--el-bg-color);
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-primary);
    }
  }
}
</style>