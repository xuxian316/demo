import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/demo/dashboard',
  },
  {
    path: '/demo',
    name: 'demo',
    component: () => import('../components/DemoView.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '行业全景' },
      },
      {
        path: 'explore',
        name: 'explore',
        component: () => import('../views/Explore.vue'),
        meta: { title: '岗位探索' },
      },
      {
        path: 'map',
        name: 'map',
        component: () => import('../views/Map.vue'),
        meta: { title: '薪资地图' },
      },
      {
        path: 'graduate-decision',
        name: 'graduate-decision',
        component: () => import('../views/GraduateDecision.vue'),
        meta: { title: '本科生决策' },
      },
      {
        path: 'careerchange',
        name: 'careerchange',
        component: () => import('../views/Careerchange.vue'),
        meta: { title: '转行路径' },
      },
      {
        path: 'calendar',
        name: 'calendar',
        component: () => import('../views/Calendar.vue'),
        meta: { title: '求职日历' },
      },
      {
        path: 'toolbox',
        name: 'toolbox',
        component: () => import('../views/Toolbox.vue'),
        meta: { title: '工具箱' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 有机化学数据看板`
  }
  next()
})

export default router
