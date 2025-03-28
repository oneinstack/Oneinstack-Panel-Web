import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const { t } = i18n
  const timer = Scope.Timer()
  const conf = reactive({
    language: Cookie.get('language') || 'zh-CN',
    menu1: [
      [
        
        {
          name: t('me.theme'),
          new: false,
          func: () => {
            conf.popup.open('theme')
          },
          isShow: true
        },
        {
          name: t('me.languages'),
          new: false,
          func: () => {
            conf.popup.open('lang')
          },
          isShow: true
        },
        
      ],
      [
        {
          name: t('me.logout'),
          new: false,
          func: () => {
            conf.outPopup = true
          },
          isShow: () => sconfig.userInfo
        }
      ]
    ],
    langArr: [
      {
        name: '简体中文',
        id: 'zh-CN'
      },
      {
        name: 'English',
        id: 'en-us'
      },
      {
        name: 'हिंदी',
        id: 'hi-IN'
      },
      {
        name: 'ภาษาไทย',
        id: 'th-TH'
      },
      {
        name: 'Indonesia',
        id: 'id-ID'
      },
      {
        name: 'Português',
        id: 'pt-PT'
      },
      {
        name: 'Español',
        id: 'es-ES'
      }
    ],
    currentTheme: Cookie.get('pageTheme') || '',
    themeArr: [
      {
        name: 'me.defaultTheme',
        id: '',
        bg: '#FFF2E9',
        color: '#FF7502'
      },
      {
        name: 'me.blueTheme',
        id: 'blue',
        bg: '#E6F2FF',
        color: '#006FFF'
      },
    ],
    popup: {
      type: 'lang' as 'theme' | 'lang' | 'refer' | 'wallet',
      show: false,
      data: [] as any[],
      open: (type: 'theme' | 'lang' | 'refer' | 'wallet') => {
        conf.popup.type = type
        conf.popup.data = type == 'theme' ? conf.themeArr : conf.langArr
        conf.popup.show = true
      },
      close: () => {
        conf.popup.type = 'lang'
        conf.popup.show = false
      }
    },
    outPopup: false,
    handle(item: any) {
      item.func && item.func()
    },
    async changeLang(item: any) {
      conf.language = item.id
      System.loading()
      await i18n.setLang(item.id)
      System.loading(false)
      window.location.reload()
      conf.popup.close()
    },
    changeTheme(item: any) {
      System.setTheme(item.id)
      conf.popup.close()
    },
    async goOutLogin() {
      sconfig.logout()
      conf.outPopup = false
      System.toast('out success', 'success')
      if(Cookie.get('pageTheme') && Cookie.get('pageTheme') == 'black') {
        return System.router.replace('/home/home')
      }
      timer.once(() => sutil.pageBack(), 2000)
    },
  })

  onMounted(() => {
    const item = conf.langArr.find((v) => v.id == conf.language)
    if(Cookie.get('pageTheme') && Cookie.get('pageTheme') == 'black') {
      const theme: any = conf.themeArr.find((v) => v.id == conf.currentTheme)
    }
  })
  return conf
}
