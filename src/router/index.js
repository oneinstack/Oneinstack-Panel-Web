import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/home/bt-home.vue')
    },
    {
      path: '/appStore',
      name: 'appStore',
      component: () => import('../views/appStore/bt-appStore.vue')
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/help/bt-help.vue')
    },
    {
      path: '/download',
      name: 'download',
      component: () => import('../views/download/bt-download.vue')
      // children: [
      //   {
      //     path: 'list',
      //     name: 'GameList',
      //     component: () => import('../views/game/base-game.vue'),
      //     children: [
      //       {
      //         path: ':type',
      //         name: 'GameType',
      //         component: () => import('../views/game/base-game.vue')
      //       }
      //     ]
      //   }
      // ]
    }
  ],
  scrollBehavior(to) {
    // 始终滚动到顶部
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const element = document.querySelector(to.hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          resolve();
        }, 100); // 添加小延时确保页面内容已加载
      });
    }
    // 如果没有 hash，滚动到顶部
    return { top: 0, behavior: 'smooth' };
  }
})

export default router
