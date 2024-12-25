import { apis } from '@/api'
import { sconfig } from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    showMyTask: true,
    colors: '#F07336',
    tableData: {} as any,
    appInfo: {} as any,
    coinlist: {} as any,

    //请求查询余额宝币种
    // getcheckCoin(){
    // 	console.log
    // 	conf.$api.checkCoin({
    // 	data:{uid:sconfig.userInfo.uid}})
    // },

    //请求余额信息
    getInfo: async () => {
      System.loading()
      const { data } = await apis.yebWalletDetail({
        uid: sconfig.userInfo.uid,
        complete: () => {
          System.loading(false)
        }
      })

      data.fixYearRate = Number(data.fixYearRate) <= 0 ? '0.0000' : data.fixYearRate
      conf.tableData = data
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
    //右边icon
    gomytask() {
      System.router.push('/user/YuE-Bao/yebContent')
    },
    goto() {
      //跳转客服页面
      System.router.push('/user/service/service')
    },
    goPage(url: string) {
      System.router.push(url)
    },

    // 页面跳转
    handleIntoPage(type: number) {
      System.router.push('/user/YuE-Bao/shiftTo?type=' + type)
    }
  })

  const init = async () => {
    let obj = await svalue.getCoinlist()
    obj.forEach((item) => {
      if (item.isDefault) conf.coinlist = item
    })
    conf.appInfo = await svalue.getAppConfiguration()

    conf.init()
  }
  onMounted(() => {
    init()
  })

  return conf
}
