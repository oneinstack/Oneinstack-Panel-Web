export default [
  {
    path: '/',
    redirect: '/home/home'
  },
  {
    path: '/tabbar',
    redirect: '/home/home',
    component: '/home/layout',
    children: [
      {
        path: '/home/home',
        component: '/home/home'
      },
      {
        path: '/home/me',
        component: '/home/me'
      },
      {
        path: '/home/promotions',
        component: '/home/promotions'
      },
      {
        path: '/home/wallet',
        component: '/home/wallet'
      },
      {
        path: '/home/longQueue',
        component: '/home/longQueue'
      }
    ]
  },
  {
    path: '/login',
    component: '/user/login/index'
  },
  {
    path: '/register',
    component: '/user/register/register'
  },
]
