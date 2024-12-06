import conversation from './conversation'
import contact from './contact'
import home from './home'
export default [
  {
    path: '/chat-box',
    component: '/chat/App',
    children: [...home, ...conversation,...contact]
  }
]
