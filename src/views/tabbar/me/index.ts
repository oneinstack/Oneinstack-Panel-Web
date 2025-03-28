import { apis } from '@/api'
import i18n from '@/lang'
import sapp from '@/sstore/sapp'
import sconfig from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    isHeadFixed: false,
    userVipLevel:1,
    language: Cookie.get('language') || 'zh-CN',
    menu1: [
      {
        name: 'me.history',
        leftImg: '/static/img/result-history-new.png',
        icon: 'result-history',
        new: false,
        url: '/user/history/index',
      },
      {
        name: 'me.history',
        leftImg: '/static/img/result-history-new.png',
        icon: 'result-history',
        new: false,
        url: '',
      },
    ] as any[],

    handle(item: any) {
      item.url && System.router.push(item.url)
      item.func && item.func()
    },

    pageToSettings() {
      System.router.push('/user/setting/setting')
    },
  })
   
  onMounted(() => {

  })
  return conf
}
