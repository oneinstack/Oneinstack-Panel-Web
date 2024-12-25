import { apis } from '@/api'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import sshake from '@/sstore/sshake'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import { nextTick, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'

export const index = () => {
  const conf = reactive({
    topSelectList: [] as any[],
    initArr: [] as any[],
    firstPopupShow: false,
    secondPopupShow: false,
    firstSelectInfo: {
      code: '',
      walletMoney: '',
      platformId: ''
    } as any,
    secondSelectInfo: {
      code: '',
      walletMoney: '',
      platformId: ''
    } as any,
    changeImg: '/static/img/wallet/change2.png',
    topInputValue: null as any,
    bottomInputValue: null as any,
    exchangeRate: '',
    modalName: null as any,
    topSearch: '',
    bottomSearch: '',
    coinCode: '',
    typeCode: '',
    sliderValue: 0,
    sliderMax: 100,
    coinArr: [] as any[],
    vf: {} as any,
    //输入框 -- 货币汇率转换
    vfFun: (e: any, name: string) => {
      conf.vf[name](e)
      nextTick(() => {
        if (parseFloat(conf.topInputValue) > parseFloat(conf.firstSelectInfo.walletMoney)) {
          conf.topInputValue = Number(conf.firstSelectInfo.walletMoney)
        }
        if (conf.bottomInputValue || conf.topInputValue) {
          conf.currencyConversion()
        }
      })
    },

    async getMoneyInfo(firstSelectInfo: any) {
      System.loading()
      const { data } = await apis.gameWalletForCenter({
        coinCode: sconfig.systemWalletInfo.coinCode,
        gamePlatformCode: firstSelectInfo.code,
        final: () => {
          System.loading(false)
        }
      })
      firstSelectInfo.walletMoney = data.walletMoney
    },

    //获取列表
    getPayPlatformList(coinCode: string) {
      conf.coinCode = coinCode
      apis.getPayPlatformList({
        coinCode,
        success: async (res: any) => {
          if (res.code == 200) {
            conf.initArr = res.data.map((item: any) => {
              let coin = conf.coinArr.find((c) => c.coinCode == item.platformCoinCode)
              return {
                coinCode: coin?.coinCode,
                coinTousdt: coin?.coinTousdt,
                coinSymbol: coin?.coinSymbol,
                ...item
              }
            })
            this.topSelectList = this.initArr
            if (conf.typeCode) {
              conf.firstSelectInfo = conf.initArr.find((x) => x.code == conf.typeCode)
              if (!conf.secondSelectInfo.code) conf.secondSelectInfo = conf.initArr[0]
              if (conf.typeCode == 'Current') conf.secondSelectInfo = []
            } else {
              this.firstSelectInfo = this.topSelectList[0]
            }
            if (conf.secondSelectInfo.code) {
              conf.secondSelectInfo = conf.initArr.find((x) => x.code == conf.secondSelectInfo.code)
            }
            // else {
            // 	this.secondSelectInfo = this.initArr.find(x => x.code == 'BUGO')
            // }
            this.sliderMax = this.firstSelectInfo.walletMoney

            const fcode = this.firstSelectInfo.code
            if (fcode === conf.typeCode && fcode !== 'Current') {
              await conf.getMoneyInfo(conf.firstSelectInfo)
            }
            if (conf.topSelectList.length > 1 && conf.typeCode == 'Current') {
              await Timer.delay(100)
              //默认选中第一个
              await conf.handleOpt(conf.topSelectList[1], 'bottom')
              await conf.handleOpt(conf.topSelectList[1], 'bottom')
            }
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //上下select切换、左右汇率切换
    swapElements() {
      conf.sliderValue = 0
      setTimeout(() => {
        let obj1 = JSON.parse(JSON.stringify(conf.firstSelectInfo)) || {}
        let obj2 = JSON.parse(JSON.stringify(conf.secondSelectInfo)) || {}
        conf.firstSelectInfo = obj2
        conf.secondSelectInfo = obj1
        conf.topInputValue = ''
        conf.bottomInputValue = ''
        conf.sliderMax = conf.firstSelectInfo.walletMoney
      }, 100)
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    allMoney() {
      if (conf.firstSelectInfo.walletMoney) {
        conf.topInputValue = conf.firstSelectInfo.walletMoney
        conf.sliderValue = conf.topInputValue
        conf.currencyConversion()
      }
    },

    handleSilder(e: any) {
      conf.sliderValue = e.target.value
      conf.topInputValue = e.target.value
      conf.currencyConversion()
    },

    //货币换算
    currencyConversion() {
      let thirdObj = conf.firstSelectInfo.code != 'Current' ? conf.firstSelectInfo : conf.secondSelectInfo
      if (!thirdObj.hasOwnProperty('coinTousdt')) {
        return
      }
      let currentObj = conf.firstSelectInfo.code == 'Current' ? conf.firstSelectInfo : conf.secondSelectInfo
      let inputVal = conf.firstSelectInfo.code != 'Current' ? conf.topInputValue : conf.bottomInputValue
      let num1 = sutil.division(inputVal, thirdObj.coinTousdt, false)
      let total = sutil.Mul(num1, currentObj.coinTousdt)
      let monery = sutil.Mul(sutil.division(thirdObj.coinTousdt, currentObj.coinTousdt, false), currentObj.walletMoney)
      monery = parseInt(monery.toString())
      if (conf.firstSelectInfo.code != 'Current') {
        conf.bottomInputValue = total.toFixed(4)
        if (sutil.isNull(conf.bottomInputValue)) conf.bottomInputValue = '0'
      } else {
        conf.topInputValue = total.toFixed(4)
        if (sutil.isNull(conf.topInputValue)) conf.topInputValue = '0'
        //判断
        nextTick(() => {
          if (parseFloat(conf.bottomInputValue) > monery) {
            conf.bottomInputValue = monery
            System.toast(i18n.t('wallet.outCurrentWallet'))
            conf.bottomInputValue = ''
            conf.topInputValue = ''
          }
        })
      }
    },

    formatDecimal(num: any, decimal: any) {
      num = num.toString()
      let index = num.indexOf('.')
      if (index !== -1) {
        num = num.substring(0, decimal + index + 1)
      } else {
        num = num.substring(0)
      }
      return parseFloat(num).toFixed(decimal)
    },

    // 下拉框弹窗 -- 搜索
    searchIcon(type: any, e: any) {
      let key = e.target.value.toLowerCase()
      if (!key) {
        conf.topSelectList = conf.initArr
        return
      }
      //top的弹窗关键字搜索
      conf.topSelectList = conf.topSelectList.filter((item) => {
        return item.code.toLowerCase().includes(key)
      })
    },

    //click下拉框
    handleOpenSelect(type: any, e: any) {
      conf.modalName = e.currentTarget.dataset.target
      if (type == 'top') {
        conf.firstPopupShow = !conf.firstPopupShow
      } else {
        conf.secondPopupShow = !conf.secondPopupShow
      }
    },

    //下拉框选择option的click事件
    async handleOpt(item: any, type: any) {
      if (item.walletMoney === -1) {
        await conf.getMoneyInfo(item)
        return
      }

      if (type == 'top') {
        conf.firstPopupShow = !conf.firstPopupShow
        conf.firstSelectInfo = item
      } else {
        conf.secondPopupShow = !conf.secondPopupShow
        conf.secondSelectInfo = item
      }
      conf.modalName = null
      conf.topSearch = ''
      conf.bottomSearch = ''
      conf.currencyConversion()
    },

    //关闭弹窗
    hideModal(e: any) {
      conf.modalName = null
      conf.firstPopupShow = false
      conf.secondPopupShow = false
      conf.topSearch = ''
      conf.bottomSearch = ''
      conf.topSelectList = conf.initArr
    },

    //Connect Wallet -- 汇兑
    handleDataSubmit() {
      if (!conf.firstSelectInfo.code) {
        System.toast(i18n.t('swapModule.chooseWalletTip'))
        return
      }
      if (!conf.topInputValue) {
        System.toast(i18n.t('swapModule.enterAmountTip'))
        return
      }
      if (!conf.secondSelectInfo.code) {
        System.toast(i18n.t('swapModule.chooseWalletTip'))
        return
      }
      sshake.shakeFunction({
        key: 'thirdpartyBtn',
        time: 3000,
        success: () => {
          // 点击按钮执行的操作
          System.loading()
          apis.thirdpartyTransfer({
            sourceGameCode: conf.firstSelectInfo.code,
            sourceGamePlatformId: conf.firstSelectInfo.platformId,
            targetGameCode: conf.secondSelectInfo.code,
            targetGamePlatformId: conf.secondSelectInfo.platformId,
            tradeAmount: conf.firstSelectInfo.code != 'Current' ? conf.topInputValue : conf.bottomInputValue,
            tradeCoinCode: conf.coinCode,
            sourceGamePlatformCode: conf.firstSelectInfo.code,
            targetGamePlatformCode: conf.secondSelectInfo.code,
            success: (res: any) => {
              if (res.code == 200) {
                conf.topInputValue = null
                conf.bottomInputValue = null
                System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
                conf.typeCode = conf.firstSelectInfo.code
                // this.getPayPlatformList(this.coinCode)
                setTimeout(() => {
                  conf.goBack()
                }, 300)
              } else {
                System.toast(i18n.t(`code.${res.code}`) || 'fail', 'error')
              }
            },
            complete: () => {
              System.loading(false)
            }
          })
        },
        fail: () => {
          // 请勿连续点击
          System.toast(i18n.t('user.shakeTip'), 'error')
        }
      })
    },

    async getWalletMoney() {
      System.loading()
      try {
        const wlist = await svalue.getWalletlist()
        const clist = await svalue.getCoinlist()
        let defaultWalletId = sconfig.userInfo.defaultWalletId
        wlist.forEach((item: any) => {
          if (item.id == defaultWalletId) {
            conf.coinArr = clist
            //第三方未接通 不调接口
            conf.getPayPlatformList(item.walletCoin)
          }
        })
      } catch (err) {
        System.loading(false)
      }
    }
  })

  conf.vf = svf.getVf(conf, {
    topInputValue: {
      int: true
    },
    bottomInputValue: {
      int: true
    }
  })

  const route = useRoute()
  onMounted(() => {
    const routeParams = route.query
    console.log('object', routeParams)
    if (routeParams && routeParams.type) {
      conf.typeCode = routeParams.type as string
    }
    conf.getWalletMoney()
  })

  return conf
}
