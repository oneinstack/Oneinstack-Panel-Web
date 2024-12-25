import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    titleName: '',
    formData: {
      username: '',
      cardId: ''
    } as any,
    isBind: 0,
    vf: {} as any,
    vfFun: (e: any, name: any) => {
      conf.vf[name](e)
    },

    // input => 清空
    handleClearInput(key: any) {
      conf.formData[key] = ''
    },

    // 数据提交
    handleDataSubmit: async () => {
      if (!conf.formData.username) {
        System.toast(i18n.t('PersonalInformation.UsernameEnter') + '!')
        return
      }

      if (!conf.formData.cardId) {
        System.toast(i18n.t('PersonalInformation.IdentityIdEnter') + '!')
        return
      }

      System.loading()
      const res = await apis.bindUserInfo({
        userWithdrawName: conf.formData.username,
        userIdCard: conf.formData.cardId,
        final: () => {
          System.loading(false)
        }
      })

      sconfig.userInfo.userWithdrawName = conf.formData.username
      sconfig.userInfo.userIdCard = conf.formData.cardId
      setTimeout(() => {
        sutil.pageBack()
      }, 2000)
      System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
    }
  })

  const init = async () => {
    conf.vf = svf.getVf(conf.formData, {
      username: {
        getHanzi: true,
        getNum: true,
        getEn: true,
        getCustom: '·'
      },
      cardId: {
        getHanzi: true,
        getNum: true,
        getEn: true,
        getCustom: '·'
      }
    })
    let obj = Cookie.get('SecurityInfoBindStatus')
    conf.isBind = obj.isUserInfo
    if (!conf.isBind) {
      conf.titleName = i18n.t('PersonalInformation.set') + ' ' + i18n.t('PersonalInformation.title')
    } else {
      conf.formData.username = sconfig.userInfo.userWithdrawName
      conf.formData.cardId = sconfig.userInfo.userIdCard
      conf.titleName = i18n.t('PersonalInformation.Current') + ' ' + i18n.t('PersonalInformation.title')
    }
  }
  onMounted(() => {
    init()
  })

  return conf
}
