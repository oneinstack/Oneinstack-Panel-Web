import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const mconf = Scope.getConf()
  const conf = reactive({
    todayWinnerInfoList: [] as any[]
  })
  onMounted(() => {
    conf.todayWinnerInfoList = mconf.virtualData['0'] || []
  })

  return conf
}
