import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import { svf } from '@/sstore/svf'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    showMoneyBox: false,
    showMoneyBox1: false,
    showMyTask: false,
    colors: '#F07336',
    navName: '',
    active: 1, //转入转出类型 (0 转出 1转入)
    changeMoney: '',
    code: '',
    shiftToMoney: '',
    rollOutMoney: '',
    type: undefined as any,
    tableData: {} as any,
    coinlist: [] as any[],
    defaultCoin: {} as any, //默认币种列表
    walletData: {} as any, //钱包
    tabCar: [
      {
        label: i18n.t('yueb.TransferIn'),
        value: 0,
        isClick: true
      },
      {
        label: i18n.t('yueb.Rollout'),
        value: 1,
        isClick: false
      }
    ],
    appInfo: {} as any,
    info: {} as any,
    vf: {} as any,
    //金额输入事件
    vfFun: (e: any, name: string) => {
      conf.vf[name](e)
      if (conf.active == 0 && parseFloat(conf.changeMoney) > parseFloat(conf.walletData.walletMoney)) {
        conf.changeMoney = conf.walletData.walletMoney
      } else if (conf.active == 1 && parseFloat(conf.changeMoney) > parseFloat(conf.tableData.totalBalance)) {
        conf.changeMoney = conf.tableData.totalBalance
      }
    },

    //请求提交 转入转出
    submit: async () => {
      let money = conf.changeMoney

      let infoTip = '',
        isShowTip = false

      if (!money) {
        isShowTip = true
        infoTip = i18n.t('common.PleaseEnter')
      }
      if (parseFloat(conf.changeMoney) == 0 && !conf.active) {
        isShowTip = true
        infoTip = i18n.t('yueb.tip1')
      }

      if (parseFloat(conf.changeMoney) == 0 && conf.active) {
        isShowTip = true
        infoTip = i18n.t('yueb.tip2')
      }

      if (isShowTip) {
        System.toast(infoTip)
        return
      }

      //转出的金额为负数
      if (conf.active == 1) {
        // 转出
        money = '-' + conf.changeMoney
      }
      let obj = {
        uid: sconfig.userInfo.uid,
        changeMoney: Number(money)
      }

      System.loading()
      const { code } = await apis.submit({
        ...obj,
        final: () => {
          System.loading(false)
        }
      })
      System.toast(i18n.t(`code.${code}`), 'success')

      setTimeout(() => {
        conf.changeBack(code)
        conf.getInfo()
      }, 300)
    },

    // 获取钱包余额
    getWallet: async () => {
      const { data } = await apis.walletlist()
      data.forEach((item: any) => {
        if (item.walletCoin == conf.defaultCoin.coinCode) {
          item.coinSymbol = conf.defaultCoin.coinSymbol
          conf.walletData = item
        }
      })
    },
    //获取余额宝-钱包信息
    getInfo: async () => {
      const { data } = await apis.yebWalletDetail({
        uid: sconfig.userInfo.uid
      })
      conf.tableData = data
      conf.getWallet()
    },
    changeActive(item: any) {
      conf.changeMoney = ''
      conf.tabCar.forEach((v) => {
        v.isClick = false
        item.value == v.value && (v.isClick = true)
        conf.type = item.value == 0 ? 'TransferInAmount' : 'TransferOutAmount'
      })
      conf.active = item.value
    },
    getTime() {
      var today = new Date() // 获取当前日期和时间
      var yesterday = new Date(today) // 创建一个副本，以便进行操作
      yesterday.setDate(today.getDate() - 1) // 设置副本的日期为昨天
      var yesterdayTimestamp = Math.floor(yesterday.getTime() / 1000)
      return yesterdayTimestamp
    },
    init() {
      conf.getInfo()
    },

    //返回
    changeBack(code: string) {
      conf.changeMoney = ''
    },
    // full按钮
    setMoney() {
      if (conf.active == 0) {
        conf.changeMoney = conf.walletData.walletMoney
      } else {
        conf.changeMoney = conf.tableData.totalBalance
      }
    }
  })

  const init = async () => {
    conf.vf = svf.getVf(conf, {
      changeMoney: {
        float: true,
        fixed: 4
      }
    })
    conf.info = await svalue.getAppConfiguration()
    conf.appInfo = await svalue.getAppConfiguration()
    conf.coinlist = await svalue.getCoinlist()
    conf.coinlist.forEach((item) => {
      if (item.isDefault) conf.defaultCoin = item
    })
    const option = System.getRouterParams()
    conf.active = option.type
    conf.tabCar.forEach((v) => {
      v.isClick = false
      option.type == v.value && (v.isClick = true)
      conf.type = option.type == 0 ? 'TransferInAmount' : 'TransferOutAmount'
    })
    conf.init()
  }
  onMounted(() => {
    init()
  })

  return {
    conf,
    sutil
  }
}
