import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    options: {
      betStatus: {
        0: 'toDrawn',
        1: 'losingLottery',
        2: 'prizeWinning',
        3: 'cancelledOrder'
      } as any,

      imgcolor: {
        0: 'color2',
        1: 'color-green',
        2: 'color-red',
        3: 'color-green',
        4: 'color-red',
        5: 'color1',
        6: 'color-red',
        7: 'color-green',
        8: 'color-red',
        9: 'color-green'
      } as any,

      twg: {
        0: { img: 'n0_bg', color: ['#fe565c', '#a943f7'] },
        1: { img: 'green_bg', color: '#2f9c61' },
        2: { img: 'red_bg', color: '#e93333' },
        3: { img: 'green_bg', color: '#2f9c61' },
        4: { img: 'red_bg', color: '#e93333' },
        5: { img: 'n5_bg', color: ['#4ccb86', '#a943f7'] },
        6: { img: 'red_bg', color: '#e93333' },
        7: { img: 'green_bg', color: '#2f9c61' },
        8: { img: 'red_bg', color: '#e93333' },
        9: { img: 'green_bg', color: '#2f9c61' }
      } as any
    },
    item: {} as any,
    getInfo: async () => {
      const _info = Cookie.get('betDetailInfo')
      if (_info) {
        conf.item = _info
      } else {
        System.router.replace('/')
      }
    }
  })
  onMounted(() => {
    conf.getInfo()
  })

  return conf
}
