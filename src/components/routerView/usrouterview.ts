import { reactive } from 'vue'

/**
 * x-router-view配置
 */
export const usrouterview = reactive({
  includeDefault: ['App', 'Home', 'ChatApp', 'ChatHome'],
  include: ['ChatConversation'],
  list: [] as any[]
})

export default usrouterview
