import sutil from '@/sstore/sutil'
import { Scope } from 'tools-vue3'
import { reactive } from 'vue'

export const index = (theme?: string) => {
  const mconf = Scope.getConf()
  const conf = reactive({
    winnerInfoVoListInit: [] as any[],
    boxHeight: 5,
    winSlateNum: sutil.rem2px(120),
    show: false,

    //排行榜
    async getReception() {
      let datas = mconf.virtualData || {}
      conf.winnerInfoVoListInit = datas['10'] || []
      let imgArr
      switch (theme) {
        case 'blue':
          imgArr = [
            '/static/theme/blue/3D.webp',
            '/static/theme/blue/Color.webp',
            '/static/theme/blue/Satta.webp',
            '/static/theme/blue/5D.webp',
            '/static/theme/blue/PK10.webp',
            '/static/theme/blue/TRX.webp'
          ]
          break
        default:
          imgArr = [
            '/static/img/game/3D.png',
            '/static/img/game/Color.png',
            '/static/img/game/Satta.png',
            '/static/img/game/5D.png',
            '/static/img/game/PK10.png',
            '/static/img/game/TRX.png'
          ]
          break
      }
      let array = ['3D', 'CO', 'SA', '5D', 'PK', 'Tr']
      conf.winnerInfoVoListInit.forEach((item) => {
        const name = item.name.slice(1, 3)
        let randomIndex = array.indexOf(name)
        if (randomIndex == -1) randomIndex = 0
        item.winImg = imgArr[randomIndex]
      })

      conf.boxHeight = conf.winnerInfoVoListInit.length >= 5 ? 5 : conf.winnerInfoVoListInit.length
    }
  })

  return conf
}
