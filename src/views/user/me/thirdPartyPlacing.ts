import { apis } from '@/api'
import i18n from '@/lang'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    navList: [
      {
        img: 'static/img/home/Live.png',
        name: i18n.t('home.live'),
        url: '/user/casino/index?type=Live',
        type: 'Live'
        // type: 'CASINO',
      },
      {
        img: 'static/img/home/Game.png',
        name: i18n.t('home.games'),
        url: '/user/casino/index?type=Games',
        type: 'Games'
        // type: 'SLOTS',
      },
      {
        img: 'static/img/home/Sports.png',
        name: i18n.t('home.chess'),
        url: '/user/casino/index?type=Chess',
        type: 'Chess'
      },
      {
        img: 'static/img/home/Sports.png',
        name: i18n.t('home.fish'),
        url: '/user/casino/index?type=Fishing',
        type: 'Fishing'
      }
      // {
      // 	img: 'static/img/home/Sports.png',
      // 	name: i18n.t('home.sports'),
      // 	url: '/user/sports/index',
      // 	type: 'Sports'
      // },

      // {
      // 	img: 'static/img/home/scratchOff.png',
      // 	name: i18n.t('home.scratch'),
      // 	url: '/user/scratch/scratch',
      // 	type: 'scratch',
      // 	// type: 'SCRATCH',
      // }
    ],
    timesList: [
      {
        value: 'today',
        label: i18n.t('invite.Today')
      },
      {
        value: 'yesterday',
        label: i18n.t('invite.Yesterday')
      },
      {
        value: 'sevenDays',
        label: i18n.t('invite.LastDays')
      }
    ],
    timeIndex: 'today',
    resultList: [] as any[],
    typeIndex: 'Live',
    coinCode: '',
    scrollHeight: 600,
    endTime: 0 as any,
    startTime: 0 as any,
    current: 1,
    size: 10,
    total: 0,
    showMore: false,
    //获取三方注单列表数据
    getLotteryResult(type: any) {
      apis.userBetRecord({
        coinCode: conf.coinCode,
        gameTypeCode: type,
        current: conf.current,
        size: conf.size,
        startTime: conf.startTime,
        endTime: conf.endTime,
        success: (res: any) => {
          let data = res.data.records
          conf.resultList = [...conf.resultList, ...data]
          conf.total = res.data.total
          if (conf.size * conf.current < conf.total) {
            conf.showMore = true
          } else {
            conf.showMore = false
          }
        }
      })
    },
    moreMessage() {
      if (conf.size * conf.current >= conf.total) return (conf.showMore = false)
      conf.current++
      conf.getLotteryResult(conf.typeIndex)
    },
    //tab 点击
    handleChangeTab(val: any, i: any) {
      conf.typeIndex = val.type
      conf.resultList = []
      conf.getLotteryResult(conf.typeIndex)
    },

    handleChangeTime(val: any, index: any) {
      conf.timeIndex = val.value
      let timeObj = sutil.getTimeRanges(conf.timeIndex)
      conf.startTime = timeObj.daystart
      conf.endTime = timeObj.daysEnd
      conf.getLotteryResult(conf.typeIndex)
    }
  })
  onMounted(async () => {
    //获取默认钱包币种
    let coinlist = await svalue.getCoinlist()
    let coin = coinlist.find((v) => v.isDefault)
    let timeObj = sutil.getTimeRanges('today')
    conf.startTime = timeObj.daystart
    conf.endTime = timeObj.daysEnd
    conf.coinCode = coin.coinCode
    conf.getLotteryResult(conf.typeIndex)
  })

  return conf
}
