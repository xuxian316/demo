import { createRouter, createWebHistory } from 'vue-router'



const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 访问根路径时，重定向到 demo 的默认子路由
    {
      path: '/',
      redirect: '/demo/dashboard'
    },
    {
      // 父路由：Demo 框架
      path: '/demo',
      name: 'demo',
      // 这里引入你包含 Sidebar 和 Header 的父级组件
      component: () => import('../components/DemoView.vue'),
      // children 数组里面放置所有在主内容区显示的子路由
      children: [
        {
          // 访问 /demo/dashboard
          path: 'dashboard', 
          name: 'dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: '行业全景' }
        },
        {
          // 访问 /demo/explore
          path: 'explore',
          name: 'explore',
          component: () => import('../views/Explore.vue'),
          meta: { title: '岗位探索' }
        },
        {
          // 访问 /demo/map
          path: 'map',
          name: 'map',
          component: () => import('../views/Map.vue'),
          meta: { title: '薪资地图' }
        },
        {
          // 访问 /demo/careerchange
          path: 'careerchange',
          name: 'careerchange',
          component: () => import('../views/Careerchange.vue'),
          meta: { title: '转行路径' }
        },
        {
          // 访问 /demo/calendar
          path: 'calendar',
          name: 'calendar',
          component: () => import('../views/Calendar.vue'),
          meta: { title: '求职日历' }
        },
        {
          // 访问 /demo/toolbox
          path: 'toolbox',
          name: 'toolbox',
          component: () => import('../views/Toolbox.vue'),
          meta: { title: '工具箱' }
        }
      ]
    }
  ],
})

// 全局前置守卫，用于修改页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 有机化学数据看板`
  }
  next()
})

export default router

