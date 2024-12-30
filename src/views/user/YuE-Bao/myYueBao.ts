import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    showMoneyBox: false,
    showMyTask: false,
    colors: 'initial',
    selectOpen: false,
    isShowDate: false,
    detailData: [] as any[],
    pageNum: 1,
    pageSize: 10,
    total: 0,
    moneyType: null as any,
    typeList: [
      {
        value: -1,
        name: i18n.t('yueb.All')
      },
      {
        value: 0,
        name: i18n.t('yueb.TransferIn')
      },
      {
        value: 1,
        name: i18n.t('yueb.Rollout')
      }
    ],
    selectTypeObj: {} as any,
    isOpenDate: false,
    selectDateArr: [] as any[],
    selectDateStr: '',
    tableData: {} as any,
    year: '' as any,
    month: '' as any,
    type: undefined as any,
    coinlist: {} as any,
    isShowMore: false,

    //初始化
    init() {
      conf.selectTypeObj = conf.typeList[0]
      const date = new Date()
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      conf.selectDateStr = year + '.' + (month >= 10 ? month : '0' + month)
      conf.selectDateArr = [year, month]
      conf.year = year
      conf.month = month
      conf.type = conf.selectTypeObj.value
      conf.getData()
      conf.getInfo()
    },

    //打开date模态框
    handleOpenDate() {
      conf.isOpenDate = true
      conf.selectOpen = false
    },

    //获取列表数据
    getData: async () => {
      System.loading()
      conf.isShowMore = false
      const { data } = await apis.balanceList({
        uid: sconfig.userInfo.uid,
        type: conf.type,
        year: conf.year,
        month: conf.month,
        current: conf.pageNum,
        size: conf.pageSize,
        final: () => {
          System.loading(false)
        }
      })

      conf.total = data.total
      data.records.forEach((item: any) => {
        item._createTime = new Date(item.createTime).Format()
        item.newBalance = item.newBalance
        item.changeMoney = item.changeMoney
        item._type = item.type == 1 ? i18n.t('yueb.TransferOutAmount') : i18n.t('yueb.TransferInAmount')
      })
      conf.detailData = [...data.records, ...conf.detailData]

      if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isShowMore = true)
    },

    // 分页
    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) return (conf.isShowMore = true)
      conf.pageNum++
      conf.getData()
    },

    //获取余额宝收益信息
    getInfo: async () => {
      const { data } = await apis.yebWalletDetail({
        uid: sconfig.userInfo.uid
      })

      data.coinSymbol = conf.coinlist.coinSymbol
      data._totalBalanceW = sutil.dataHandling(data.totalBalance)
      data._totalIncomeW = sutil.dataHandling(data.totalIncome)
      data.isMax = false
      data.isIncomeMax = false
      if (data._totalBalanceW.indexOf('K')) data.isMax = true
      if (data._totalIncomeW.indexOf('K')) data.isIncomeMax = true

      conf.tableData = data
    },

    // 余额宝类型选择click事件
    handleSelectType(item: any) {
      conf.selectTypeObj = item
      conf.selectOpen = false
      conf.pageNum = 1
      conf.pageSize = 10
      conf.detailData = []
      conf.type = conf.selectTypeObj.value
      conf.getData()
    },

    //top-right => click事件
    handleClickTopRight() {},

    //日期选择器 -- 确认btn
    handleConfirmDate(arr: any) {
      conf.selectDateStr = arr[0] + '.' + arr[1]
      conf.selectDateArr = arr
      conf.isOpenDate = false
      conf.pageNum = 1
      conf.pageSize = 10
      conf.detailData = []
      conf.year = arr[0]
      conf.month = arr[1]
      conf.getData()
    }
  })
  const init = async () => {
    let obj = await svalue.getCoinlist()
    obj.forEach((item) => {
      if (item.isDefault) conf.coinlist = item
    })
    conf.init()
  }
  onMounted(() => {
    init()
  })

  return conf
}
