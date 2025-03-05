import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    isHeadFixed: false,
    langPopup: false,
    language: Cookie.get('language') || 'en-us',
    menu1: [] as any[],
    coinLosding: true,
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
    outPopup: false,
    userVipLevel: 0,
    gradedPercentage: 0,
    integral: 10000 as any,
    refresh: false,
    openEye: false,
    total_money: 0,
    str_money: '******',
    defaultCoin: {
      coinSymbol: '',
      coinTousdt: 0
    } as any, //接口返回默认币种钱包
    swiperList: [] as any[],
    showNumberBox: false,
    userWalletList: [] as any[],
    isRefash: false,

    //bind安全信息弹窗关闭
    handleCloseBindDialog() {
      conf.showNumberBox = false
    },

    handleEyeClick() {
      conf.openEye = !conf.openEye
      Cookie.set('showTotalWallet', conf.openEye)
    },

    handleCilckImg(type: string, e: any) {
      if (!sconfig.userInfo) return System.router.push('/login')

      switch (type) {
        //钱包
        case 'Remittance':
          System.router.push('/user/wallet/exchange')
          break
        //充值
        case 'Recharge':
          Cookie.set('userWalletList', conf.userWalletList)
          if (conf.userWalletList.length == 0) {
            System.toast(i18n.t('wallet.noWalletTip'))
          } else {
            System.router.push('/user/wallet/Recharge')
          }
          break
        //提现
        case 'Withdraw':
          let coin = conf.swiperList.find((item) => item.id == sconfig.userInfo.defaultWalletId)?.walletCoin
          apis.hasPaymentType({
            coin: sapp.globalData.defaultWalletInfo.walletCoin || sapp.globalData.defaultWalletInfo.coinCode || coin,
            success: (res: any) => {
              if (res.data) {
                Cookie.set('userWalletList', conf.userWalletList)
                System.router.push('/user/wallet/withDraw')
              } else {
                conf.showNumberBox = true
              }
            }
          })
          break
        //中心钱包
        case 'CentralWallet':
          System.router.push('/user/wallet/centerWallet')
          break
      }
    },

    needLoginShow: () => sconfig.userInfo,
    async initData() {
      let info = await svalue.getAppConfiguration(true)
      let addArr = []
      if (info.yeb) {
        addArr.push({
          name: info.app_name + ' fortune',
          leftImg: '/static/img/YuE-bao.png',
          icon: 'fortune',
          new: false,
          url: '/user/YuE-Bao/yueBao',
          isShow: conf.needLoginShow
        })
      }

      conf.menu1 = [
        [
          ...addArr,
          {
            // name: 'Third party placing',
            name: 'me.casinoBets',
            leftImg: '/static/img/Third-party-placing.png',
            icon: 'casino-bets',
            new: false,
            url: '/user/me/thirdPartyPlacing',
            isShow: conf.needLoginShow
          },
          {
            name: 'me.History',
            leftImg: '/static/img/result-history-new.png',
            icon: 'result-history',
            new: false,
            url: '/user/me/resultHistory',
            isShow: conf.needLoginShow
          },
          {
            name: 'me.Agency',
            leftImg: '/static/img/me-active-new.png',
            icon: 'agency-center',
            new: false,
            url: '/user/invite/index',
            isShow: conf.needLoginShow
          }
        ],
        [
          {
            name: 'me.Bets',
            leftImg: '/static/img/money-new.png',
            icon: 'my-bets',
            new: false,
            url: '/user/myBet/index',
            isShow: conf.needLoginShow
          },
          {
            name: 'me.Sratch',
            leftImg: '/static/img/sratch-history-new.png',
            icon: 'scratch-off-records',
            new: false,
            url: '/user/scratch/history',
            isShow: conf.needLoginShow
          },
          {
            name: 'me.Transactions',
            leftImg: '/static/img/transactions-new2.png',
            icon: 'my-transactions',
            new: false,
            url: '/user/me/myTransactions',
            isShow: conf.needLoginShow
          },
          {
            name: 'me.bankCrad',
            leftImg: '/static/img/back-card-new.png',
            icon: 'payment-methods',
            new: false,
            url: '/user/me/BankCard',
            isShow: conf.needLoginShow
          }
        ]
      ]
    },
    coinPopup: false,
    defaultInfo: {} as any,
    // 黑色主题菜单
    menuList: [
      {
        name: 'BG ToKen',
        num: '+0.50%',
        imgUrl: 'logo-img',
        rNum: '1BG',
        rPrice: '$0.0041148',
        isArrowRight: true
      },
      {
        name: 'BG Pocker',
        imgUrl: 'me-pocker',
        isArrowRight: false
      },
      {
        name: 'Casino',
        imgUrl: 'me-casino',
        isArrowRight: false,
        isMore: false,
        secondList: [
          {
            name: 'Favorites',
            imgUrl: 'cs-favorites',
          },
          {
            name: 'Recent',
            imgUrl: 'cs-recent',
          },
          {
            name: 'Originals',
            imgUrl: 'cs-originals',
          },
          {
            name: 'Top Picks',
            imgUrl: 'cs-picks',
          },
          {
            name: 'Slots',
            imgUrl: 'cs-slots',
          },
          {
            name: 'Live Casino',
            imgUrl: 'cs-live',
          },
          {
            name: 'Hot Games',
            imgUrl: 'cs-hot',
          },
          {
            name: 'Feature Buy-in',
            imgUrl: 'cs-feature',
          },
          {
            name: 'New Releases',
            imgUrl: 'cs-new',
          },
          {
            name: 'Table Game',
            imgUrl: 'cs-table',
          },
          {
            name: 'Game Shows',
            imgUrl: 'cs-game',
          }
        ]
      },
      {
        name: 'Lottery',
        imgUrl: 'me-lottery',
        isArrowRight: false
      },
      {
        name: 'Sports',
        imgUrl: 'me-sports',
        isArrowRight: false
      },
      {
        name: 'Promotions',
        imgUrl: 'me-promotions',
        isArrowRight: false,
        secondList: [
          {
            name: 'Check In',
            imgUrl: 'pt-check',
          },
          {
            name: 'Lucky Box',
            imgUrl: 'pt-lucky',
          },
          {
            name: 'Lucky Wheel',
            imgUrl: 'pt-wheel',
          },
          {
            name: 'Promotion',
            imgUrl: 'pt-check',
            url: '/user/promotion/promotion'
          }
        ]
      },
      {
        name: 'VIP Clup',
        imgUrl: 'me-club',
      },
      {
        name: 'Bonus',
        imgUrl: 'me-bonus',
      },
      {
        name: 'Agency Center',
        imgUrl: 'me-center',
        url: '/user/invite/index'
      },
      {
        name: 'About us',
        imgUrl: 'me-about',
        isArrowRight: true,
        url: '/user/about/about'
      },
      {
        name: 'Live Support',
        imgUrl: 'me-live',
        isArrowRight: true,
        func: () => {
          svalue.toService()
        }
      },
      {
        name: 'English',
        imgUrl: 'lang',
        id: 'en-us',
        isArrowRight: true,
        func: () => {
          conf.langPopup = true
        }
      },
      {
        name: 'INR',
        imgUrl: 'coin',
        img: '',
        isArrowRight: true,
        func: () => {
          conf.coinPopup = true
        }
      }
    ] as any[],
    showOpen(e: any) {
      if (!e.secondList) return
      const index = conf.menuList.findIndex((item: any) => item.name === e.name);
      conf.menuList[index].isMore = !conf.menuList[index].isMore;
    },
    handle(item: any) {
      item.url && System.router.push(item.url)
      item.func && item.func()
    },

    handleDefaultwallet(e: any) {
      System.loading()
      conf.coinPopup = false
      apis.defaultwallet({
        coinCode: e.coinCode,
        success: (res: any) => {
          sconfig.userInfo.defaultWalletId = e.id
          Cookie.set('userInfo', sconfig.userInfo)
          conf.defaultInfo = e

          const index = conf.menuList.findIndex((item) => item.imgUrl == 'coin')
          conf.menuList[index].name = e.coinCode
          conf.menuList[index].img = e.nationalFlag
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    pageToSettings() {
      System.router.push('/user/setting/setting')
    },
    async changeLang(item: any) {
      conf.language = item.id
      System.loading()
      await i18n.setLang(item.id)
      System.loading(false)
      conf.langPopup = false
      conf.menuList[11].name = item?.name
      conf.menuList[11].id = item?.id
    },
    async goLogin(url: string) {
      if (!sconfig.userInfo) url = '/login'
      System.router.push(url)
    },
    async userGradedInfo() {
      if (!sconfig.userInfo) return
      let res = await apis.userGradedInfo()
      let data = res.data
      conf.gradedPercentage = data.gradedPercentage
      conf.userVipLevel = data.userVipLevel > data.theMax ? data.theMax : data.userVipLevel
      let n = parseFloat(data.integral)
      conf.integral = n.toFixed(2)
    },
    async goOutLogin() {
      sconfig.logout()
      conf.outPopup = false
      conf.total_money = 0
      System.toast('out success', 'success')
    },
    async goWallet() {
      conf.defaultCoin = conf.swiperList.find((item) => item.isDefault)
      Cookie.set('defaultCoin', conf.defaultCoin)
      conf.getWalletList(conf.swiperList)
    },
    //获取用户钱包列表
    async getWalletList(arr: any) {
      let wlist = await svalue.getWalletlist()
      conf.userWalletList = wlist
      conf.defaultInfo = await svalue.getDefaultWallet()
      const index = conf.menuList.findIndex((item) => item.imgUrl == 'coin')
      conf.menuList[index].name = conf.defaultInfo.coinCode
      conf.menuList[index].img = conf.defaultInfo.nationalFlag
      
      conf.coinLosding = false
      let obj = wlist.find((item: any) => item.id == conf.defaultInfo.id)
      if (obj) {
        sapp.globalData.defaultWalletInfo = obj
      }
      let newArr = wlist || []
      arr?.forEach((item: any) => {
        let index = newArr?.findIndex((into: any) => into.walletCoin == item.coinCode)
        if (index != -1) {
          newArr[index].coinTousdt = item.coinTousdt
          newArr[index].nationalFlag = item.nationalFlag
          newArr[index].coinCode = item.coinCode
          item.id = newArr[index].id
          item.walletStatus = newArr[index].walletStatus
          newArr[index].coinSymbol = item.coinSymbol
        }
      })

      conf.total_money = 0
      newArr?.forEach((item: any, itemIndex: number) => {
        item.dollar = 0
        item.walletMoney = Number(item.walletMoney).toFixed(4)
        item.walletMoney > 0 && (item.dollar = sutil.division(item.walletMoney, item.coinTousdt))
        item.defaultCoinMoney =
          item.walletMoney > 0
            ? sutil.division(sutil.Mul(item.walletMoney, conf.defaultCoin.coinTousdt), item.coinTousdt)
            : 0
        conf.total_money = sutil.addNum(conf.total_money, item.defaultCoinMoney)
      })
      Cookie.set('userWalletList', newArr)
    }
  })

  const init = async () => {
    const item = conf.langArr.find((v) => v.id == conf.language)
    conf.menuList[11].name = item?.name
    conf.menuList[11].id = item?.id
    
    System.loading(false)
    conf.initData()
    conf.userGradedInfo()
    svalue.coinlist = []
    conf.swiperList = await svalue.getCoinlist()
    conf.total_money = 0
    sconfig.userInfo && conf.goWallet()
  }
  onMounted(() => init())

  return conf
}
