import { CVue3 } from 'tools-vue3'
import index from './index.vue'

export const toast = async (options: any) => {
  return CVue3.createCom({
    component: index,
    props: {
      ...options,
      show: true
    }
  })
}
