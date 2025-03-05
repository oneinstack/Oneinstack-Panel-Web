import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import stheme from '@/sstore/stheme'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

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
    bgcolor: 'transparent',
    blackMenuList: [
      {
        name: 'Exchange',
        imgUrl: 'ct-change',
        url: '/user/wallet/exchange'
      },
      {
        name: 'Fortune',
        imgUrl: 'ct-fortune',
        url: '/user/YuE-Bao/yueBao'
      },
      {
        name: 'Transaction',
        imgUrl: 'ct-tran',
        url: '/user/me/myTransactions'
      },
      {
        name: 'Bet History',
        imgUrl: 'ct-bet',
        url: '/user/myBet/index'
      },
      {
        name: 'Notification',
        imgUrl: 'ct-notif',
        isArrowRight: true,
        url: '/user/notice/notice'
      },
      {
        name: 'Refer',
        imgUrl: 'ct-refer',
        isArrowRight: true,
        func: () => {
          conf.popup.open('refer')
        }
      },
      {
        name: 'Agency Center',
        imgUrl: 'ct-agency',
        isArrowRight: true,
        url: '/user/invite/index'
      },
      {
        name: 'Settings',
        imgUrl: 'ct-setting',
        isArrowRight: true,
        url: '/user/setting/black/index'
      },
      {
        name: 'Language',
        imgUrl: 'ct-language',
        isArrowRight: true,
        rName: '',
        func: () => {
          conf.popup.open('lang')
        },
        isShow: true
      },
      {
        name: 'Currency',
        imgUrl: 'ct-currency',
        isArrowRight: true,
        rName: '--',
        func: () => {
          conf.popup.open('wallet')
        }
      },
      {
        name: 'Theme',
        imgUrl: 'ct-theme',
        isArrowRight: true,
        rName: '',
        func: () => {
          conf.popup.open('theme')
        },
        isShow: true
      },
      {
        name: 'Live Support',
        imgUrl: 'ct-live',
        isArrowRight: true,
        func: () => {
          console.log('88899')

          svalue.toService()
        }
      },
      {
        name: 'Feedback',
        imgUrl: 'ct-feedback',
        isArrowRight: true,
        url: ''
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
    total_money: 0,
    handle(item: any) {
      console.log('8888')

      item.url && System.router.push(item.url)
      item.func && item.func()
    },
    async changeLang(item: any) {
      conf.language = item.id
      conf.blackMenuList[8].rName = item?.name
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
    },
    hrefUrl: location.origin,
    copyTxt() {
      StrUtil.copyText(conf.hrefUrl)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    },
    //获取用户钱包list
    walletList: [] as any[],
    defaultWallet: {} as any,
    async getWalletList() {
      conf.walletList = await svalue.getWalletlist()
      const coinArr = await svalue.getCoinlist()
      let defaultInfo = await svalue.getDefaultWallet()
      conf.walletList?.forEach((item, itemIndex) => {
        let index = coinArr.findIndex((into) => into.coinCode == item.walletCoin)
        if (index != -1) {
          let obj = {
            ...coinArr[index],
            ...item
          }
          conf.walletList[itemIndex] = obj
          if (item.walletCoin == defaultInfo.coinCode) conf.defaultWallet = obj
        }
      })
      const index = conf.blackMenuList.findIndex((item) => item.imgUrl == 'ct-currency')
      conf.blackMenuList[index].rName = conf.defaultWallet.coinCode
      console.log(conf.walletList)
      console.log(conf.defaultWallet)
    },
    handleDefaultwallet(e: any) {
      console.log(e)
      System.loading()
      conf.popup.close()
      apis.defaultwallet({
        coinCode: e.coinCode,
        success: (res: any) => {
          sconfig.userInfo.defaultWalletId = e.id
          Cookie.set('userInfo', sconfig.userInfo)
          conf.defaultWallet = e
          const index = conf.blackMenuList.findIndex((item) => item.imgUrl == 'ct-currency')
          conf.blackMenuList[index].rName = conf.defaultWallet.coinCode
        },
        final: () => {
          System.loading(false)
        }
      })
    }
  })

  onMounted(() => {
    const item = conf.langArr.find((v) => v.id == conf.language)
    if(Cookie.get('pageTheme') && Cookie.get('pageTheme') == 'black') {
      conf.getWalletList()
      conf.blackMenuList[8].rName = item?.name
      const theme: any = conf.themeArr.find((v) => v.id == conf.currentTheme)
      conf.blackMenuList[10].rName = i18n.t(theme?.name)
    }
    
  })

  const event = Scope.Event()
  event.on(EPage.scroll, (e) => {
    if (e.top > 80) {
      conf.bgcolor = stheme.theme.black.headerBgColor()
    } else {
      conf.bgcolor = 'transparent'
    }
  })
  return conf
}
