import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { reactive } from 'vue'

export const index = () => {
  const timer = Scope.Timer()
  const conf = reactive({
    language: Cookie.get('language') || 'en-us',
    menu1: [
      [
        {
          name: 'me.Password',
          new: false,
          url: '/user/Password/Change',
          isShow: () => sconfig.userInfo
        },
        {
          name: 'me.Theme',
          new: false,
          func: () => {
            conf.popup.open('theme')
          },
          isShow: true
        },
        {
          name: 'me.Languages',
          new: false,
          func: () => {
            conf.popup.open('lang')
          },
          isShow: true
        },
        {
          name: 'me.AboutUs',
          new: false,
          url: '/user/about/about',
          isShow: true
        },
        {
          name: 'me.Feedback',
          new: false,
          url: '/user/Feedback/index',
          isShow: () => sconfig.userInfo
        }
      ],
      [
        {
          name: 'me.logOut',
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
      {
        name: 'me.blackTheme',
        id: 'black',
        bg: '#E6F2FF',
        color: '#006FFF'
      }
    ],
    popup: {
      type: 'lang' as 'theme' | 'lang',
      show: false,
      data: [] as any[],
      open: (type: 'theme' | 'lang') => {
        conf.popup.type = type
        conf.popup.data = type == 'theme' ? conf.themeArr : conf.langArr
        conf.popup.show = true
      },
      close: () => {
        conf.popup.show = false
      }
    },
    outPopup: false,
    total_money: 0,
    handle(item: any) {
      item.url && System.router.push(item.url)
      item.func && item.func()
    },
    async changeLang(item: any) {
      conf.language = item.id
      System.loading()
      await i18n.setLang(item.id)
      System.loading(false)
      conf.popup.close()
    },
    changeTheme(item: any) {
      System.setTheme(item.id)
      conf.popup.close()
    },
    async goOutLogin() {
      sconfig.logout()
      conf.outPopup = false
      conf.total_money = 0
      System.toast('out success', 'success')
      timer.once(() => sutil.pageBack(), 2000)
    }
  })
  return conf
}
