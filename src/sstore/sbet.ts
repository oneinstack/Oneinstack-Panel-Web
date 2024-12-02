import { reactive } from 'vue'

export const sbet = reactive({
  colorBetList: [] as any[],

  // 添加下注数据
  setColorBet(obj: any) {
    sbet.colorBetList.push(obj)
  },
  // 查询下注数据
  getColorBet(lotteryId: any, openExpect: any) {
    if (!sbet.colorBetList.length) return []
    let list = sbet.colorBetList.filter((item: any) => item.lotteryId == lotteryId && item.openExpect == openExpect)
    if (!list.length) sbet.colorBetList = sbet.colorBetList.filter((item: any) => item.lotteryId != lotteryId)
    return list
  },
  // 查询中奖信息
  getBetInfo(oldExpect: any, openNum: any) {
    let openNumInt = parseInt(openNum)
    // 查询上期是否有下注
    let list = sbet.colorBetList.filter((item: any) => item.openExpect == oldExpect)
    if (!list.length) return false
    // 查询是否有下注的号码中奖
    let betItem = list.filter((it: any) => it.betNum == openNum)
    if (betItem.length) return betItem[0]
    // 查询是否购买BIG
    let bIndex = list.findIndex((item: any) => item.betNum == 'BIG')
    if (bIndex != -1 && openNumInt > 4) return list[bIndex]
    // 查询是否购买SMALL
    let sIndex = list.findIndex((item: any) => item.betNum == 'SMALL')
    if (sIndex != -1 && openNumInt < 5) return list[sIndex]
    // 查询是否购买GREEN
    let gArr = [1, 3, 5, 7, 9]
    let gIndex = list.findIndex((item: any) => item.betNum == 'GREEN')
    if (gIndex != -1 && gArr.includes(openNumInt)) return list[gIndex]
    // 查询是否购买VIOLET
    let vArr = [0, 5]
    let vIndex = list.findIndex((item: any) => item.betNum == 'VIOLET')
    if (vIndex != -1 && vArr.includes(openNumInt)) return list[vIndex]
    // 查询是否购买RED
    let rArr = [0, 2, 4, 6, 8]
    let rIndex = list.findIndex((item: any) => item.betNum == 'RED')
    if (rIndex != -1 && rArr.includes(openNumInt)) return list[rIndex]
    return false
  }
})

export default sbet
