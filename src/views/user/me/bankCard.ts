import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { computed, onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    bankCardList: [
      // {
      // 	bankLogo:'/static/img/minutes5.png',
      // 	paymentPlatformType:1,
      // 	paymentData:{
      // 		bankCode:'bankCode',
      // 		bankCardNum:'123456789',
      // 	},
      // },
    ] as any[],
    modalName: null,
    listTouchStart: 0,
    listTouchDirection: null as string | null,
    payObj: [],
    PayName: '',
    menthodsList: [] as any[],
    userPayMethodId: '',
    modalName2: null as string | null,
    modalShow: computed<boolean>({
      get: () => conf.modalName2 === 'deleteModal',
      set: (val: boolean) => {
        conf.modalName2 = val ? 'deleteModal' : null
      }
    }),

    // 鼠标移入移出事件
    handleMouseEvent(type: any, e: any) {
      switch (type) {
        case 'enter':
          conf.listTouchDirection = 'left'
          conf.modalName = e.currentTarget.dataset.target
          break
        case 'leave':
          conf.listTouchDirection = 'right'
          conf.modalName = null
          break
      }
    },

    getpayMethodList() {
      conf.menthodsList = [
        {
          img: '/static/img/banckCard3.png',
          payMethodCode: 'USDT_PAYMENT'
        },
        {
          img: '/static/img/banckCard5.png',
          payMethodCode: 'ONLINE_PAYMENT'
        },
        {
          img: '/static/img/banckCard7.png',
          payMethodCode: 'SCAN_CODE_PAYMENT'
        },
        {
          img: '/static/img/banckCard8.png',
          payMethodCode: 'BANK_CARD_PAYMENT'
        }
      ]
    },

    //获取银行卡列表
    loadBank() {
      System.loading()
      apis.userPaymentType({
        success: (res: any) => {
          if (res.code == 200) {
            conf.bankCardList = res.data || []
            conf.bankCardList?.forEach((item, index) => {
              let a = item.payDataType.indexOf('_')
              item._payDataType = item.payDataType.slice(0, a)
              item.paymentData = JSON.parse(item.paymentData)

              let arr = conf.menthodsList.findIndex((v: any) => {
                return v.payMethodCode == item.payDataType
              })
              item._banckCardImg = conf.menthodsList[arr].img
              if (item.paymentData.bankCardNum) {
                let str1 = item.paymentData.bankCardNum
                item.paymentData.newBankCardNum = sutil.plusXing(str1, 0, 4, '*')
              }
              if (item.paymentData.paymentName) {
                let str2 = item.paymentData.paymentName
                item.paymentData._paymentName = sutil.plusXing(str2, 0, 4, '*')
              }
              if (item.paymentData.onlinePayName) {
                let str3 = item.paymentData.onlinePayName
                item.paymentData.newOnlinePayName = sutil.plusXing(str3, 0, 4, '*')
              }
            })
          } else {
            System.toast(i18n.t(`code.${res.code}`) || 'fail')
          }
        },
        complete: () => {
          System.loading(false)
        }
      })
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    // ListTouch触摸开始
    ListTouchStart(e: any) {
      conf.listTouchStart = e.touches[0].pageX || e.clientX
    },

    // ListTouch计算方向
    ListTouchMove(e: any) {
      let val = e.touches[0]?.pageX || e.clientX
      conf.listTouchDirection = val - conf.listTouchStart > 0 ? 'right' : 'left'
    },

    // ListTouch计算滚动
    ListTouchEnd(e: any) {
      if (conf.listTouchDirection == 'left') {
        conf.modalName = e.currentTarget.dataset.target
      } else {
        conf.modalName = null
      }
      conf.listTouchDirection = null
    },

    // btns => click事件
    handleBtns(obj: any, type: any) {
      switch (type) {
        //编辑
        case 'edit':
          sapp.tempData.BankCardInfo = obj
          sapp.tempData.BankCardType = 'edit'
          System.router.push('/user/me/addBankCard')
          break
        //删除
        case 'delete':
          conf.modalName2 = 'deleteModal'
          conf.userPayMethodId = obj.userPayMethodId
          break
      }
    },

    // 确定删除该支付方式btn
    handleSureDelete() {
      apis.unbindPaymentType({
        userPaymentTypeId: conf.userPayMethodId,
        success: (res: any) => {
          conf.modalName2 = null
          if (res.code == 200) {
            System.toast(i18n.t(`code.${res.code}`) || 'success', 'success')
            conf.loadBank()
          } else {
            System.toast(i18n.t(`code.${res.code}`))
          }
        }
      })
    },

    // 添加银行卡
    handleAddBankCard() {
      sapp.tempData.BankCardInfo = null
      sapp.tempData.BankCardType = 'add'
      System.router.push('/user/me/addBankCard')
    }
  })

  onMounted(() => {
    conf.getpayMethodList()
    conf.loadBank()
  })

  return conf
}
