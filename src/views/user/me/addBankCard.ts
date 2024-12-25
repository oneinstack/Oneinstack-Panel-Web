import { nextTick, onMounted, reactive } from 'vue'
import i18n from '@/lang'
import System from '@/utils/System'
import sutil from '@/sstore/sutil'
import { apis } from '@/api'
import sshake from '@/sstore/sshake'
import sapp from '@/sstore/sapp'

export const index = () => {
  const conf = reactive({
    formData: {
      country: '', //国家
      payment_methods: '', //支付方式
      bank_type: '', //银行类型
      bankCardNum: '', //银行卡号
      bankCardUserName: '', //银行卡户名
      bankBranch: '', //SWIFT
      area_code: '', //区号
      mobile_phone: '', //手机号
      verification_code: '', //验证码
      email: '',
      onlinePayUrl: '', //线上支付地址
      onlinePayName: '', //线上支付账户名称
      protocol: '', //USDT协议
      scanCodePayImgUrl: '', //扫码支付二维码图片地址
      scanCodePayName: '' //扫码支付账户名称
    } as any,
    countryList: [] as any,
    menthodsList: [] as any,
    bankTypeList: [] as any,
    areaCodeList: [] as any,
    selectCountry: {} as any,
    selectMethodObj: {} as any,
    selectTypeObj: {} as any,
    selectAreaCodeObj: {} as any,
    modalName: undefined,
    isShowImg: false,
    Countdown: 60,
    indicatorStyle: `height: 50px;`,
    visible: true,
    value: [0],
    modalTitle: '',
    protocolList: [
      {
        name: 'ERC20'
      },
      {
        name: 'TRC20'
      }
    ] as any,
    isEditPage: false, //判断是否为编辑页面
    isEditInfoShow: false,
    editInfo: {} as any,
    titleName: i18n.t('addBankCradModule.titleName'),

    //编辑信息回显
    handleEditInfoShow(type: any) {
      switch (type) {
        case 'ONLINE_PAYMENT':
          conf.formData.onlinePayName = conf.editInfo.paymentData.onlinePayName
          conf.formData.onlinePayUrl = conf.editInfo.paymentData.onlinePayUrl
          break
        case 'SCAN_CODE_PAYMENT':
          conf.formData.scanCodePayName = conf.editInfo.paymentData.paymentName
          conf.formData.scanCodePayImgUrl = conf.editInfo.paymentData.paymentImgUrl
          conf.isShowImg = true
          break
        case 'USDT_PAYMENT':
          let obj = conf.protocolList.find((item: any) => item.name == conf.editInfo.paymentData.USDTAgreement)
          obj && conf.handleModalSelect('protocol', obj, true)
          conf.formData.onlinePayUrl = conf.editInfo.paymentData.USDTPayUrl
          break
        case 'BANK_CARD_PAYMENT':
          // 选择country => 巴西
          if (conf.editInfo.country == 'BR') {
            conf.formData.bankCardNum = conf.editInfo.paymentData.bankCardNum
            conf.formData.bankCardUserName = conf.editInfo.paymentData.bankCardUserName
            conf.formData.bankBranch = conf.editInfo.paymentData.bankBranch
          }
          // 选择country => 印度
          if (conf.editInfo.country == 'IN') {
            conf.formData.bankCardNum = conf.editInfo.paymentData.bankCardNum
            conf.formData.bankCardUserName = conf.editInfo.paymentData.bankCardUserName
            conf.formData.bankBranch = conf.editInfo.paymentData.bankBranch
            conf.formData.email = conf.editInfo.paymentData.email
          }
          break
      }
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    //获取国家列表数据
    getCountry() {
      System.loading()
      apis.getPayTrdCountry({
        success: (res: any) => {
          if (res.code == 200) {
            conf.countryList = res.data || []
            if (conf.isEditInfoShow && conf.editInfo.payDataType != 'USDT_PAYMENT') {
              let obj = conf.countryList.find((item: any) => item.countryCode == conf.editInfo.country)
              obj && conf.handleModalSelect('country', obj, true)
            }
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //获取支付方式列表数据
    getPayMethodList() {
      apis.payBindMethodList({
        success: (res: any) => {
          if (res.code == 200) {
            let datas = res.data || []
            conf.menthodsList = datas.filter((item: any) => {
              return item.payMethodCode != 'CASH_PAYMENT'
            })
            if (conf.isEditInfoShow) {
              let obj = conf.menthodsList.find((item: any) => item.payMethodCode == conf.editInfo.payDataType)
              obj && conf.handleModalSelect('methods', obj, true)
            }
          } else {
            System.toast(res.msg || 'fail')
          }
        }
      })
    },

    //获取手机区号列表数据
    getAreaCode() {
      System.loading()
      apis.areaCodelist({
        success: (res: any) => {
          if (res.code == 200) {
            conf.areaCodeList = res.data || []
            conf.formData.area_code = conf.areaCodeList[0]?.areaCode || ''
            conf.selectAreaCodeObj = conf.areaCodeList[0] || {}
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //打开modal
    handleOpenMadal(type: any) {
      switch (type) {
        //国家
        case 'country':
          conf.modalTitle = i18n.t('addBankCradModule.SelectCountry')
          break
        //支付方式
        case 'payment_methods':
          conf.modalTitle = i18n.t('addBankCradModule.SelectMethod')
          break
        //银行类型
        case 'bank_type':
          conf.modalTitle = i18n.t('addBankCradModule.SelectBankType')
          break
        //USDT协议
        case 'protocol':
          conf.modalTitle = i18n.t('addBankCradModule.SelectNetwork')
          break
      }
      conf.modalName = type
    },

    //关闭modal
    hideModal() {
      conf.modalName = undefined
    },

    //选择图片上传
    async handleSelectPhoto(file: any) {
      if (file.content.startsWith('data:image')) {
        System.loading()
        const res = await apis.upload({
          file: file.file,
          final: (_, res) => {
            System.loading(false)
          }
        })
        conf.formData.scanCodePayImgUrl = res.data.link
        conf.isShowImg = true
      }
    },

    //模态框数据选择
    handleModalSelect(type: any, obj: any, isEditShowInfo: any) {
      !isEditShowInfo && (conf.isEditInfoShow = false)
      switch (type) {
        //选择国家
        case 'country':
          conf.bankTypeList = []
          conf.formData.country = obj.showName
          conf.countryList?.forEach((item: any) => {
            item.isChecked = false
            item.countryCode == obj.countryCode && (item.isChecked = true)
          })
          conf.selectCountry = obj
          if (
            conf.selectMethodObj.payMethodCode &&
            conf.selectCountry.countryCode &&
            conf.selectMethodObj.payMethodCode != 'USDT_PAYMENT'
          ) {
            conf.formData.bank_type = ''
            conf.selectTypeObj = {}
            conf.getBankTypeData()
          }
          conf.selectAreaCodeObj.flagUrl = ''
          conf.selectAreaCodeObj = JSON.parse(JSON.stringify(obj))
          conf.formData.area_code = obj.areaCode
          // 编辑信息回显 && 选择country => 印度
          if (isEditShowInfo && conf.editInfo.country == 'IN') {
            conf.formData.mobile_phone = conf.editInfo.paymentData.mobile.replace(conf.formData.area_code, '')
          }

          if (conf.selectMethodObj.payMethodCode == 'BANK_CARD_PAYMENT' && !isEditShowInfo) {
            conf.formData.bankCardNum = ''
            conf.formData.bankCardUserName = ''
            conf.formData.bankBranch = ''
            conf.formData.mobile_phone = ''
            conf.formData.email = ''
            conf.formData.bankCardNum = ''
            conf.formData.bankCardUserName = ''
            conf.formData.bankBranch = ''
            conf.formData.bank_type = ''
            conf.selectTypeObj = {}
          }
          break
        //选择支付方式
        case 'methods':
          conf.selectMethodObj = obj
          conf.formData.payment_methods = obj.payMethodName
          conf.menthodsList?.forEach((item: any) => {
            item.isChecked = false
            item.payMethodCode == obj.payMethodCode && (item.isChecked = true)
          })
          if (conf.selectMethodObj.payMethodCode == 'BANK_CARD_PAYMENT') {
            conf.formData.onlinePayUrl = '' //线上支付地址
            conf.formData.onlinePayName = '' //线上支付账户名称
            conf.formData.protocol = '' //USDT协议
            conf.formData.scanCodePayImgUrl = '' //扫码支付二维码图片地址
            conf.formData.scanCodePayName = '' //扫码支付账户名称
          } else if (conf.selectMethodObj.payMethodCode == 'ONLINE_PAYMENT') {
            conf.formData.bankCardNum = '' //银行卡号
            conf.formData.bankCardUserName = '' //银行卡户名
            conf.formData.bankBranch = '' //银行支行
            conf.formData.mobile_phone = '' //手机号
            conf.formData.verification_code = '' //验证码
            conf.formData.protocol = '' //USDT协议
            conf.formData.scanCodePayImgUrl = '' //扫码支付二维码图片地址
            conf.formData.scanCodePayName = '' //扫码支付账户名称
          } else if (conf.selectMethodObj.payMethodCode == 'USDT_PAYMENT') {
            conf.formData.bankCardNum = '' //银行卡号
            conf.formData.bankCardUserName = '' //银行卡户名
            conf.formData.bankBranch = '' //银行支行
            conf.formData.mobile_phone = '' //手机号
            conf.formData.verification_code = '' //验证码
            conf.formData.scanCodePayImgUrl = '' //扫码支付二维码图片地址
            conf.formData.scanCodePayName = '' //扫码支付账户名称
          } else {
            conf.formData.bankCardNum = '' //银行卡号
            conf.formData.bankCardUserName = '' //银行卡户名
            conf.formData.bankBranch = '' //银行支行
            conf.formData.mobile_phone = '' //手机号
            conf.formData.verification_code = '' //验证码
            conf.formData.onlinePayUrl = '' //线上支付地址
            conf.formData.onlinePayName = '' //线上支付账户名称
            conf.formData.protocol = '' //USDT协议
          }

          if (
            conf.selectMethodObj.payMethodCode &&
            conf.selectCountry.countryCode &&
            conf.selectMethodObj.payMethodCode != 'USDT_PAYMENT'
          ) {
            conf.formData.bank_type = ''
            conf.selectTypeObj = {}
            conf.getBankTypeData()
          }

          if (conf.selectMethodObj.payMethodCode == 'USDT_PAYMENT') {
            conf.formData.bank_type = ''
            conf.selectTypeObj = {}
            conf.getBankTypeData()
          }
          break
        //选择银行类型
        case 'bankType':
          conf.selectTypeObj = obj
          conf.formData.bank_type = obj.bankName
          conf.bankTypeList?.forEach((item: any) => {
            item.isChecked = false
            item.id == obj.id && (item.isChecked = true)
          })
          // 编辑信息回显 && 选择country => 印度
          if (isEditShowInfo && conf.editInfo.country == 'BR') {
            conf.formData.mobile_phone = conf.editInfo.paymentData.mobile.replace(conf.formData.area_code, '')
            conf.formData.email = conf.editInfo.paymentData.email
          }
          break
        //选择USDT协议
        case 'protocol':
          conf.formData.protocol = obj.name
          conf.protocolList?.forEach((item: any) => {
            item.isChecked = false
            item.name == obj.name && (item.isChecked = true)
          })
          break
      }
      conf.hideModal()
    },

    //获取银行类型数据
    getBankTypeData() {
      System.loading()
      apis.getBankByCode({
        payTypeCode: conf.selectMethodObj.payMethodCode,
        payTrdCountry: conf.selectCountry.countryCode || '',
        success: (res: any) => {
          if (res.code == 200) {
            conf.bankTypeList = res.data || []
            if (conf.isEditInfoShow) {
              let obj = conf.bankTypeList.find((item: any) => item.bankName == conf.editInfo.bankName)
              obj && conf.handleModalSelect('bankType', obj, true)
            }
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //清空输入框
    handleClearInput(key: any) {
      conf.formData[key] = ''
    },

    // 手机区号picker => change事件
    bindChange(e: any) {
      conf.value = e.detail.value
    },

    // 手机区号picker取消btn
    handleAreaCodeCancel() {
      conf.modalName = undefined
    },

    // 手机区号picker确认btn
    handleAreaCodeConfirm() {
      let index = conf.value[0]
      conf.formData.area_code = conf.areaCodeList[index].areaCode
      conf.selectAreaCodeObj = conf.areaCodeList[index]
      conf.modalName = undefined
    },

    //获取验证码btn
    handleGetCode() {
      if (!conf.formData.mobile_phone) {
        System.toast(i18n.t('addBankCradModule.enterPhoneTip'))
        return
      }
      let str1 = eval('/' + conf.selectAreaCodeObj.phoneRule + '/')
      if (!str1.test(conf.formData.mobile_phone)) {
        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
        return
      }
      System.loading()
      apis.phoneCodeProduce({
        areaCode: conf.selectAreaCodeObj.areaCode,
        phone: conf.formData.mobile_phone,
        messageTail: 'login',
        success: (res: any) => {
          if (res.code == 200) {
            conf.handleCountdown()
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //倒计时
    handleCountdown() {
      if (conf.Countdown == 0) {
        conf.Countdown = 60
      } else {
        conf.Countdown -= 1
        setTimeout(conf.handleCountdown, 1000)
      }
    },

    // 数据提交
    handleDataSubmit() {
      let nullArr = ['payment_methods', 'bank_type'],
        newArr: any[] = []
      let obj = {
        payDataType: conf.selectMethodObj.payMethodCode,
        payBankId: conf.selectTypeObj.id,
        bankCode: conf.selectTypeObj.bankCode
      } as any
      if (conf.selectMethodObj.payMethodCode == 'BANK_CARD_PAYMENT') {
        if (conf.selectAreaCodeObj.countryCode == 'BR') {
          newArr = ['country', 'bankCardNum', 'bankCardUserName', 'bankBranch']
          obj = {
            country: conf.selectCountry.countryCode,
            bankCardNum: conf.formData.bankCardNum,
            bankCardUserName: conf.formData.bankCardUserName,
            bankBranch: conf.formData.bankBranch,
            mobile: conf.formData.area_code + conf.formData.mobile_phone,
            email: conf.formData.email,
            ...obj
          }
        } else if (conf.selectAreaCodeObj.countryCode == 'IN') {
          newArr = ['country', 'bankCardNum', 'bankCardUserName', 'bankBranch', 'mobile_phone', 'email']
          obj = {
            country: conf.selectCountry.countryCode,
            bankCardNum: conf.formData.bankCardNum,
            bankCardUserName: conf.formData.bankCardUserName,
            bankBranch: conf.formData.bankBranch,
            mobile: conf.formData.area_code + conf.formData.mobile_phone,
            email: conf.formData.email,
            ...obj
          }
        }
      } else if (conf.selectMethodObj.payMethodCode == 'ONLINE_PAYMENT') {
        newArr = ['country', 'onlinePayUrl', 'onlinePayName']
        obj = {
          country: conf.selectCountry.countryCode,
          onlinePayUrl: conf.formData.onlinePayUrl,
          onlinePayName: conf.formData.onlinePayName,
          ...obj
        }
      } else if (conf.selectMethodObj.payMethodCode == 'USDT_PAYMENT') {
        newArr = ['onlinePayUrl', 'protocol']
        obj = {
          usdtPayUrl: conf.formData.onlinePayUrl,
          // usdtPayName:conf.formData.onlinePayName,
          usdtAgreement: conf.formData.protocol,
          ...obj
        }
      } else {
        newArr = ['country', 'scanCodePayImgUrl', 'scanCodePayName']
        obj = {
          country: conf.selectCountry.countryCode,
          scanCodePayImgUrl: conf.formData.scanCodePayImgUrl,
          scanCodePayName: conf.formData.scanCodePayName,
          ...obj
        }
      }
      nullArr = [...nullArr, ...newArr]
      let isNull = false
      for (let key of nullArr) {
        !conf.formData[key] && (isNull = true)
      }
      if (isNull) {
        System.toast(i18n.t('addBankCradModule.formTip'))
        return
      }
      let str1 = eval('/' + conf.selectAreaCodeObj.phoneRule + '/')
      if (
        !str1.test(conf.formData.mobile_phone) &&
        conf.selectMethodObj.payMethodCode == 'BANK_CARD_PAYMENT' &&
        conf.selectAreaCodeObj.countryCode == 'IN'
      ) {
        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
        return
      }
      if (
        !str1.test(conf.formData.mobile_phone) &&
        conf.selectAreaCodeObj.countryCode == 'BR' &&
        conf.selectTypeObj.payTrdType == 'PHONE'
      ) {
        System.toast(i18n.t('addBankCradModule.correctphoneTip'))
        return
      }

      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (
        !regex.test(conf.formData.email) &&
        conf.selectMethodObj.payMethodCode == 'BANK_CARD_PAYMENT' &&
        conf.selectAreaCodeObj.countryCode == 'IN'
      ) {
        System.toast(i18n.t('addBankCradModule.correctEmailTip'))
        return
      }
      if (
        !regex.test(conf.formData.email) &&
        conf.selectAreaCodeObj.countryCode == 'BR' &&
        conf.selectTypeObj.payTrdType == 'EMAIL'
      ) {
        System.toast(i18n.t('addBankCradModule.correctEmailTip'))
        return
      }

      let apiUrl = null
      if (conf.isEditPage) {
        apiUrl = apis.modifyPaymentType
        obj.id = conf.editInfo.userPayMethodId
      } else {
        apiUrl = apis.bindPaymentType
      }
      sshake.shakeFunction({
        key: 'bindPaymentBtn',
        time: 2000,
        success: () => {
          // 点击按钮执行的操作
          System.loading()
          apiUrl({
            ...obj,
            success: (res: any) => {
              if (res.code == 200) {
                setTimeout(() => {
                  conf.goBack()
                }, 2000)
                System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
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
          System.toast(i18n.t('user.shakeTip'))
        }
      })
    }
  })

  onMounted(() => {
    if (!sapp.tempData.BankCardInfo && sapp.tempData.BankCardType === 'edit') {
      System.router.replace('/')
      return
    }
    conf.getCountry()
    conf.getPayMethodList()
    if (sapp.tempData.BankCardInfo) {
      conf.isEditPage = true
      conf.isEditInfoShow = true
      conf.editInfo = sapp.tempData.BankCardInfo
      conf.titleName = i18n.t('addBankCradModule.PaymentMethods')
      nextTick(() => {
        conf.handleEditInfoShow(conf.editInfo.payDataType)
      })
    }
  })

  return conf
}
