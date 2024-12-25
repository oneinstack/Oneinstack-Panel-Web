import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { onMounted, reactive, watch } from 'vue'

export const index = () => {
  const event = Scope.Event()
  const conf = reactive({
    search: {
      keyword: '',
      level: ''
    },
    detailData: [] as any[],
    pageNum: 1,
    pageSize: 10,
    total: 0,
    levelList: [
      { name: 'Level1', value: '1', isCheck: true },
      { name: 'Level2', value: '2', isCheck: false },
      { name: 'Level3', value: '3', isCheck: false },
      { name: 'Level4', value: '4', isCheck: false }
    ],
    userInfo: {} as any,
    saveInfo: {} as any,
    isLoading: false,
    defaultCoin: {} as any, //接口返回默认币种钱包

    //获取列表数据
    getData: async (type?: string) => {
      System.loading()
      const res = await apis.subsetPage({
        level: conf.search.level,
        current: conf.pageNum,
        search: conf.search.keyword,
        size: conf.pageSize,
        userId: conf.saveInfo.userId || conf.userInfo.userId,
        complete: () => {
          System.loading(false)
          conf.isLoading = true
        }
      })

      let datas = res.data || {}
      datas.records?.forEach((item: any) => {
        item.walletMoney = sutil.dataHandling(item.walletMoney)
        item.codes = sutil.dataHandling(item.codes)
      })
      if (type == 'clear') {
        conf.detailData = datas.records || []
      } else {
        conf.detailData = [...conf.detailData, ...datas.records]
      }

      conf.pageSize = datas.size || 10
      conf.total = datas.total || 0
    },

    moreMessage() {
      if (conf.pageSize * conf.pageNum >= conf.total) return
      conf.pageNum++
      conf.getData()
    },

    // input关键字搜索
    handleInputSearch() {
      conf.pageNum = 1
      conf.pageSize = 10
      conf.detailData = []
      conf.getData('clear')
    },

    //level -- click事件
    handleLevelChange(obj: any, index: number) {
      conf.pageNum = 1
      conf.pageSize = 10
      conf.detailData = []
      conf.levelList?.forEach((item) => {
        item.isCheck = false
        item.value == obj.value && (item.isCheck = true)
      })
      conf.search.level = obj.value
      conf.getData('clear')
    },

    //代理人信息 == 进入下一级
    handleNextLevel(obj: any) {
      let newObj = {
        userName: obj.userName,
        userId: obj.id,
        level: Number(conf.search.level) + 1
      }
      if (conf.search.level != '4') {
        System.router.push('/user/me/agencyCenter?obj=' + JSON.stringify(newObj))
      }
    },

    //点击头像事件 == 进入详情页
    handleCilckHeadSculpture(obj: any) {
      System.router.push('/user/me/agentView?userId=' + obj.id)
    }
  })

  watch(
    () => System.getRouterParams(),
    (newVal) => {
      const { obj } = newVal
      conf.saveInfo = obj ? JSON.parse(obj) : {}
      conf.levelList?.forEach((item) => {
        item.isCheck = false
        if (!conf.saveInfo.level) {
          conf.levelList[0].isCheck = true
          conf.search.level = '1'
        } else if (Number(item.value) == conf.saveInfo.level) {
          item.isCheck = true
        }
      })
      conf.detailData = []
      conf.getData()
    }
  )

  const init = async () => {
    const { obj } = System.getRouterParams()
    if (obj) {
      conf.saveInfo = JSON.parse(obj)
      conf.levelList?.forEach((item) => {
        item.isCheck = false
        if (Number(item.value) == conf.saveInfo.level) {
          item.isCheck = true
        }
      })
    }
    conf.userInfo = sconfig.userInfo
    await svalue.getCoinlist()
    conf.defaultCoin = svalue.coinlist.find((item) => item.isDefault)

    conf.search.level = conf.levelList.find((item) => item.isCheck)?.value || ''
    conf.getData()

    event.on(EPage.scrollBottom, conf.moreMessage)
  }
  onMounted(() => {
    init()
  })

  return conf
}
