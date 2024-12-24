import { apis } from '@/api'
import sstatus from '@/sstore/sstatus'
import sweb from '@/sstore/sweb'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const mconf = Scope.getConf()
  const conf = reactive({
    showPopNotify: false,
    title: '',
    isNoPromptPop: false,
    notifyList: [] as any[],
    openItem: {
      fun: () => {
        conf.showPopNotify = true
      },
      level: 3,
      isRun: false
    },
    close() {
      conf.showPopNotify = false
      mconf.dialog.runNext(conf.openItem)
      let obj = {
        noPrompt: conf.isNoPromptPop
      }
      sstatus.setPrompt('PopNotifyDialogInfo', obj)
    },
    goContent(item: any) {
      if (item.pathUrl.indexOf('http') != -1) {
        sweb.open(item.pathUrl)
      }
    },

    //获取活动弹窗数据
    async getPoPut() {
      let popNotify = sstatus.getPrompt('PopNotifyDialogInfo')
      if (popNotify) return
      conf.notifyList = []
      const res = await apis.getPoPut()

      conf.notifyList = res.data.filter((item: any) => {
        return item.activityType == 3
      })
      if (conf.notifyList.length > 0) {
        conf.openItem.isRun = !popNotify
        mconf.dialog.insert(conf.openItem)
      }
    }
  })
  onMounted(() => {
    conf.getPoPut()
  })

  return conf
}
