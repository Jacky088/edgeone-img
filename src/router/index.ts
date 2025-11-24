import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
    },
    // [新增] 登录页路由
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
  ],
})

// [新增] 全局前置守卫
router.beforeEach((to, from, next) => {
  // 1. 检查 sessionStorage 是否有 token
  const isAuthenticated = sessionStorage.getItem('site_access_token')

  // 2. 如果要去的是登录页，且已经登录，直接去首页
  if (to.name === 'login' && isAuthenticated) {
    next({ name: 'home' })
    return
  }

  // 3. 如果没有登录，且去的不是登录页，拦截跳转到登录页
  if (to.name !== 'login' && !isAuthenticated) {
    // 将用户原本想去的地址作为参数传过去，登录成功后跳回来
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 4. 放行
  next()
})

export default router
