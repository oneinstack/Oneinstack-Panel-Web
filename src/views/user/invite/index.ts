import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import { Scope } from 'tools-vue3'

export const index = () => {
  const conf = reactive({
    blackTopMenu:[
      {
        name:'Dashboard',
        value:1,
      },
      {
        name:'My Reward',
        value:2,
      },
    ] as any,
    activeMenu:1 as number,
    userInfo: null as any,
    contentData: [] as any[],
    dataList: {
      downLineUserCount: {
        label: i18n.t('invite.TotalDownline'),
        value: '0',
        link: true,
        type: 0
      },
      registerUserCount: {
        label: i18n.t('invite.TotalRegistration'),
        value: '0',
        link: true,
        type: 1
      },
      firstRechargeUserCount: {
        label: i18n.t('invite.FirstDeposit'),
        value: '0',
        link: true,
        type: 3
      },
      rechargeUserCount: {
        label: i18n.t('invite.DepositMember'),
        value: '0',
        link: true,
        type: 2
      },
      withdrawsUserCount: {
        label: i18n.t('invite.WithdrawalMember'),
        value: '0',
        link: true,
        type: 4
      },
      betUserCount: {
        label: i18n.t('invite.VaildBetsBettors'),
        value: '0',
        link: true,
        type: 5
      },
      netProfitAmount: {
        label: i18n.t('invite.NetTotal'),
        value: '0'
      },
      rebatesAmount: {
        label: i18n.t('invite.TotalPromotion'),
        value: '0'
      },
      firstRechargeAmount: {
        label: i18n.t('invite.FirstDepositAmount'),
        value: '0'
      },
      rechargeAmount: {
        label: i18n.t('invite.TotalDeposit'),
        value: '0'
      },
      withdrawsAmount: {
        label: i18n.t('invite.TotalWithdrawal'),
        value: '0'
      },
      betAmount: {
        label: i18n.t('invite.ValidBetTotal'),
        value: '0'
      }
    } as any,
    coinSymbol: '',
    searchParams: {
      time1: null,
      time2: null,
      levels: null
    },
    startDateArr: [] as any[],
    endDateArr: [] as any[],
    isOpenSearch: false,
    isExpand: true,
    modifiedTime: '',

    async handleSelect({ interval, levels }: any) {
      conf.searchParams.time1 = interval.value ? interval.value[0] : null
      conf.searchParams.time2 = interval.value ? interval.value[1] : null
      conf.searchParams.levels = levels.length ? levels.map((item: any) => item.value).join() : null
    },

    handleMenuChange: (obj:any) => {
      conf.activeMenu = obj.value
    },

    getData: () => {
      FunUtil.throttle(conf.getDataFun)
    },

    getDataFun: async () => {
      const res = await apis.getSubUserDataStatistics({
        ...conf.searchParams
      })

      conf.modifiedTime = new Date().Format()
      for (let key in conf.dataList) {
        conf.dataList[key].value = typeof res.data[key] === 'string' ? sutil.dataHandling(res.data[key]) : res.data[key]
      }

      conf.contentData = []
      for (let key in conf.dataList) {
        conf.contentData.push(conf.dataList[key])
      }
    },

    //复制邀请码
    handleCopyCode() {
      let promoteCode = conf.userInfo.userInvitationCode //拿到想要复制的值
      StrUtil.copyText(location.origin + '/#/register?code=' + promoteCode)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    },

    //页面跳转
    handleIntoPage(url: string) {
      System.router.push(url)
    },

    hanldeClickLink({ label, type }: any) {
      System.router.push(`/user/invite/detail?type=${type}&title=${label}&params=${JSON.stringify(conf.searchParams)}`)
    }
  })

  const init = async () => {
    conf.userInfo = sconfig.userInfo
    conf.userInfo.userInvitationCode = conf.userInfo.userInvitationCode.toUpperCase()
    conf.coinSymbol = Cookie.get('defaultCoin')?.coinSymbol || ''
    conf.getData()
  }

  onMounted(() => {
    init()
  })
  Scope.setConf(conf)
  return conf
}
