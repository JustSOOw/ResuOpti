/**
 * Vue Router 配置
 * 定义应用程序路由
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    // 认证相关路由
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: {
        title: '登录',
        requiresGuest: true // 标记为访客页面（已登录用户不应访问）
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: {
        title: '注册',
        requiresGuest: true // 标记为访客页面（已登录用户不应访问）
      }
    },
    // 应用主页面路由
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: {
        title: '仪表板',
        requiresAuth: true
      }
    },
    {
      path: '/positions/:id',
      name: 'position-detail',
      component: () => import('@/views/positions/PositionDetailView.vue'),
      meta: {
        title: '职位详情',
        requiresAuth: true
      },
      props: true // 将路由参数作为props传递
    },
    // 简历编辑器路由
    {
      path: '/editor/:id',
      name: 'editor',
      component: () => import('@/views/editor/EditorView.vue'),
      meta: {
        title: '简历编辑器',
        requiresAuth: true
      },
      props: true // 将路由参数作为props传递
    }
    // 更多路由将在后续添加
  ]
})

/**
 * 路由前置守卫
 * 检查需要认证的路由和访客路由，控制页面访问权限
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ResuOpti`
  } else {
    document.title = 'ResuOpti - 简历优化系统'
  }

  // 检查路由是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 未认证，重定向到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath } // 保存原始目标路由，登录后可以跳回
    })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 已认证用户访问访客页面（如登录、注册），重定向到仪表板
    next({ path: '/dashboard' })
  } else {
    // 其他情况，放行
    next()
  }
})

export default router