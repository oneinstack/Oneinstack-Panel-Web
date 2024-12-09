import conversation from './conversation'
import contact from './contact'
import home from './home'
import chating from './chating'
export default [
  {
    path: '/chat-box',
    component: '/chat/App',
    children: [...home, ...conversation, ...contact, ...chating]
  }
]
