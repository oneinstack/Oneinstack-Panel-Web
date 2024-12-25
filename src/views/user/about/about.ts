import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    outPopup: false,
    gameType: 0,

    version_number: '1.0.0',
    edit: '',
    version: '',
    moreShow: false,
    appName: '',
    logoImg: '',

    // 获取logo 名称
    async getConfiguration() {
      let appConfig = await svalue.getAppConfiguration()

      conf.logoImg = appConfig.app_logo
      conf.appName = appConfig.app_name
    },
    autoUpdate() {
      setTimeout(() => {
        let oVersion = conf.version_number.split('.').join('')
        if (Cookie.get('version') > oVersion) {
          conf.edit = i18n.t('version.subTitle')
          Cookie.remove('version')
        } else {
          conf.edit = i18n.t('version.noNew')
          System.toast(i18n.t('version.noNew'))
          Cookie.remove('version')
        }
      }, 1000)
    },
    chageGameType(num: number) {
      conf.gameType = num
      conf.outPopup = false
      Cookie.set('gameMethod', num)
    }
  })
  const init = async () => {
    conf.getConfiguration()
  }
  onMounted(() => {
    init()
  })

  return conf
}
