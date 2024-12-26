import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    userImgUrl: '',
    userNickname: '',
    memberAccount: '',
    uid: '',
    outPopup: false,
    file: {} as any,

    chooseFile: async (file: any) => {
      if (file.content.startsWith('data:image')) {
        conf.file = file
        conf.userImgUrl = file.content
      }
    },

    async submit() {
      if (!conf.userNickname) {
        System.toast(i18n.t('common.InputNickname'))
        return
      }
      let userImgUrl = conf.userImgUrl

      if (conf.file.file) {
        System.loading()
        const res = await apis.upload({
          file: conf.file.file,
          final: (_, res) => {
            System.loading(false)
          }
        })
        userImgUrl = res.data.link
      }
      System.loading()
      let ret = await apis.editUserInfo({
        userNickname: conf.userNickname,
        userImgUrl: userImgUrl,
        final: (_, res) => {
          System.loading(false)
        }
      })
      System.toast(i18n.t(`code.${ret.code}`), 'success')
      sconfig.userInfo.userNickname = conf.userNickname
      sconfig.userInfo.userImgUrl = userImgUrl
      sconfig.saveUserInfo()
      setTimeout(() => {
        sutil.pageBack()
      }, 300)
    }
  })
  onMounted(() => {
    conf.userNickname = sconfig.userInfo.userNickname
    conf.memberAccount = sconfig.userInfo.userName
    conf.userImgUrl = sconfig.userInfo.userImgUrl
    conf.uid = sconfig.userInfo.uid
  })

  return conf
}
