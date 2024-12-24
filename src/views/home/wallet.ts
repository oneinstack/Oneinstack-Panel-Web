import { apis } from '@/api'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import i18n from '@/lang'
import { onMounted, reactive } from 'vue'
import { Scope } from 'tools-vue3'
import { EPage } from '@/enum/Enum'

export const index = () => {
  const conf = reactive({
    openEye: 'open',
    total_money: 0,
    str_money: '******',
    swiperList: [] as any[], //货币列表
    userWalletList: [] as any[], //用户钱包列表
    detailData: [] as any[], //消费记录
    modalName: null,
    pageNum: 1,
    pageSize: 20,
    total: 0,
    isMore: false,
    noticeNum: 0, //小铃铛通知
    isRefash: false,
    scrollViewHeight: 300,
    isShowCustomPopup: false,
    addWalletInfo: {
      coinCode: ''
    },
    defaultCoin: {
      coinSymbol: '',
      coinCode: '',
      coinTousdt: ''
    }, //接口返回默认币种钱包
    list: [],
    cardCur: 100,
    showNumberBox: false,
    currentWallet: '',
    isShake: false,
    flag: false,
    defaultWalletInfo: {
      currentIndex: 0,
      coinCode: ''
    } as any,
    changeTotalEye() {
      conf.openEye = conf.openEye == 'open' ? 'close' : 'open'
      Cookie.set('showTotalWallet', conf.openEye)
    },
    handleNoticeClick() {},
    async cardSwiper(e: any) {
      conf.cardCur = e
      let val = conf.cardCur
      conf.pageNum = 1
      conf.detailData = []

      if (conf.swiperList[val]?.hasWallet) {
        // 更新钱包余额数据
        let wlist = await svalue.getWalletlist()
        let item = wlist.find((cur: any) => cur.walletCoin == conf.swiperList[val].walletCoin)
        if (item) conf.swiperList[val].walletMoney = item.walletMoney

        conf.defaultWalletInfo = conf.swiperList[val] || {}
        conf.defaultWalletInfo.currentIndex = val
        Cookie.set('currentWallet', conf.swiperList[val].coinCode)
        conf.pageNum = 1
        conf.detailData = []
        conf.getConsumptionRecords()
        // if (sconfig.userInfo.defaultWalletId != appObj.globalData.defaultWalletInfo.id) {
        // 	conf.handleDefaultwallet()
        // }
      }
    },
    handleAddWallet(e: any) {
      conf.isShowCustomPopup = true
      conf.addWalletInfo = e.obj
      conf.cardCur = e.index
    },
    //银行卡小眼睛click事件
    handleWalletEyeClick(obj: any, index: any) {
      conf.swiperList[index].openEye = !obj.openEye
      obj.hidden_amount = '*'.repeat(obj.coinTousdt.length)
    },
    handleDefaultwallet() {
      apis.defaultwallet({
        coinCode: conf.defaultWalletInfo.coinCode,
        success: (res: any) => {
          sconfig.userInfo.defaultWalletId = conf.defaultWalletInfo.id
          Cookie.set('userInfo', sconfig.userInfo)
        }
      })
    },
    handleLockClick() {},
    handleCilckImg(type: any, e: any) {
      conf.isRefash = true
      Cookie.set('userWalletList', conf.userWalletList)
      switch (type) {
        //充值
        case 'Recharge':
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
            coin: conf.defaultWalletInfo.walletCoin || conf.defaultWalletInfo.coinCode || coin,
            success: (res: any) => {
              if (res.data) {
                System.router.push('/user/wallet/withDraw')
              } else {
                conf.showNumberBox = true
              }
            }
          })
          break
        //转入
        case 'Shift-to':
          conf.modalName = e.currentTarget.dataset.target
          break

        //汇兑
        case 'Remittance':
          System.router.push('/user/wallet/exchange')
          break
        //中心钱包
        case 'CentralWallet':
          System.router.push('/user/wallet/centerWallet')
          break
      }
    },
    handleCloseBindDialog() {
      conf.showNumberBox = false
    },
    moreMessage() {
      conf.isMore = true
      if (conf.pageSize * conf.pageNum >= conf.total) {
        conf.isMore = false
        return
      }
      conf.pageNum++
      conf.getConsumptionRecords()
    },
    handleDetailView(obj: any) {
      conf.isRefash = false
      Cookie.set('DetailViewInfo', obj)
      System.router.push('/user/wallet/consumptionDetails?obj=' + obj)
    },
    getPopupData(res: boolean) {
      conf.isShowCustomPopup = res
    },
    //自定义父组件函数 ==> 添加钱包提交数据
    handleAddWlletSubmit() {
      apis.createwallet({
        coinCode: conf.addWalletInfo.coinCode,
        success: (res: any) => {
          System.toast(i18n.t(`code.${res.code}`), 'success')
          svalue.walletlist = []
          conf.isShowCustomPopup = false
          // conf.currentWallet = conf.addWalletInfo.coinCode
          conf.getWalletList(null, conf.addWalletInfo)
        }
      })
    },
    //获取用户钱包消费记录-转账记录
    async getConsumptionRecords() {
      let info = await svalue.getAppConfiguration()
      conf.isMore = false
      let addNumType = [1, 3, 5, 6, 8, 10, 12, 13, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33]
      //获取当前钱包的消费记录
      apis.trade({
        coinCode: conf.defaultWalletInfo.walletCoin || conf.defaultWalletInfo.coinCode,
        current: conf.pageNum,
        size: conf.pageSize,
        success: (res: any) => {
          res.data.records?.forEach((item: any) => {
            if (addNumType.includes(item.tradeType)) {
              item.symbol = ' + '
            } else {
              item.symbol = ' - '
            }
            item.tradeTypeName = i18n.t(`tradeType.${item.tradeType}`)
            if (item.tradeType == 13 || item.tradeType == 14 || item.tradeType == 15)
              item.tradeTypeName = info.app_name + ' ' + i18n.t(`tradeType.${item.tradeType}`)

            //当地标准时间
            item.tradeTime = sutil.getTime(item.tradeTime)

            item.money = sutil.dataHandling(item.money)

            //标识
            item.coinSymbol = ''
          })
          conf.detailData = [...conf.detailData, ...res.data.records]
          conf.total = res.data.total || 0
        }
      })
    },
    //获取用户钱包列表
    getWalletList(arr: any, obj: any) {
      if (arr == null) {
        arr = conf.swiperList
      }

      apis.walletlist({
        success: (res: any) => {
          conf.userWalletList = res.data || []
          conf.userWalletList?.forEach((item: any) => {
            let index = arr.findIndex((into: any) => into.coinCode == item.walletCoin)
            arr[index] = {
              ...item,
              ...arr[index]
            }
          })

          conf.total_money = 0
          let newArr = conf.swiperList || []
          arr.forEach((item: any, itemIndex: any) => {
            item.hasWallet = false
            if (item.hasOwnProperty('walletMoney')) {
              item.hasWallet = true
              // conf.$set(item,'openEye',true)
              item.defaultCoinMoney = sutil.division(
                sutil.Mul(item.walletMoney, conf.defaultCoin.coinTousdt),
                item.coinTousdt
              )
              conf.total_money = sutil.addNum(conf.total_money, item.defaultCoinMoney)

              item.hidden_amount = '*'.repeat(item.coinTousdt.length)

              if (newArr.length == 0) {
                item['openEye'] = true
              } else {
                item['openEye'] = newArr[itemIndex]?.openEyee
              }
            }
          })
          //当前钱包
          let newIndex = arr.findIndex((item: any) => item.coinCode == conf.currentWallet)
          if (newIndex != -1) {
            conf.cardCur = newIndex
          } else {
            conf.cardCur = arr.findIndex((item: any) => item.id == sconfig.userInfo.defaultWalletId)
          }
          if (conf.cardCur) {
            arr.unshift(...arr.splice(conf.cardCur, 1))
          }
          conf.swiperList = arr
          let val = conf.swiperList.findIndex((v) => v.coinCode == conf.addWalletInfo.coinCode)
          if (val != -1) {
            conf.defaultWalletInfo = conf.swiperList[val] || {}
            conf.defaultWalletInfo.currentIndex = val
          }
        }
      })
    }
  })

  const init = async () => {
    let clist = await svalue.getCoinlist()
    conf.defaultWalletInfo = await svalue.getDefaultWallet()
    conf.swiperList = clist.filter((v) => v.isOpen)
    conf.defaultCoin = clist.find((item) => item.isDefault)
    conf.currentWallet = conf.defaultWalletInfo.coinCode
    conf.getWalletList(conf.swiperList, null)
    conf.getConsumptionRecords()
    conf.openEye = Cookie.get('showTotalWallet') || 'open'
    // const res = await apis.getTime()
    // const res1 = await apis.signinRecordList({
    //   final: (config, xhr) => {
    //     console.log('config', config)
    //     console.log('xhr', xhr)
    //   }
    // })
  }
  onMounted(() => {
    System.loading(false)
    init()
  })
  const event = Scope.Event()
  event.on(EPage.scrollBottom, () => {
    conf.moreMessage()
  })

  return conf
}
