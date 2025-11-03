import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PostItemView from '@/views/PostItemView.vue'
import ItemDetailView from '@/views/ItemDetailView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true },
    },
    {
      path: '/post-item',
      name: 'post-item',
      component: PostItemView,
      meta: { requiresAuth: true },
    },
    {
      path: '/item/:id',
      name: 'item-detail',
      component: ItemDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/my',
      name: 'my-page',
      component: () => import('@/views/MyPageView.vue'),
      meta: { requiresAuth: true },
    },
    // 兜底路由，重定向到登录页
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, from, next) => {
  // 关键修复：将字符串转换为布尔值判断
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'

  // 增强调试信息
  console.log('导航:', from.path, '→', to.path)
  console.log('认证状态:', isAuthenticated)
  console.log('需要认证:', to.meta.requiresAuth)
  console.log('游客专用:', to.meta.requiresGuest)

  // 如果访问根路径且已登录，跳转到首页
  if (to.path === '/' && isAuthenticated) {
    console.log('已登录，重定向到首页')
    next('/home')
    return
  }

  // 需要登录的页面但未登录 → 跳转到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('未登录，重定向到登录页')
    next('/')
    return
  }

  // 只能游客访问的页面但已登录 → 跳转到首页
  if (to.meta.requiresGuest && isAuthenticated) {
    console.log('已登录，重定向到首页')
    next('/home')
    return
  }

  next()
})

export default router
