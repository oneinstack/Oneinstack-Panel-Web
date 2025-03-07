import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import sshake from '@/sstore/sshake'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import StatusBarConfig from '@/utils/StatusBarConfig'
import System from '@/utils/System'
import { nextTick, onMounted, reactive, watch } from 'vue'

export const index = () => {
  const conf = reactive({
    minVal: null as any,
    maxVal: null as any,
    serviceHeiht: 680,
    //充值钱包信息
    infoObj: {
      name: 'USD',
      currentMoney: '1,9340',
      number: '3',
      walletIndex: -1
    } as any,
    //提交数据
    formData: {
      payment_method: [], //支付方式
      inputValue: '',
      service: ''
    } as any,
    // 支付方式list
    paymentMethodsList: [] as any[],
    modalName: undefined as any, //模态框name
    service_charge: '',
    rechargeWalletList: [] as any[],
    currentCoinIndex: null as any,
    valueArr: [] as any[],
    indicatorStyle: `height: 50px;`,
    userInfo: {} as any, //用户登录信息
    paymentChannelList: [] as any[], //支付通道列表
    remainingCoding: '' as any,
    payMethodCode: null as any,
    selectChannelInfo: {} as any, //选择支付通道信息
    defaultCoinWallet: {} as any,
    currentCoinRemainingCoding: '' as any, //剩余打码量
    usertype: 0,
    exchangeRateNum: null as any,
    choosePaymentItem: null as any, //选中的提现方式
    vf: {} as any,
    swiperList: [] as any[],
    // 提现金额 -- 输入框input事件
    vfFun: (e: any, name: any) => {
      if(e) conf.vf[name](e)
      nextTick(() => {
        conf.formData.service = sutil.Mul(conf.formData.inputValue, conf.service_charge)
        const o1 = 'USDT'
        if (parseFloat(conf.formData.inputValue) > parseFloat(conf.infoObj.walletMoney)) {
          conf.formData.inputValue = sutil.formatNumber(parseInt(conf.infoObj.walletMoney), 2)
          conf.formData.service = sutil.formatNumber(sutil.Mul(conf.formData.inputValue, conf.service_charge))
        }
        if (conf.choosePaymentItem.payMethodType === o1 && conf.infoObj.coinCode !== o1) {
          const _item = conf.swiperList.find((v: any) => v.coinCode === o1)

          let currentNum = conf.infoObj.coinTousdt

          let num = sutil.division(_item.coinTousdt, currentNum, false)
          let sum = sutil.Mul(num, conf.formData.inputValue)
          sum = sutil.formatNumber(sum)

          conf.formData.ExchangeCharge = sutil.Mul(_item.exchangeFee / 100, sum) + o1
        }
        if (conf.payMethodCode == 'USDT_PAYMENT') {
          conf.getUSDT()
        }
      })
    },

    changeMoney(type: any) {
      if(type == 0) conf.formData.inputValue = conf.minVal
      else {
        const waleltNum = Number(conf.infoObj.walletMoney)
        let maxNum = waleltNum > conf.maxVal ? conf.maxVal : waleltNum
        let changeNum = Math.floor(sutil.Mul(maxNum,type))
        conf.formData.inputValue = changeNum > conf.minVal ? changeNum : conf.minVal
      }
      conf.vfFun(null, 'inputValue')
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    //获取币种列表
    getCoinlist() {
      conf.swiperList = []
      apis.coinlist({
        success: (res: any) => {
          if (res.code == 200) {
            conf.swiperList = res.data || []
            conf.defaultCoinWallet = conf.swiperList.find((item: any) => item.isDefault)
            conf.getWalletList(conf.swiperList, null)
          } else {
            System.toast(res.message || 'fail')
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //获取用户钱包list
    getWalletList(arr: any[], type: any) {
      apis.walletlist({
        success: async (res: any) => {
          if (res.code == 200) {
            let currentWallet = Cookie.get('currentWallet')
            if (!currentWallet) {
              let defaultInfo = await svalue.getDefaultWallet()
              currentWallet = defaultInfo.coinCode
            }
            conf.rechargeWalletList = res.data || []
            conf.rechargeWalletList?.forEach((item, itemIndex) => {
              let index = arr.findIndex((into) => into.coinCode == item.walletCoin)
              if (index != -1) {
                let obj = {
                  ...arr[index],
                  ...item
                }
                conf.rechargeWalletList[itemIndex] = obj
                if (item.walletCoin == currentWallet) {
                  sapp.globalData.defaultWalletInfo = obj
                  conf.infoObj = obj
                  conf.infoObj.walletIndex = itemIndex
                  conf.currentCoinIndex = itemIndex
                  nextTick(() => {
                    conf.getpayPlatformList()
                  })
                }
              }
            })
          }
        }
      })
    },

    //获取支付方式
    getpayPlatformList() {
      apis.userPaymentTypeWithdrawal({
        coin: conf.infoObj.coinCode,
        success: (res: any) => {
          if (res.code == 200) {
            let data = res.data;
            
            data?.forEach((item: any, index: number) => {
              item.id = item.payMethodCode
              item.name = item.payMethodType
              item.isClicked = false
              if (index == 0) {
                item.isClicked = true
                conf.payMethodCode = item.payMethodCode
              }

              item.userPayMethodList?.forEach((into: any) => {
                into.paymentData = JSON.parse(into.paymentData)
                if (into.paymentData.bankCardNum) {
                  let str1 = into.paymentData.bankCardNum
                  into.paymentData.newBankCardNum = str1.substr(str1.split('').length - 4, str1.split('').length)
                }
              })
            })
            conf.paymentMethodsList = data?.filter((item: any) => {
              return item.payMethodCode != 'CASH_PAYMENT'
            })
            conf.handelChangePaymentMethod(conf.paymentMethodsList[0])
            data.length > 0 && (conf.paymentChannelList = data[0].userPayMethodList || [])
          }
        }
      })
    },

    //获取剩余打码量数据
    getUserFlowData() {
      System.loading()
      apis.getUserFlow({
        success: (res: any) => {
          if (res.code == 200) {
            conf.remainingCoding = parseFloat(res.data)
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //选择提现crrency => picker
    rechargeWalletPickerChange({ currentOption }: any) {
      conf.currentCoinIndex = conf.rechargeWalletList.findIndex((item: any) => item.coinCode == currentOption.coinCode)
    },

    //选择提现currency -- 确认btn
    handleSelectWalletConfirm() {
      let index = conf.currentCoinIndex
      conf.infoObj = conf.rechargeWalletList[index] || {}
      conf.infoObj.walletIndex = index
      conf.modalName = undefined
      conf.selectChannelInfo = {}
      nextTick(() => {
        conf.paymentChannelList = []
        conf.getpayPlatformList()
      })
      conf.formData.inputValue = ''
    },

    //click支付方式
    handelChangePaymentMethod(obj: any) {
      conf.modalName = undefined
      conf.choosePaymentItem = obj
      conf.payMethodCode = obj?.payMethodCode
      conf.paymentMethodsList?.forEach((item: any) => {
        item.isClicked = false
        item.payMethodType == obj.payMethodType && (item.isClicked = true)
      })
      conf.selectChannelInfo = {}

      conf.paymentChannelList = obj?.userPayMethodList || []
      conf.paymentChannelList?.forEach((item: any) => {
        item.isChecked = false
      })
      // this.maxVal = null
      // this.minVal = null
      if (conf.paymentChannelList.length == 1) {
        conf.handleSelectChannel(conf.paymentChannelList[0])
      }
      conf.formData.inputValue = ''
    },

    getUSDT() {
      //当前币种汇率 /目标币种汇率 * 当前金额 => 结果截取四位小数不进行四舍五入
      //当前 usdt
      let targetNum = conf.swiperList.find((v: any) => v.coinCode == 'USDT').coinTousdt
      //目标 选中的币种
      let currentNum = conf.infoObj.coinTousdt

      let num = sutil.division(targetNum, currentNum, false)
      let sum = sutil.Mul(num, conf.formData.inputValue)
      sum = sutil.formatNumber(sum)
      conf.exchangeRateNum = '≈ ' + sum + ' USDT'
    },

    //click快捷提现金额
    handleClickOtherRecharge(obj: any) {
      if (parseFloat(obj.withdrawMoney) > parseFloat(conf.infoObj.walletMoney)) {
        System.toast(i18n.t('WithdrawModule.InsufficientBalanceTip')) //当前钱包余额不够！
        return
      }
      conf.formData.inputValue = obj.withdrawMoney
      conf.formData.service = obj.service
    },

    //选择 -- 打开模态框
    handleOpenModal(type: any) {
      if (conf.paymentChannelList.length == 0) {
        System.toast(i18n.t('WithdrawModule.noBankTip')) //该支付类型暂无银行卡！
        return
      }
      conf.modalName = type
    },

    //选择支付通道
    handleSelectChannel(obj: any) {
      conf.selectChannelInfo = obj
      conf.paymentChannelList?.forEach((item: any) => {
        item.isChecked = false
        obj.userPayMethodId == item.userPayMethodId && (item.isChecked = true)
      })
      conf.hideModal()
    },

    //截取小数两位 => 不进行四舍五入
    formatNumberToFixed2(num: any) {
      let multiplier = Math.pow(10, 2)
      let roundedNum = Math.floor(num * multiplier)
      return roundedNum / multiplier
    },

    //关闭模态框
    hideModal() {
      conf.modalName = undefined
    },

    // 数据提交
    handleDataSubmit() {
      if (!conf.selectChannelInfo.userPayMethodId) {
        System.toast(i18n.t('rechargeModule.card')) //请选择支付方式
        return
      }
      if (!conf.formData.inputValue) {
        System.toast(i18n.t('WithdrawModule.withdrawAmountEmptytTip')) //请输入提现金额
        return
      }

      let val = parseFloat(conf.formData.inputValue)
      if (val > parseFloat(conf.maxVal)) {
        System.toast(i18n.t('rechargeModule.max') + ' ' + conf.infoObj.coinSymbol + conf.maxVal || '')
        return
      }
      if (val < parseFloat(conf.minVal)) {
        System.toast(i18n.t('rechargeModule.min') + ' ' + conf.infoObj.coinSymbol + conf.minVal || '')
        return
      }
      let obj = {
        depositWithdrawType: 1,
        money: conf.formData.inputValue,
        tradePlatform: 1,
        userPaymentTypeId: conf.selectChannelInfo.userPayMethodId,
        walletId: conf.infoObj.id,
        thisUserId: conf.userInfo.userId,
        payMethodCode: conf.payMethodCode
      }
      sshake.shakeFunction({
        key: 'payoutsBtn',
        time: 3000,
        success: () => {
          // 点击按钮执行的操作
          System.loading()
          apis.payouts({
            ...obj,
            success: (res: any) => {
              console.log(res);
              
              if (res.code == 200) {
                conf.hideModal()
                System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
                setTimeout(() => {
                  conf.goBack()
                }, 2000)
              } else {
                conf.hideModal()
                System.toast(i18n.t(`code.${res.code}`) || 'fail')
              }
            },
            complete: () => {
              System.loading(false)
            }
          })
        },
        fail: (res: any) => {
          // 请勿连续点击
          System.toast(i18n.t('user.shakeTip'))
        }
      })
    }
  })

  watch(
    () => conf.currentCoinIndex,
    (newValue) => {
      conf.valueArr[0] = conf.rechargeWalletList[newValue].coinCode
    },
    {
      deep: true
    }
  )

  watch(
    () => conf.infoObj,
    (newValue) => {
      conf.maxVal = conf.formatNumberToFixed2(newValue.withdrawMaxAmount)
      conf.minVal = conf.formatNumberToFixed2(newValue.withdrawMinAmount)
      conf.currentCoinRemainingCoding = sutil.formatNumber(sutil.Mul(conf.remainingCoding, newValue.coinTousdt))
      conf.currentCoinRemainingCoding = sutil.dataHandling(conf.currentCoinRemainingCoding)
    },
    {
      deep: true
    }
  )

  conf.vf = svf.getVf(conf.formData, {
    inputValue: {
      int: true
    }
  })

  onMounted(async () => {
    let userInfo = sconfig.userInfo
    if (userInfo) conf.usertype = userInfo.userType
    conf.service_charge = (await svalue.getAppConfiguration())?.premium || '0.015'

    nextTick(() => {
      if (parseFloat(conf.serviceHeiht.toString()) < 300) conf.serviceHeiht = 680
      conf.serviceHeiht = window.innerHeight - sutil.rem2px(300) - sutil.rem2px(104) - StatusBarConfig.statusHeight
    })

    conf.userInfo = sconfig.userInfo
    conf.getCoinlist()
    conf.getUserFlowData()
  })

  return conf
}
