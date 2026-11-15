import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '健康数据看板' } },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { title: '居民健康档案' } },
      { path: 'knowledge', name: 'Knowledge', component: () => import('../views/Knowledge.vue'), meta: { title: '健康科普管理' } },
      { path: 'banners', name: 'Banners', component: () => import('../views/Banners.vue'), meta: { title: '健康宣教横幅' } },
      { path: 'notices', name: 'Notices', component: () => import('../views/Notices.vue'), meta: { title: '健康提醒公告' } },
      { path: 'checkins', name: 'Checkins', component: () => import('../views/Checkins.vue'), meta: { title: '健康打卡记录' } },
      { path: 'drugs', name: 'Drugs', component: () => import('../views/Drugs.vue'), meta: { title: '药品管理' } },
      { path: 'drug-orders', name: 'DrugOrders', component: () => import('../views/DrugOrders.vue'), meta: { title: '药品订单' } },
      { path: 'charts', name: 'Charts', component: () => import('../views/Charts.vue'), meta: { title: '健康数据统计' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const isLogin = sessionStorage.getItem('adminLogin') === 'true'
  if (to.meta.requiresAuth && !isLogin) next('/login')
  else if (to.path === '/login' && isLogin) next('/dashboard')
  else next()
})

export default router
