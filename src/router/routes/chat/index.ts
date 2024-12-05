import conversation from './conversation'
import home from './home'
export default [
  {
    path: '/chat-box',
    component: '/chat/App',
    children: [...home, ...conversation]
  }
]
