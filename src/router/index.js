import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import MyPageView from '@/views/MyPageView.vue'
import PostItemView from '@/views/PostItemView.vue'
import ItemDetailView from '@/views/ItemDetailView.vue'
import EditItemView from '@/views/EditItemView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/home',
      name: 'home-page',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/my-page',
      name: 'my-page',
      component: MyPageView,
    },
    {
      path: '/post-item',
      name: 'post-item',
      component: PostItemView,
    },
    {
      path: '/item-detail/:id',
      name: 'item-detail',
      component: ItemDetailView,
      props: true,
    },
    {
      path: '/edit-item/:id',
      name: 'edit-item',
      component: EditItemView,
      props: true,
    },
  ],
})

// 路由守卫：检查认证状态
router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register', '/home', '/']
  const authRequired = !publicPages.includes(to.path)
  const loggedIn = localStorage.getItem('authToken')

  if (authRequired && !loggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
