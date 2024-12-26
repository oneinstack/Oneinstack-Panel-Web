import { apis } from '@/api'
import { EPage } from '@/enum/Enum'
import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import { svalue } from '@/sstore/svalue'
import sweb from '@/sstore/sweb'
import System from '@/utils/System'
import { getPlatforms } from '@ionic/vue'
import { Scope } from 'tools-vue3'
import { onMounted, reactive } from 'vue'

export const index = () => {
    const conf = reactive({
        platform: [] as any[],
        logoImg: '',
        gridBlock: [] as any[],
        activityList: [] as any[],
        pageNum: 1,
        pageSize: 20,
        total: 0,
        languageId: '',
        tips: false,
        isLoading: true,
        datas: [] as any[],
        // 客服
        async handleClickServiceImg() {
          svalue.toService()
        },
        hanldeItemClick({ type, link }: any) {
          if (!sconfig.userInfo) return System.router.push('/login')
          if (type === 'luckyWheel' && sconfig.userInfo.userType === 2) return System.toast(i18n.t(`code.422`))
          if (type === 'checkIn') return conf.goSign()
          System.router.push(link)
        },
        // 获取签到数据
        goSign() {
          apis.signinRecordList({
            success: (res: any) => {
              conf.datas = res.data || []
              Cookie.set('signData', conf.datas)
              if (conf.datas.length == 0) {
                System.toast(i18n.t('signInModule.tips'))
              } else {
                System.router.push('/user/sign/sign')
              }
            }
          })
        },
        // 活动详情
        goContent(item: any) {
          if (item.activityType !== 2) return System.router.push('/user/promotion/detail?id=' + item.id)
          let str = item.pathUrl.charAt(0)
          if (str == '/') {
            System.router.push(item.pathUrl)
          } else {
            if (item.pathUrl.indexOf('http') != -1) {
              sweb.open(item.pathUrl)
            }
          }
        },
        getActivityBlock(config: any) {
          conf.gridBlock = [
            {
              img: 'static/img/promotions/checkIn.png',
              color: '#FF7A00',
              title: 'promotions.checkIn',
              desc: 'promotions.dailyRewards',
              link: 'checkin',
              type: 'checkIn'
            },
            {
              img: 'static/img/promotions/luckyBox.png',
              color: '#FF57A1',
              title: 'promotions.luckyBox',
              desc: 'promotions.luckyBoxDesc',
              link: '/user/luckybox/index',
              wait: !config['activity_treasure_box'],
              type: 'luckyBox'
            },
            {
              img: 'static/img/promotions/luckyWheel.png',
              color: '#FF5050',
              title: 'promotions.luckyWheel',
              desc: 'promotions.luckyWheelDesc',
              link: '/user/luckyWheel/index',
              wait: !config['activity_luckyWheel'],
              type: 'luckyWheel'
            }
          ]
          conf.gridBlock
            .sort((a, b) => {
              if (a && a.wait) return 1
              if (b && b.wait) return -1
              return 0
            })
            .push(null)
        },
        // 获取当前语言
        async getLanguageList() {
          let current: any = await svalue.currentLanguage()
          conf.getActivityList(current.id)
        },
        // 获取活动列表
        async getActivityList(languageId: string) {
          conf.languageId = languageId
          System.loading()
          apis.activityList({
            current: conf.pageNum,
            size: conf.pageSize,
            languageId,
            success: (res: any) => {
              if (res.data) {
                conf.activityList = [...conf.activityList, ...res.data.records]
                conf.total = res.data.total
              }
            },
            final: () => {
              System.loading(false)
              conf.isLoading = false
            }
          })
        },
        moreMessage() {
          if (conf.pageSize * conf.pageNum >= conf.total) return (conf.tips = true)
          conf.pageNum++
          conf.getActivityList(conf.languageId)
        }
      })
      conf.platform = getPlatforms()
      const init = async () => {
        const config = await svalue.getAppConfiguration()
        conf.getActivityBlock(config)
        conf.getLanguageList()
      }
      onMounted(() => {
        System.loading(false)
        init()
        // System.toast('错误提示 ')
        // Timer.once(() => {
        //   System.toast('成功提示 2', 'success')
        // }, 1000)
      })
      const event = Scope.Event()
      event.on(EPage.scrollBottom, () => {
        conf.moreMessage()
      })
    return conf
}

