import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, onUnmounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    divInfo: {} as any,
    tradeStatusList: [
      {
        name: i18n.t('otcOrderModule.statusList[2]'),
        value: -1
      },
      {
        name: i18n.t('consumptionDetails.trading'),
        value: 0
      },
      {
        name: i18n.t('otcOrderModule.statusList[1]'),
        value: 1
      },
      {
        name: i18n.t('consumptionDetails.BeingProcessed'),
        value: 3
      },
      {
        name: i18n.t('consumptionDetails.expired'),
        value: 4
      }
    ],
    //复制
    async handleCopyCode(val: any) {
      await StrUtil.copyText(val)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    }
  })
  const init = () => {
    conf.divInfo = Cookie.get('DetailViewInfo') //取出缓存数据

    //计算汇率
    let tradeObjPaymentInfo = JSON.parse(conf.divInfo.tradeObjPaymentInfo)
    conf.divInfo.exchangeRateNum = null
    if (tradeObjPaymentInfo.changeExchangeRate) {
      //当前
      let curren = Number(tradeObjPaymentInfo.walletExchangeRate)
      //目标
      let change = Number(tradeObjPaymentInfo.changeExchangeRate)
      let num: any = sutil.division(change, curren, false)
      let numTotal = parseFloat(num)
      num = tradeObjPaymentInfo.walletCoin == 'IDR' ? sutil.formatNumber(numTotal, 5) : sutil.formatNumber(numTotal)
      if (
        conf.divInfo.tradeType == 1 &&
        (tradeObjPaymentInfo.changeWalletCoin == 'USDT' || tradeObjPaymentInfo.walletCoin == 'USDT')
      ) {
        conf.divInfo.exchangeRateNum =
          tradeObjPaymentInfo.walletCoin + '/' + tradeObjPaymentInfo.changeWalletCoin + ' ' + num
      } else if (conf.divInfo.tradeType == 4 || conf.divInfo.tradeType == 5) {
        conf.divInfo.exchangeRateNum =
          tradeObjPaymentInfo.walletCoin + '/' + tradeObjPaymentInfo.changeWalletCoin + ' ' + num
      }
    }

    // USDT提现
    if (conf.divInfo.tradeType == 2 && tradeObjPaymentInfo.payCoin == 'USDT') {
      let num: any = sutil.division(conf.divInfo.changeExchangeRate, conf.divInfo.walletExchangeRate, false)
      let numTotal = parseFloat(num)
      num = conf.divInfo.walletCoin == 'IDR' ? sutil.formatNumber(numTotal, 5) : sutil.formatNumber(numTotal)
      conf.divInfo.exchangeRateNum = conf.divInfo.walletCoin + '/' + 'USDT' + ' ' + num
    }

    if (conf.divInfo?.tradeObjPaymentInfo) {
      conf.divInfo.tradeObjPaymentInfo = JSON.parse(conf.divInfo?.tradeObjPaymentInfo) || ''
      if (conf.divInfo.tradeObjPaymentInfo.onlinePayUrl) {
        let str = conf.divInfo.tradeObjPaymentInfo.onlinePayUrl
        conf.divInfo.tradeObjPaymentInfo.newOnlinePayUrl =
          str.substr(0, 3) + '***' + str.substr(str.split('').length - 3, str.split('').length)
      }
    } else {
      conf.divInfo.tradeObjPaymentInfo = ''
    }

    // tradeType == 1 => 充值状态
    if (conf.divInfo.tradeType == 1) {
      if (
        conf.divInfo.tradeStatus == 2 ||
        conf.divInfo.tradeStatus == 0 ||
        conf.divInfo.tradeStatus == 4 ||
        conf.divInfo.tradeStatus == 3 ||
        conf.divInfo.tradeStatus == 5 ||
        conf.divInfo.tradeStatus == 7
      ) {
        conf.divInfo.tradeStatusName = i18n.t('consumptionDetails.trading')
      } else if (conf.divInfo.tradeStatus == 1) {
        conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[1]')
      } else if (conf.divInfo.tradeStatus == 1 && conf.divInfo.recordMark == 1) {
        conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.dispute')
      } else {
        conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[2]')
      }
    } else if (conf.divInfo.tradeType == 2) {
      // tradeType == 2 => 提现状态
      if (
        conf.divInfo.tradeStatus == 0 ||
        conf.divInfo.tradeStatus == 2 ||
        conf.divInfo.tradeStatus == 3 ||
        conf.divInfo.tradeStatus == 4 ||
        conf.divInfo.tradeStatus == 5
      ) {
        conf.divInfo.tradeStatusName = i18n.t('consumptionDetails.trading')
      } else if (conf.divInfo.tradeStatus == 1) {
        conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[1]')
      } else {
        conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[2]')
      }
    } else {
      conf.divInfo.tradeStatusName =
        conf.tradeStatusList.find((item) => item.value == conf.divInfo.tradeStatus)?.name || ''
    }

    if (Number(conf.divInfo.tradeExamineStatus) == 0) {
      conf.divInfo.tradeExamineStatusName = i18n.t('consumptionDetails.InProgress')
    } else {
      conf.divInfo.tradeExamineStatusName =
        conf.tradeStatusList.find((item) => item.value == conf.divInfo.tradeExamineStatus)?.name || ''
    }
  }
  onMounted(() => {
    init()
  })
  onUnmounted(() => {
    Cookie.remove('DetailViewInfo') //销毁缓存数据
  })

  return conf
}
