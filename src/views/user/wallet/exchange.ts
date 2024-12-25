import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sshake from '@/sstore/sshake'
import sutil from '@/sstore/sutil'
import svf from '@/sstore/svf'
import System from '@/utils/System'
import { nextTick, onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    topSelectList: [] as any,
    bottomSelectList: [] as any,
    firstPopupShow: false,
    secondPopupShow: false,
    firstSelectInfo: {
      nationalFlag: '',
      walletMoney: ''
    } as any,
    secondSelectInfo: {
      nationalFlag: '',
      walletMoney: ''
    } as any,
    topInputValue: null as any,
    bottomInputValue: null as any,
    exchangeRate: '',
    modalName: undefined as any,
    swiperList: [] as any, //货币种类
    userWalletList: [] as any, //用户钱包
    topSearch: '',
    bottomSearch: '',
    isLeft: true,
    currentWallet: '',
    bottomDefalutWallet: '',
    swapResult: '' as any,
    firstNumber: 1,
    vf: {} as any,
    // 输入框 -- 货币汇率转换
    vfFun: (e: any, name: any) => {
      conf.vf[name](e)
      nextTick(() => {
        if (parseFloat(conf.topInputValue) > parseFloat(conf.firstSelectInfo.walletMoney)) {
          conf.topInputValue = parseFloat(conf.firstSelectInfo.walletMoney)
        }
        conf.topInputValue && conf.currencyConversion()
        !conf.topInputValue && (conf.bottomInputValue = '')
      })
    },

    // 获取币种列表
    getCoinlist(type: any) {
      System.loading()
      conf.swiperList = []
      apis.coinlist({
        success: (res: any) => {
          if (res.code == 200) {
            res.data?.forEach((item: any) => {
              item.hasWallet = false
            })
            conf.swiperList = res.data || []
            let obj = conf.swiperList.find((item: any) => item.isDefault)
            conf.currentWallet != obj.coinCode && (conf.bottomDefalutWallet = obj.coinCode)
            conf.getWalletList(conf.swiperList, type)
          } else {
            System.toast(i18n.t(`code.${res.code}`) || 'fail')
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    // 获取用户钱包列表
    getWalletList(arr: any, type: any) {
      if (arr == null) {
        arr = conf.swiperList
      }
      apis.walletlist({
        success: (res: any) => {
          if (res.code == 200) {
            let newArr = res.data || []
            arr?.forEach((item: any) => {
              let index = newArr?.findIndex((into: any) => into.walletCoin == item.coinCode)
              if (index != -1) {
                newArr[index] = {
                  ...item,
                  ...newArr[index]
                }
              }
            })
            conf.userWalletList = newArr
            conf.dealData(conf.userWalletList)

            if (type) {
              conf.firstSelectInfo =
                conf.userWalletList.find((item: any) => item.coinCode == conf.firstSelectInfo.coinCode) || {}
              conf.secondSelectInfo =
                conf.userWalletList.find((item: any) => item.coinCode == conf.secondSelectInfo.coinCode) || {}
            } else {
              conf.firstSelectInfo = conf.userWalletList.find((item: any) => item.coinCode == conf.currentWallet) || {}
              conf.secondSelectInfo =
                conf.userWalletList.find((item: any) => item.coinCode == conf.bottomDefalutWallet) || {}
            }
            if (conf.firstSelectInfo.coinTousdt && conf.secondSelectInfo.coinTousdt) {
              conf.getSwapResult()
            }
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    // 数据处理
    dealData(arr: any) {
      conf.topSelectList = arr.filter((item: any, itemIndex: any) => {
        return item.walletCoin != conf.secondSelectInfo.walletCoin
      })
      conf.bottomSelectList = arr.filter((item: any, itemIndex: any) => {
        return item.walletCoin != conf.firstSelectInfo.walletCoin
      })
    },

    //上下select切换、左右汇率切换
    swapElements() {
      let obj1 = JSON.parse(JSON.stringify(conf.firstSelectInfo)) || {}
      let obj2 = JSON.parse(JSON.stringify(conf.secondSelectInfo)) || {}
      conf.firstSelectInfo = obj2
      conf.secondSelectInfo = obj1
      conf.topInputValue = ''
      conf.bottomInputValue = ''
      if (conf.firstSelectInfo.coinTousdt && conf.secondSelectInfo.coinTousdt) {
        conf.getSwapResult()
      }
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    //货币换算
    currencyConversion() {
      // 先乘后除
      let num1 = sutil.Mul(conf.secondSelectInfo.coinTousdt, conf.topInputValue)
      if (conf.secondSelectInfo.coinTousdt) {
        conf.bottomInputValue = sutil.division(num1, conf.firstSelectInfo.coinTousdt, false)
        conf.bottomInputValue = sutil.formatNumber(conf.bottomInputValue)
      }
      conf.secondSelectInfo.exchangeFeeVal = sutil.Mul(conf.secondSelectInfo.exchangeFee / 100, conf.bottomInputValue)
      const _total = conf.bottomInputValue
      conf.bottomInputValue -= conf.secondSelectInfo.exchangeFeeVal
      conf.bottomInputValue = parseFloat(conf.bottomInputValue.toFixed(4))
      conf.secondSelectInfo.exchangeFeeVal = parseFloat(conf.secondSelectInfo.exchangeFeeVal.toFixed(2))
      conf.secondSelectInfo.exchangeTotal = parseFloat(_total.toFixed(4))
    },

    // 下拉框弹窗 -- 搜索
    searchIcon(type: any, e: any) {
      conf.dealData(conf.userWalletList)
      let key = e.target.value.toLowerCase()
      //top的弹窗关键字搜索
      if (type == 'top-search') {
        conf.topSelectList = conf.topSelectList.filter((item: any) => {
          return item.walletCoin.toLowerCase().includes(key)
        })
      } else {
        conf.bottomSelectList = conf.bottomSelectList.filter((item: any) => {
          return item.walletCoin.toLowerCase().includes(key)
        })
      }
    },

    // click下拉框
    handleOpenSelect(type: any, e: any) {
      conf.dealData(conf.userWalletList)
      conf.modalName = e.currentTarget.dataset.target
      if (type == 'top') {
        conf.firstPopupShow = !conf.firstPopupShow
      } else {
        conf.secondPopupShow = !conf.secondPopupShow
      }
    },

    // 下拉框选择option的click事件
    handleOpt(index: any, type: any, arr: any) {
      conf.dealData(conf.userWalletList)
      let obj = arr[index] || {}
      if (type == 'top') {
        conf.firstPopupShow = !conf.firstPopupShow
        conf.firstSelectInfo = obj
        conf.topSelectList?.forEach((item: any) => {
          item.selected = false
          conf.topSelectList[index].selected = true
        })
        conf.exchangeRate = conf.firstSelectInfo.coinTousdt
      } else {
        conf.secondPopupShow = !conf.secondPopupShow
        conf.secondSelectInfo = obj
        conf.bottomSelectList?.forEach((item: any) => {
          item.selected = false
          conf.bottomSelectList[index].selected = true
        })
      }
      conf.modalName = null
      conf.topSearch = ''
      conf.bottomSearch = ''
      conf.topInputValue && conf.currencyConversion()
      if (conf.firstSelectInfo.coinTousdt && conf.secondSelectInfo.coinTousdt) {
        nextTick(() => {
          conf.getSwapResult()
        })
      }
    },

    // 获取汇率换算结果
    getSwapResult() {
      conf.firstNumber = 1
      if (conf.firstSelectInfo.coinCode == 'IDR') {
        conf.firstNumber = 10
      }
      let num1 = sutil.division(conf.secondSelectInfo.coinTousdt, conf.firstSelectInfo.coinTousdt, false)
      conf.swapResult = sutil.Mul(num1, conf.firstNumber)
      conf.swapResult = sutil.formatNumber(conf.swapResult)
    },

    // 关闭弹窗
    hideModal(e: any) {
      conf.topSearch = ''
      conf.bottomSearch = ''
      conf.modalName = null
      conf.firstPopupShow = false
      conf.secondPopupShow = false
    },

    // Connect Wallet -- 汇兑
    handleDataSubmit() {
      let obj = {} as any
      obj.money = conf.topInputValue
      obj.sourceCoinCode = conf.firstSelectInfo.coinCode
      obj.targetCoinCode = conf.secondSelectInfo.coinCode

      if (!obj.sourceCoinCode) {
        System.toast(i18n.t('swapModule.chooseWalletTip') || 'fail')
        return
      }
      if (!obj.money) {
        System.toast(i18n.t('swapModule.enterAmountTip') || 'fail')
        return
      }
      if (!obj.targetCoinCode) {
        System.toast(i18n.t('swapModule.chooseWalletTip') || 'fail')
        return
      }

      if (parseFloat(conf.topInputValue) == 0 || parseFloat(conf.bottomInputValue) == 0) {
        System.toast(i18n.t('swapModule.dissatisfyTip') || 'fail')
        return
      }
      sshake.shakeFunction({
        key: 'exchangeBtn',
        time: 3000,
        success: () => {
          System.loading()

          apis.exchange({
            ...obj,
            success: (res: any) => {
              if (res.code == 200 || res.code == 1293) {
                conf.topInputValue = null
                conf.bottomInputValue = null
                System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
                conf.getCoinlist('success')
                setTimeout(() => {
                  conf.goBack()
                }, 2000)
              } else {
                System.toast(i18n.t(`code.${res.code}`) || 'fail')
              }
            },
            complete: () => {
              System.loading(false)
            }
          })
        },
        fail: () => {
          // 请勿连续点击
          System.toast(i18n.t('user.shakeTip') || 'fail')
        }
      })
    }
  })

  conf.vf = svf.getVf(conf, {
    topInputValue: {
      float: true,
      fixed: 4
    },
    bottomInputValue: {
      float: true,
      fixed: 4
    }
  })

  onMounted(() => {
    conf.currentWallet = Cookie.get('currentWallet') || sapp.globalData.defaultWalletInfo.coinCode
    Cookie.set('currentWallet', conf.currentWallet)
    conf.getCoinlist(null)
  })

  return conf
}
