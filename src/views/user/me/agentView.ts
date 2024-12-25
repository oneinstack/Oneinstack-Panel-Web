import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const event = Scope.Event()
  const datenow = Date.Format(Date.now(), 'yyyy-MM-dd').split('-')
  const conf = reactive({
    serviceHeiht: 300,
    detailData: [] as any,
    pageNum: 1,
    pageSize: 10,
    total: 0,
    userId: '',
    search: {
      start_date: '',
      end_date: ''
    } as any,
    isShowDate: false,
    dateType: '',
    selectDateArr: [] as any,
    startDateArr: datenow,
    endDateArr: datenow,

    //打开日期选择器
    handleOpenDate(type: any) {
      conf.isShowDate = true
      conf.dateType = type
      if (conf.dateType == 'start') {
        conf.selectDateArr = conf.startDateArr
      } else {
        conf.selectDateArr = conf.endDateArr
      }
    },

    //日期选择器 -- 取消btn
    handleCloseDate() {
      conf.isShowDate = false
    },

    // 日期清空
    handleClear(key: any) {
      conf.startDateArr = []
      conf.endDateArr = []
      conf.search[key] = ''
      conf.pageNum = 1
      conf.pageSize = 10
      conf.detailData = []
      conf.getData()
    },

    //日期选择器 -- 确认btn
    handleDateConfirm() {
      conf.isShowDate = false
      if (conf.dateType == 'start') {
        conf.startDateArr = conf.selectDateArr
      } else {
        conf.endDateArr = conf.selectDateArr
      }
      conf.pageNum = 1
      conf.pageSize = 10
      conf.detailData = []
      let num1 = null,
        num2 = null
      if (conf.dateType == 'start') {
        conf.search.start_date = conf.selectDateArr.join('-')
      } else {
        conf.search.end_date = conf.selectDateArr.join('-')
      }
      num1 = Date.parse(conf.search.start_date)
      num2 = Date.parse(conf.search.end_date)
      if (num1 > num2) {
        System.toast(i18n.t('agencyCenterModule.reselect'))
        conf.search.end_date = ''
        return
      }
      conf.search.start_date && conf.search.end_date && conf.getData()
    },

    //返回
    goBack() {
      sutil.pageBack()
    },

    //获取列表数据
    async getData() {
      System.loading()
      const { data: res } = await apis.subsetInfo({
        current: conf.pageNum,
        startTime: conf.search.start_date ? Date.parse(conf.search.start_date) : '',
        endTime: conf.search.end_date ? Date.parse(conf.search.end_date) : '',
        size: conf.pageSize,
        userId: conf.userId
      })
      conf.detailData = [...conf.detailData, ...res.records]
      conf.pageSize = res.size || 10
      conf.total = res.total || 0
      conf.detailData?.forEach((item: any) => {
        String(item.tradeStatus) == '-1' && (item.tradeStatus = 2)
        item.tradeStatusName = i18n.t(`tradeStatusList.${item.tradeStatus}`)
        item.tradeTypeName = i18n.t(`tradeType.${item.tradeType}`)
        //当地标准时间
        item.tradeTimenName = sutil.getTime(item.tradeTime)
        item.money = sutil.dataHandling(item.money)
        let obj = svalue.coinlist.find((into) => into.coinCode == item.walletCoin)
        item.coinSymbol = obj.coinSymbol
      })
      System.loading(false)
    },

    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) return
      conf.pageNum++
      conf.getData()
    }
  })

  onMounted(async () => {
    const option = System.getRouterParams()
    await svalue.getCoinlist()
    conf.userId = option.userId || ''
    conf.getData()
    event.on(EPage.scrollBottom, conf.moreMessage)
  })

  return conf
}
