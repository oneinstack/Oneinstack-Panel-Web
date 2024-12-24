import sstatus from '@/sstore/sstatus'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const mconf = Scope.getConf()
  const conf = reactive({
    SystemBulletinContentObj: {} as any,
    SystemBulletinDialogIndex: 0,
    SystemBulletinDialogArr: [] as any[],
    isOpenSystemBulletinDialog: false,
    isNoPromptBulletin: false,
    openItem: {
      fun: () => {
        conf.isOpenSystemBulletinDialog = true
      },
      level: 2,
      isRun: false
    },
    //关闭当前系统公告弹窗
    handleCloseSystemBulletinDialog() {
      conf.isOpenSystemBulletinDialog = false
      mconf.dialog.runNext(conf.openItem)
      let obj = {
        noPrompt: conf.isNoPromptBulletin
      }
      sstatus.setPrompt('bulletinDialogInfo', obj)
    },

    //查看上一条公告弹窗
    handleLastSystemBulletin() {
      conf.SystemBulletinDialogIndex -= 1
      conf.SystemBulletinContentObj = conf.SystemBulletinDialogArr[conf.SystemBulletinDialogIndex]
    },

    //查看下一条公告弹窗
    handleNextSystemBulletin() {
      conf.SystemBulletinDialogIndex += 1
      conf.SystemBulletinContentObj = conf.SystemBulletinDialogArr[conf.SystemBulletinDialogIndex]
    }
  })
  onMounted(() => {
    conf.SystemBulletinDialogArr = mconf.swiperList.filter((item: any) => {
      return item.isPopUps
    })

    if (conf.SystemBulletinDialogArr.length) {
      let bulletin = sstatus.getPrompt('bulletinDialogInfo')
      conf.openItem.isRun = !bulletin
      mconf.dialog.insert(conf.openItem)
    }

    conf.SystemBulletinContentObj = conf.SystemBulletinDialogArr[0] || {}
    conf.SystemBulletinDialogIndex = 0
  })

  return conf
}
