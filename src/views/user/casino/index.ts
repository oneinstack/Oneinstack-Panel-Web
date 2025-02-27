import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { nextTick, onMounted, reactive } from 'vue'

export const index = ({ DGameTipRef }: any) => {
  const event = Scope.Event()

  const conf = reactive({
    title: '',
    setTitle() {
      const type = System.getRouterParams().type || 'Games'
      conf.title = (
        {
          'Games': i18n.t('casinoModule.titleName'),
          'Live': i18n.t('liveModule.titleName'),
          'Chess': i18n.t('home.chess'),
          'Fishing': i18n.t('home.fish')
        } as any
      )[type]
    },
    tabs: {
      list: [] as any[],
      active: 'All',
      change: (item: any) => {
        conf.tabs.active = item.gamePlatformCode
        conf.query.current = 1
        conf.list = []
        conf.nextPage()
      }
    },
    query: {
      current: 1,
      size: 10
    },
    initData: {} as any,
    loading: true,
    list: [] as any[],
    getData: async () => {
      System.loading()
      const res = await apis.getThirdGameList({
        deviceType: 1,
        final(status, config, xhr) {
          System.loading(false)
        }
      })
      conf.initData = {
        'All': res.data
      }
      res.data.forEach((item: any) => {
        conf.initData[item.gamePlatformCode] = conf.initData[item.gamePlatformCode] || []
        conf.initData[item.gamePlatformCode].push(item)
      })
      conf.tabs.list = Object.keys(conf.initData).map((item) => ({ gamePlatformCode: item }))
      console.log(conf.tabs.list);
      console.log(conf.initData);
      
      conf.nextPage()
    },
    nextPage: async () => {
      const _list = conf.initData[conf.tabs.active]
      if (conf.query.current * conf.query.size >= _list.length) {
        return
      }
      await nextTick()
      System.loading()
      conf.loading = true
      Timer.once(() => {
        System.loading(false)
        conf.loading = false
        conf.query.current++
        conf.list = [
          ...conf.list,
          ..._list.slice((conf.query.current - 1) * conf.query.size, conf.query.current * conf.query.size)
        ]
      }, 400)
    },
    //click游戏提示
    handleClickGameTip(item: any) {
      if (!sconfig.userInfo) {
        System.router.push('/login')
        return
      }
      if (sconfig.userInfo?.userType == 2) {
        DGameTipRef.value.showVisitor()
      } else {
        DGameTipRef.value.show(item)
      }
    }
  })
  const init = async () => {
    conf.getData()
  }
  onMounted(() => {
    conf.setTitle()
    init()
    event.on(EPage.scrollBottom, conf.nextPage)
  })

  return conf
}
