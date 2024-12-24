import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import sstatus from '@/sstore/sstatus'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const mconf = Scope.getConf()
  const conf = reactive({
    showNumberBox: false,
    isNoPrompt: false,
    openItem: {
      fun: () => {
        conf.showNumberBox = true
      },
      level: 1,
      isRun: false
    },
    getUserPhone: async () => {
      if (!sconfig.userInfo) return
      let prompt = sstatus.getPrompt('bindDialogInfo')
      if (prompt) return
      const res = await apis.getUserPhone({
        toast: (msg: string) => {}
      })

      let data = res.data
      if (!data.email || !data.isPwd || !data.userPhone || !data.isPwd) {
        conf.openItem.isRun = !prompt
        mconf.dialog.insert(conf.openItem)
      }
    },

    //bind安全信息弹窗btns
    handleBindDialogBtns: (type: any) => {
      conf.showNumberBox = false
      mconf.dialog.runNext(conf.openItem)
      let obj = {
        uid: sconfig.userInfo.uid,
        noPrompt: conf.isNoPrompt
      }
      sstatus.setPrompt('bindDialogInfo', obj)
      if (type == 'bind') System.router.push('/user/Password/Change')
    }
  })
  onMounted(() => {
    conf.getUserPhone()
  })

  return conf
}
