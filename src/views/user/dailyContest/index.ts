import i18n from '@/lang'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'
import sconfig from '@/sstore/sconfig'


export const index = () => {
  const conf = reactive({
    prizePool: '1,710,987.11' as string,
    hours: '05' as string,
    minutes: '22' as string,
    seconds: '18' as string,
    lastChampion: {
      avatar: '/path/to/avatar.jpg',
      name: 'iluvmilkshake',
      profit: 'Profit(50%)',
      prize: '389,878.42'
    } as any,
    userInfo: {
      avatar: '/path/to/user-avatar.jpg',
      name: 'ldddggdhhsg',
      wager: '1554.02',
      position: '50th+',
      currentWager: '0.00'
    } as any,
    period: '2025/2/20 - 2025/2/21',
    leaderboard: [
      { player: 'SdDez...', wager: '90,309.80k', prize: '$389.73k', percent: '(50%)' },
      { player: 'aefgs...', wager: '64,137.79k', prize: '$194.86k', percent: '(25%)' },
      { player: 'SdDez...', wager: '90,309.80k', prize: '$389.73k', percent: '(50%)' },
      { player: 'aefgs...', wager: '64,137.79k', prize: '$194.86k', percent: '(25%)' },
      { player: 'SdDez...', wager: '90,309.80k', prize: '$389.73k', percent: '(50%)' },
      { player: 'aefgs...', wager: '64,137.79k', prize: '$194.86k', percent: '(25%)' },
      { player: 'SdDez...', wager: '90,309.80k', prize: '$389.73k', percent: '(50%)' },
      { player: 'aefgs...', wager: '64,137.79k', prize: '$194.86k', percent: '(25%)' },
    ] as any[],

    getRankIcon: (index: number) => {
      return '/static/theme/black/vip/small-badge-gold.png'
      //   return `/assets/images/contest/rank-${index + 1}.png`
    },

    viewHistory: () => {
      // 查看历史记录
    }

  })

  onMounted(() => {
  })

  return conf
}
