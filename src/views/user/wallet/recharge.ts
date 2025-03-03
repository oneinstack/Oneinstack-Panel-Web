import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import sshake from '@/sstore/sshake'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import svf from '@/sstore/svf'
import sweb from '@/sstore/sweb'
import StatusBarConfig from '@/utils/StatusBarConfig'
import System from '@/utils/System'
import { computed, nextTick, onMounted, reactive, watch } from 'vue'

export const index = () => {
  const conf = reactive({
    modalName: null as any,
    modalShow: computed<boolean>({
      get: () => !!conf.modalName,
      set: () => (conf.modalName = null)
    }),
    serviceHeiht: 680,
    //充值钱包信息
    infoObj: {
      name: '',
      currentMoney: '',
      number: '',
      walletIndex: -1,
      quickRechargeAmount: []
    } as any,
    //提交数据
    formData: {
      payMethodCode: '', //支付方式code
      paymentVendor: '', //支付厂商
      paymentChannel: '', //支付通道
      rechargeAmount: '',
      userName: '',
      remark: ''
    } as any,
    paymentMethodsList: [] as any, //支付方式list
    paymentVendorList: [] as any, //支付厂商list
    paymentChannelList: [] as any, //支付通道list
    selectPaymentVendorInfo: {} as any, //选择支付厂商信息
    selectPaymentChannelInfo: {
      bindParam: []
    } as any, //选择支付通道信息
    indicatorStyle: `height: 50px;`,
    valueArr: [] as any,
    currentCoinIndex: null as any,
    defaultAmountList: [] as any, //默认充值金额列表
    rechargeMinVal: '',
    rechargeMaxVal: '',
    bankCardInfo: {
      bankBranch: '',
      bankCardUserName: '',
      bankCardNum: ''
    },
    scanCodeInfo: {
      scanCodePayImgUrl: '',
      scanCodePayName: ''
    } as any,
    qrCodeObj: {} as any,
    qrcode: '', //二维码的内容链接
    size: 150, //二维码的大小
    unit: 'px', //大小单位 !!! rem单位有误
    load_make: true, //组件加载完成后自动生成二维码
    show_loading: false, //是否添加loading
    onval: true, //val值变化时自动重新生成二维码
    background: '#ffffff', //背景色
    foreground: '#000', //点色
    pdground: '#000', //角标色
    icon: '', //二维码图标
    lv: 3, //二维码容错级别
    isOpenDialog: false,
    usdtWalletList: [] as any, //usdt钱包信息
    exchangeRateNum: null as any,
    allData: [],
    isInputDisabled: false,
    paymentList: [],
    payMentLoading: true,
    swiperList: [] as any,
    defaultCoinWallet: {} as any,
    rechargeWalletList: [] as any,
    scanCodePayImgUrl: '',
    scanCodePayName: '',
    webUrl: '',
    vf: {} as any,
    vfFun: (e: any, name: string) => {
      conf.vf[name](e)
      nextTick(() => {
        conf.defaultAmountList?.forEach((item: any) => {
          Reflect.set(item, 'isClick', false)
          if (parseFloat(conf.formData[name]) == item.money) {
            Reflect.set(item, 'isClick', true)
          }
        })

        if (conf.formData.payMethodCode == 'USDT_PAYMENT') {
          conf.getUSDT()
        }
      })
    },
    //返回
    goBack() {
      sutil.pageBack()
    },

    //获取币种列表
    getCoinlist() {
      System.loading()
      conf.swiperList = []
      apis.coinlist({
        success: (res: any) => {
          if (res.code == 200) {
            conf.swiperList = res.data || []
            conf.defaultCoinWallet = conf.swiperList.find((item: any) => item.isDefault)
            conf.getWalletList(conf.swiperList, null)
            conf.usdtWalletList = conf.swiperList.find((v: any) => v.coinCode == 'USDT')
          } else {
            System.toast(res.message)
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //获取用户钱包list
    getWalletList(arr: any, type: any) {
      apis.walletlist({
        success: async (res: any) => {
          if (res.code == 200) {
            let currentWallet = Cookie.get('currentWallet')
            if (!currentWallet) {
              let defaultInfo = await svalue.getDefaultWallet()
              currentWallet = defaultInfo.coinCode
            }
            conf.rechargeWalletList = res.data || []
            conf.rechargeWalletList?.forEach((item: any, itemIndex: number) => {
              let index = arr.findIndex((into: any) => into.coinCode == item.walletCoin)
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
                    this.getPaymentMethodsData()
                  })
                }
              }
            })
          }
        }
      })
    },

    //获取支付方式数据
    getPaymentMethodsData() {
      System.loading()
      apis.payMethodList({
        success: (res: any) => {
          if (res.code == 200) {
            let data = res.data
            conf.allData = data
            if (conf.infoObj.coinCode == 'USDT') {
              conf.paymentMethodsList = conf.allData.filter((item: any) => item.payMethodCode == 'USDT_PAYMENT')
            } else {
              conf.paymentMethodsList = data
            }
            conf.paymentMethodsList?.forEach((item: any, index: number) => {
              item.isClicked = false
              item.name = item.payMethodName
              if (index == 0) {
                item.isClicked = true
                conf.formData.payMethodCode = item.payMethodCode
              }
            })
            nextTick(() => {
              conf.getPaymentVendorData()
            })
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //选择支付方式change
    handelChangePaymentMethod(obj: any) {
      conf.modalName = undefined
      conf.payMentLoading = true
      conf.paymentMethodsList?.forEach((item: any) => {
        item.isClicked = false
        item.payMethodCode == obj.payMethodCode && (item.isClicked = true)
      })
      conf.formData.payMethodCode = obj.payMethodCode
      conf.defaultAmountList = []
      conf.rechargeMinVal = ''
      conf.rechargeMaxVal = ''
      conf.getPaymentVendorData()
      conf.handleClearSelectData()
    },

    //清空选择数据
    handleClearSelectData() {
      conf.formData.paymentVendor = ''
      conf.formData.paymentChannel = ''
      conf.formData.rechargeAmount = ''
      conf.formData.userName = ''
      conf.formData.remark = ''
      conf.selectPaymentVendorInfo = {}
      conf.selectPaymentChannelInfo = {}
      conf.selectPaymentChannelInfo.bindParam = []
      conf.bankCardInfo.bankBranch = ''
      conf.bankCardInfo.bankCardUserName = ''
      conf.bankCardInfo.bankCardNum = ''
      conf.scanCodePayImgUrl = ''
      conf.scanCodePayName = ''
      conf.qrCodeObj = {}
      conf.defaultAmountList?.forEach((item: any) => {
        Reflect.set(item, 'isClick', false)
      })
    },

    //获取支付厂商、支付通道数据
    getPaymentVendorData() {
      conf.paymentVendorList = []
      conf.paymentList = []
      apis.rechargePayList({
        methodCode: conf.formData.payMethodCode || conf.paymentMethodsList[0]?.payMethodCode,
        coin: conf.infoObj.coinCode,
        success: (res: any) => {
          if (res.code == 200) {
            let data = res.data || []
            data?.forEach((item: any, index: number) => {
              item.isClicked = false
              item.name = item.appShowName
            })
            conf.paymentList = res.data
            conf.payMentLoading = false
            if (conf.formData.payMethodCode == 'ONLINE_PAYMENT') {
              conf.paymentVendorList = res.data || []
              conf.paymentVendorList.length == 1 && conf.handleSelectModal('vendor', conf.paymentVendorList[0])
           
            } else {
              conf.paymentChannelList = res.data || []
              conf.paymentChannelList.length == 1 && conf.handleSelectModal('channel', conf.paymentChannelList[0])
            }
          }
        }
      })
    },

    //选择充值钱包picker
    rechargeWalletPickerChange({ currentOption }: any) {
      conf.currentCoinIndex = conf.rechargeWalletList.findIndex((item: any) => item.coinCode == currentOption.coinCode)
    },

    //选择充值钱包 -- 确认btn
    onClickConfirmUnit() {
      let index = conf.currentCoinIndex
      conf.infoObj = conf.rechargeWalletList[index] || {}
      conf.infoObj.walletIndex = index
      conf.modalName = null
      if (conf.infoObj.coinCode == 'USDT') {
        conf.paymentMethodsList = conf.allData.filter((item: any) => item.payMethodCode == 'USDT_PAYMENT')
      } else {
        conf.paymentMethodsList = conf.allData
      }
      conf.paymentMethodsList?.forEach((item: any, index: number) => {
        item.isClicked = false
        if (index == 0) {
          item.isClicked = true
          conf.formData.payMethodCode = item.payMethodCode
        }
      })
      nextTick(() => {
        conf.getPaymentVendorData()
        conf.handleClearSelectData()
      })
      conf.defaultAmountList = []
      conf.rechargeMinVal = ''
      conf.rechargeMaxVal = ''
    },

    //打开选择通道模态框
    handleOpenModal(e: string) {
      if (e == 'PaymentChannel' && !conf.formData.paymentVendor && conf.formData.payMethodCode == 'ONLINE_PAYMENT') {
        System.toast(i18n.t('rechargeModule.selectPaymentVendor') + '!' || '') //请先选择支付厂商
        return
      }
      conf.modalName = e
    },

    //关闭模态框
    hideModal() {
      conf.modalName = null
    },

    //模态框选择
    handleSelectModal(type: any, obj: any) {
      conf.defaultAmountList = []
      conf.rechargeMinVal = ''
      conf.rechargeMaxVal = ''
      switch (type) {
        //选择厂商
        case 'vendor':
          conf.formData.paymentVendor = obj.payPlatformCode
          conf.selectPaymentVendorInfo = obj
          conf.paymentVendorList?.forEach((item: any) => {
            item.isChecked = false
            obj.payPlatformCode == item.payPlatformCode && (item.isChecked = true)
          })
          conf.paymentChannelList = obj.payChannelList || []
          conf.formData.paymentChannel = ''
          conf.selectPaymentChannelInfo = {}
          conf.selectPaymentChannelInfo.bindParam = []
          conf.bankCardInfo.bankBranch = ''
          conf.bankCardInfo.bankCardUserName = ''
          conf.bankCardInfo.bankCardNum = ''
          conf.scanCodePayImgUrl = ''
          conf.scanCodePayName = ''
          conf.qrCodeObj = {}
          conf.paymentChannelList.length == 1 && conf.handleSelectModal('channel', conf.paymentChannelList[0])
          break
        //选择通道
        case 'channel':
          if (conf.formData.payMethodCode == 'ONLINE_PAYMENT' && obj.bindParam) {
            obj.bindParam = typeof obj.bindParam == 'string' ? JSON.parse(obj.bindParam) : obj.bindParam
            obj.bindParam?.forEach((item: any) => {
              Reflect.set(item, 'value', '')
              item.name == 'userName' && (item.value = sconfig.userInfo.userWithdrawName || '')
              item.name == 'idCard' && (item.value = sconfig.userInfo.userIdCard || '')
            })
          }
          conf.formData.paymentChannel = obj.payChannelId

          if (conf.formData.payMethodCode == 'BANK_CARD_PAYMENT') {
            conf.bankCardInfo = JSON.parse(obj.channelData)
          }

          if (conf.formData.payMethodCode == 'SCAN_CODE_PAYMENT') {
            conf.scanCodeInfo = JSON.parse(obj.channelData)
          }

          if (conf.formData.payMethodCode == 'USDT_PAYMENT') {
            conf.qrCodeObj = JSON.parse(obj.channelData)
            conf.qrcode = conf.qrCodeObj.USDTPayUrl
          }

          conf.paymentChannelList?.forEach((item: any) => {
            item.isChecked = false
            obj.payChannelId == item.payChannelId && (item.isChecked = true)
          })
          conf.selectPaymentChannelInfo = obj
          let arr = obj.payAmount?.split(',')
          arr?.forEach((item: any) => {
            conf.defaultAmountList.push({
              money: conf.formatNumberToFixed2(item),
              isClick: false
            })
          })
          conf.rechargeMinVal = conf.formatNumberToFixed2(obj.payAmountMin).toString()
          conf.rechargeMaxVal = conf.formatNumberToFixed2(obj.payAmountMax).toString()
          conf.isInputDisabled = false
          break
      }
      conf.hideModal()
    },

    //截取小数两位 => 不进行四舍五入
    formatNumberToFixed2(num: any) {
      let multiplier = Math.pow(10, 2)
      let roundedNum = Math.floor(num * multiplier)
      return roundedNum / multiplier
    },

    //生成二维码
    qrR(e: any) {},

    //input框 => 获取焦点事件
    handleInputFocus() {
      if (!conf.formData.paymentChannel) {
        System.toast(i18n.t('rechargeModule.card') || '')
        conf.isInputDisabled = true
      } else {
        conf.isInputDisabled = false
      }
    },

    //快捷金额列表click事件
    handleClickRechargeAmount(obj: any) {
      conf.defaultAmountList?.forEach((item: any) => {
        Reflect.set(item, 'isClick', false)
        item.money == obj.money && (item.isClick = true)
      })
      conf.formData.rechargeAmount = obj.money
      if (conf.formData.payMethodCode == 'USDT_PAYMENT') {
        nextTick(() => {
          conf.getUSDT()
        })
      }
    },

    //获取USDT数据
    getUSDT() {
      //当前币种汇率 /目标币种汇率 * 当前金额 => 结果截取四位小数不进行四舍五入
      //当前 usdt
      let targetNum = conf.usdtWalletList.coinTousdt
      //目标 选中的币种
      let currentNum = conf.infoObj.coinTousdt

      let num = sutil.division(targetNum, currentNum, false)
      let sum = sutil.Mul(num, conf.formData.rechargeAmount)
      sum = sutil.formatNumber(sum)
      conf.exchangeRateNum = '≈ ' + sum + ' USDT'
    },

    //复制
    handleCopyCode(val: string) {
      let promoteCode = val //拿到想要复制的值

      // #ifdef H5
      let copyInput = document.createElement('input') //创建input元素
      document.body.appendChild(copyInput) //向页面底部追加输入框
      copyInput.setAttribute('value', promoteCode) //添加属性，将url赋值给input元素的value属性
      copyInput.select() //选择input元素
      document.execCommand('Copy') //执行复制命令
      System.toast(i18n.t('invite.CopySuccessful') || '', 'success') //弹出提示信息，不同组件可能存在写法不同
      //复制之后再删除元素，否则无法成功赋值
      copyInput.remove() //删除动态创建的节点
      // #endvar
    },

    // 数据提交
    handleDataSubmit() {
      let obj: any = null,
        isRequest = true,
        promptMessage = ''
      if (conf.formData.payMethodCode != 'ONLINE_PAYMENT' && !conf.formData.userName) {
        isRequest = false
        promptMessage =
          conf.formData.payMethodCode == 'USDT_PAYMENT'
            ? i18n.t('rechargeModule.txidTip')
            : i18n.t('rechargeModule.userName')
      }
      if (conf.formData.payMethodCode == 'ONLINE_PAYMENT' && conf.selectPaymentChannelInfo.bindParam.length > 0) {
        let index = conf.selectPaymentChannelInfo.bindParam.findIndex((item: any) => !item.value && item.required)
        if (index != -1) {
          isRequest = false
          promptMessage = 'Please enter ' + conf.selectPaymentChannelInfo.bindParam[index].label
        }
      }
      if (!conf.formData.rechargeAmount) {
        isRequest = false
        promptMessage = i18n.t('rechargeModule.rechargeAmountEmptytTip')
      }
      if (!conf.formData.paymentChannel) {
        isRequest = false
        promptMessage = i18n.t('rechargeModule.cardTip')
      }
      if (conf.formData.payMethodCode == 'ONLINE_PAYMENT' && !conf.formData.paymentVendor) {
        isRequest = false
        promptMessage = i18n.t('rechargeModule.selectPaymentVendor') + '!'
      }
      if (!isRequest) {
        System.toast(promptMessage || 'Please complete the form filling out!')
        return
      }

      let val = parseFloat(conf.formData.rechargeAmount)
      if (val > parseFloat(conf.rechargeMaxVal)) {
        System.toast(i18n.t('rechargeModule.max') + ' ' + conf.infoObj.coinSymbol + conf.rechargeMaxVal || '')
        return
      }
      if (val < parseFloat(conf.rechargeMinVal)) {
        System.toast(i18n.t('rechargeModule.min') + ' ' + conf.infoObj.coinSymbol + conf.rechargeMinVal || '')
        return
      }

      obj = {
        walletId: conf.infoObj.id,
        money: conf.formData.rechargeAmount,
        payMethodCode: conf.formData.payMethodCode,
        payChannelId: conf.selectPaymentChannelInfo.payChannelId,
        userRemark: conf.formData.remark
      }

      if (conf.formData.payMethodCode == 'ONLINE_PAYMENT') {
        if (conf.selectPaymentChannelInfo.bindParam) {
          conf.selectPaymentChannelInfo.bindParam?.forEach((item: any) => {
            if (item.required) {
              let key = item.name
              item.obj = {}
              item.obj[key] = item.value
              obj = { ...obj, ...item.obj }
            }
          })
        }
      } else {
        let newObj = {
          userName: conf.formData.userName
        }
        obj = { ...obj, ...newObj }
      }

      sshake.shakeFunction({
        key: 'rechargeBtn',
        time: 2000,
        success: () => {
          System.loading()
          apis.recharge({
            ...obj,
            success: (res: any) => {
              if (res.code == 200) {
                conf.hideModal()
                conf.formData.rechargeAmount = ''
                if (res.data.codeUrl) {
                  conf.isOpenDialog = true
                  conf.webUrl = res.data.codeUrl
                } else {
                  System.toast(i18n.t(`code.${res.code}`) || '', 'success')
                  setTimeout(() => {
                    conf.goBack()
                  }, 2000)
                }
                if (
                  this.formData.payMethodCode == 'ONLINE_PAYMENT' &&
                  (!sconfig.userInfo?.userWithdrawName || !sconfig.userInfo?.userIdCard)
                ) {
                  !sconfig.userInfo.userWithdrawName &&
                    (sconfig.userInfo.userWithdrawName = conf.selectPaymentChannelInfo.bindParam.find(
                      (item: any) => item.name == 'userName'
                    )?.value)
                  !sconfig.userInfo.userIdCard &&
                    (sconfig.userInfo.userIdCard = conf.selectPaymentChannelInfo.bindParam.find(
                      (item: any) => item.name == 'idCard'
                    )?.value)
                }
              } else {
                let min = conf.infoObj.coinSymbol + conf.rechargeMinVal
                let max = conf.infoObj.coinSymbol + conf.rechargeMaxVal
                conf.hideModal()
                System.toast(
                  res.code == 1216
                    ? i18n.t(`code.${res.code}`) + res.msg
                    : res.code == 1233
                      ? i18n.t(`code.${res.code}`) + ' ( ' + min + ' ~ ' + max + ' )'
                      : i18n.t(`code.${res.code}`)
                )
              }
            },
            complete: () => {
              System.loading(false)
            }
          })
        },
        fail: (res: any) => {
          // 请勿连续点击
          System.toast(i18n.t('user.shakeTip'), 'error')
        }
      })
    },

    // 第三方充值弹窗btns
    handleDialogBtns(type: string) {
      conf.isOpenDialog = false
      switch (type) {
        case 'confirm':
          sweb.open(conf.webUrl)
          break
        case 'cancel':
          conf.goBack()
          break
      }
    }
  })

  conf.vf = svf.getVf(conf.formData, {
    rechargeAmount: {
      int: true
    }
  })

  watch(
    () => conf.currentCoinIndex,
    (newVal) => {
      conf.valueArr[0] = conf.rechargeWalletList[newVal].coinCode
    },
    {
      deep: true // 深度监听父组件传过来对象变化
    }
  )

  onMounted(() => {
    nextTick(() => {
      if (parseFloat(conf.serviceHeiht.toString()) < 300) conf.serviceHeiht = 680
      conf.serviceHeiht = window.innerHeight - sutil.rem2px(300) - sutil.rem2px(104) - StatusBarConfig.statusHeight
    })
    conf.getCoinlist()
  })
  
  return conf
}
