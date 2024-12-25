import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    info: '',
    getInfo: async () => {
      System.loading()
      const { data } = await apis.getYebContent({
        uid: sconfig.userInfo.uid,
        final: () => {
          System.loading(false)
        }
      })
      conf.info = data.content
    }
  })
  onMounted(() => {
    conf.getInfo()
  })

  return conf
}
