export default [
  {
    path: '/',
    redirect: '/home/home'
  },
  {
    path: '/tabbar',
    redirect: '/home/home',
    component: '/tabbar/layout',
    children: [
      {
        path: '/home/home',
        component: '/tabbar/home/index'
      },
      {
        path: '/home/me',
        component: '/tabbar/me/index'
      },
      {
        path: '/home/app',
        component: '/tabbar/app/index'
      },
      {
        path: '/home/file',
        component: '/tabbar/file/index'
      }
    ]
  },
  {
    path: '/search',
    component: '/search/index'
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
