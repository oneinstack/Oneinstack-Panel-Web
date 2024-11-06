import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/home/base-home.vue'),
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('../views/about/base-about.vue'),
    },
  ],
})

export default router
