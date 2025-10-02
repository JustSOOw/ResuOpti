<!--
  ResumeMetadataDialog 组件使用示例
  演示如何在父组件中使用简历元数据编辑对话框
-->

<script setup lang="ts">
import { ref } from 'vue'
import ResumeMetadataDialog from './ResumeMetadataDialog.vue'

// 示例数据
const showDialog = ref(false)
const resumeId = ref('example-resume-id-123')
const resumeTitle = ref('前端开发工程师简历 - V1.0')
const currentNotes = ref('这是一份针对阿里巴巴前端岗位定制的简历，重点突出React和TypeScript经验。')
const currentTags = ref(['技术重点', '阿里定制', 'React专精'])

// 打开对话框
const handleOpenDialog = () => {
  showDialog.value = true
}

// 更新成功回调
const handleUpdateSuccess = () => {
  console.log('元数据更新成功！')
  // 这里可以刷新简历列表或显示提示
}

// 取消操作回调
const handleCancel = () => {
  console.log('用户取消了编辑')
}
</script>

<template>
  <div class="example-container">
    <h2>ResumeMetadataDialog 使用示例</h2>

    <!-- 触发按钮 -->
    <el-button type="primary" @click="handleOpenDialog">
      打开元数据编辑对话框
    </el-button>

    <!-- 元数据编辑对话框 -->
    <ResumeMetadataDialog
      v-model:visible="showDialog"
      :resume-id="resumeId"
      :resume-title="resumeTitle"
      :initial-notes="currentNotes"
      :initial-tags="currentTags"
      @success="handleUpdateSuccess"
      @cancel="handleCancel"
    />

    <!-- 当前数据展示 -->
    <el-card class="current-data" shadow="hover">
      <template #header>
        <span>当前元数据</span>
      </template>
      <div>
        <p><strong>备注：</strong>{{ currentNotes }}</p>
        <p><strong>标签：</strong>{{ currentTags.join(', ') }}</p>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.example-container {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.current-data {
  margin-top: 24px;
}
</style>
