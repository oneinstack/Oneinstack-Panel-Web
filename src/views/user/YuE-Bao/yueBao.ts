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
    walletlist: [] as any[],
    modalName: '',

    //请求查询余额宝币种
    // getcheckCoin(){
    // 	console.log
    // 	conf.$api.checkCoin({
    // 	data:{uid:sconfig.userInfo.uid}})
    // },

    //请求余额信息
    getInfo: async () => {
      conf.modalName = ''
      System.loading()
      const { data } = await apis.yebWalletDetail({
        uid: sconfig.userInfo.uid,
        complete: () => {
          System.loading(false)
        }
      })

      data.fixYearRate = Number(data.fixYearRate) <= 0 ? '0.0000' : data.fixYearRate
      conf.tableData = data
      data.totalNum = Number(data.totalBalance)
      conf.getWallet()
      
    },

    // 获取钱包余额
    getWallet: async () => {
      let arr = await svalue.getCoinlist()
      arr.forEach((item) => {
        if (item.isDefault) conf.coinlist = item
      })
      // 获取钱包余额
      const { data } = await apis.walletlist()
      conf.walletlist = data || []
      conf.walletlist?.forEach((item: any, itemIndex: number) => {
        let index = arr.findIndex((into: any) => into.coinCode == item.walletCoin)
        if (index != -1) {
          let obj = {
            ...arr[index],
            ...item
          }
          if(obj.isDefault) conf.coinlist = obj
          conf.walletlist[itemIndex] = obj
        }
      })
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
    conf.appInfo = await svalue.getAppConfiguration()
    conf.init()
  }
  onMounted(() => {
    init()
  })

  return conf
}
