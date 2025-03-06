import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import sconfig from '@/sstore/sconfig'


export const index = () => {
  const conf = reactive({
    bronzeLevels: [
      { id: 2, name: 'VIP 02', xp: 100, icon: '/static/theme/black/vip/small-badge-bronze.png' },
      { id: 3, name: 'VIP 03', xp: 200, icon: '/static/theme/black/vip/small-badge-bronze.png' },
      { id: 4, name: 'VIP 04', xp: 1000, icon: '/static/theme/black/vip/small-badge-bronze.png' },
      { id: 5, name: 'VIP 05', xp: 2000, icon: '/static/theme/black/vip/small-badge-bronze.png' },
      { id: 6, name: 'VIP 06', xp: 3000, icon: '/static/theme/black/vip/small-badge-bronze.png' },
      { id: 7, name: 'VIP 07', xp: 4000, icon: '/static/theme/black/vip/small-badge-bronze.png' }
    ] as any[],
    otherGroups: [
      { id: 8, type: 'bronze', name: 'Bronze VIP 2-7', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 1, type: 'silver', name: 'Silver VIP 8-21', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 2, type: 'gold', name: 'Gold VIP 22-37', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 3, type: 'platinum1', name: 'Platinum I VIP 38-55', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 4, type: 'platinum2', name: 'Platinum II VIP 56-69', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 5, type: 'diamond1', name: 'Diamond I SVIP 1-15', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 6, type: 'diamond2', name: 'Diamond II SVIP 16-37', flagIcon: '/static/theme/black/vip/level-left.png' },
      { id: 7, type: 'diamond3', name: 'Diamond III SVIP 38-75', flagIcon: '/static/theme/black/vip/level-left.png' }
    ] as any[],
    openGroups: {
      bronze: true,
      silver: false,
      gold: false,
      platinum1: false,
      platinum2: false,
      diamond1: false,
      diamond2: false,
      diamond3: false,
    } as any,

    toggleGroup: (type: string) => {
      for (const key in conf.openGroups) {
        key != type && (conf.openGroups[key] = false)
      }
      conf.openGroups[type] = !conf.openGroups[type]
    }
  })


  onMounted(() => {

  })

  return conf
}
