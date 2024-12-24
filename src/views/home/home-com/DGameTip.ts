import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    modalName: null as any,
    slider: {
      value: 0,
      maxVal: 200
    },
    currentWallet: {} as any,
    gameWallet: {} as any,
    clickGameInfo: {} as any,
    thirdGamesId: '',
    pathUrl: '',
    currentWalletDefault: {} as any,
    gameWalletDefault: {} as any,
    topInputValue: 0,
    bottomInputValue: 0,
    walletInfo: {} as any,

    handleIntoGames: async () => {
      System.loading()
      let item = await svalue.getDefaultWallet()
      conf.walletInfo = item
      const res = await apis.enterGame({
        coinCode: item.walletCoin, //默认钱包币种CODE
        gameCode: conf.clickGameInfo.gameCode, //游戏CODE
        platformId: conf.clickGameInfo.platformId, //所属平台ID
        gamePlatformCode: conf.clickGameInfo.gamePlatformCode,
        final: (status, config, xhr) => {
          System.loading(false)
        }
      })

      conf.modalName = null
      conf.thirdGamesId = ''
      conf.pathUrl = ''

      let datas = res.data
      if (datas.id) {
        conf.thirdGamesId = datas.id
        conf.currentWallet = datas.current
        conf.gameWallet = datas.game
        conf.currentWalletDefault = JSON.parse(JSON.stringify(datas.current))
        conf.gameWalletDefault = JSON.parse(JSON.stringify(datas.game))
        conf.slider.maxVal = parseInt(conf.currentWalletDefault.walletMoney)
        conf.modalName = 'selectMoney'
      }
    },
    handleSelectMoney: async () => {
      let moneyNum = parseFloat(conf.gameWallet.walletMoney)
      if (conf.slider.value == 0 && moneyNum > 1) {
        conf.pathUrl = conf.thirdGamesId
        conf.handleUrl()
        return
      }
      System.loading()
      await apis.thirdpartyTransfer({
        sourceGameCode: conf.currentWallet.code, //转出游戏CODE
        sourceGamePlatformId: conf.currentWallet.platformId, //转出游戏平台ID
        targetGameCode: conf.gameWallet.code, //转入游戏CODE
        targetGamePlatformId: conf.gameWallet.platformId, //转入游戏平台ID
        tradeAmount: conf.slider.value, //交易金额
        tradeCoinCode: conf.walletInfo.walletCoin, //交易钱包币种
        targetGamePlatformCode: conf.clickGameInfo.gamePlatformCode,
        sourceGamePlatformCode: conf.currentWallet.code,
        toast(code, xhr) {
          if (xhr.data.msg.indexOf('必须大于或等于1') != -1) {
            System.toast(i18n.t(`code.${98002}`))
          } else {
            System.toast(i18n.t(`code.${code}`))
          }
        },
        final(status, config, xhr) {
          System.loading(false)
        }
      })

      conf.pathUrl = conf.thirdGamesId
      conf.handleUrl()
    },
    handleUrl: () => {
      !conf.pathUrl && (conf.pathUrl = conf.thirdGamesId)
      svalue.openGameMethod(conf.pathUrl)
      conf.modalName = null
    },
    changeAll: () => {
      conf.slider.value = parseInt(conf.slider.maxVal + '')
      conf.currentWallet.walletMoney = sutil.numsub(conf.currentWalletDefault.walletMoney, conf.slider.value)
      conf.gameWallet.walletMoney = sutil.addNum(conf.gameWalletDefault.walletMoney, conf.slider.value)
    },
    input: (e: any) => {
      // 删除数字之外的字符
      // [^0-9.\s]
      let arr = e.target.value.match(/[^0-9]/g) || null
      let inputval = e.target.value.toString()
      if (arr) {
        for (let i = 0; i < arr.length; i++) {
          let index = inputval.indexOf(arr[i])
          inputval = inputval.split(arr[i]).join('')
        }
      }
      let inputNum: any = parseFloat(inputval) || ''
      inputval = inputNum > conf.slider.maxVal ? conf.slider.maxVal : inputval
      conf.currentWallet.walletMoney = sutil.numsub(conf.currentWalletDefault.walletMoney, inputval)
      conf.gameWallet.walletMoney = sutil.addNum(conf.gameWalletDefault.walletMoney, inputval)
      if (inputval > 0) inputval = parseInt(inputval)
      conf.slider.value = inputval
    }
  })
  onMounted(() => {})

  return conf
}
