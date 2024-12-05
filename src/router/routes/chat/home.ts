export default [
  {
    path: '/chat',
    redirect: '/chat/layout'
  },
  {
    path: '/chat/layout',
    redirect: '/chat/conversation',
    component: '/chat/home/layout',
    children: [
      {
        path: '/chat/conversation',
        component: '/chat/conversation/index'
      },
      {
        path: '/chat/contact',
        component: '/chat/contact/index'
      }
    ]
  }
]
