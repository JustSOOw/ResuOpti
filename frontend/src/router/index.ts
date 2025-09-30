/**
 * Vue Router 配置
 * 定义应用程序路由
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 扩展路由元信息类型
 * 为TypeScript提供类型支持
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string
    /** 是否需要认证 */
    requiresAuth?: boolean
    /** 是否为访客页面（已登录用户不应访问） */
    requiresGuest?: boolean
  }
}

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
    },
    // 404 错误页面路由（捕获所有未匹配的路由）
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        title: '页面未找到'
      }
    }
  ]
})

/**
 * 路由前置守卫
 * 检查需要认证的路由和访客路由，控制页面访问权限
 * 包含token有效性验证和页面标题设置
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ResuOpti`
  } else {
    document.title = 'ResuOpti - 简历优化系统'
  }

  // 如果路由需要认证
  if (to.meta.requiresAuth) {
    // 验证token有效性
    const isValid = await authStore.checkAuthStatus()

    if (!isValid || !authStore.isAuthenticated) {
      // 认证失败或token无效，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存原始目标路由，登录后可以跳回
      })
      return
    }
  }

  // 检查是否为访客路由（已登录用户不应访问）
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 已认证用户访问访客页面（如登录、注册），重定向到仪表板
    next({ path: '/dashboard' })
    return
  }

  // 其他情况，放行
  next()
})

export default router