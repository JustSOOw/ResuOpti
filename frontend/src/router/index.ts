/**
 * Vue Router 配置
 * 定义应用程序路由
 */

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    }
    // 更多路由将在后续添加
  ]
})

export default router