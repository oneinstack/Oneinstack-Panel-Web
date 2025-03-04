import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { info } from 'node:console'
import { title } from 'node:process'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    commissionReward1: '$0.00',
    totalCommissionReceived: '$0.00',
    referralReward: '$0.00',
    totalReferralReceived: '$0.00',
    lockedRewards: '$0.00',
    currentTab: 'commission',
    dateRange: 'all',
    tableData: [
        {
          username: 'afhlVK',
          vipLevel: 'VIP 1',
          earned: '+$2,543.02',
          countryFlag: '/images/flags/us.png'
        },
        {
          username: 'afhlVK',
          vipLevel: 'VIP 1',
          earned: '+$2,543.02',
          countryFlag: '/images/flags/us.png'
        },
        {
          username: 'afhlVK',
          vipLevel: 'VIP 1',
          earned: '+$2,543.02',
          countryFlag: '/images/flags/us.png'
        }
    ] as any,
    activeTab:1 as number,
    infoPopupObj:{
      show:false as boolean,
      type:1 as number,
      title:'' as string,
      content:'' as string,
    },

    currentDate:['2025','01'] as any,
    minDate: new Date(2020, 0, 1),
    maxDate: new Date(2025, 5, 1),


    handleOpenPopup: (type:any) => {
      conf.infoPopupObj.show = true
      conf.infoPopupObj.type = type
      if(type == 1){
        conf.infoPopupObj.title = '佣金奖励'
      }else{
        conf.infoPopupObj.title = '推荐奖励'
      }
    },

    handlePicker: (type:any) => {
      conf.infoPopupObj.show = false
    },
  })

  onMounted(() => {

  })
  return conf
}
