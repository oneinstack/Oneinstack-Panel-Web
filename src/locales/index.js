import { createI18n } from 'vue-i18n'
// import messages from '@intlify/unplugin-vue-i18n/messages'
import en from './en'
import cn from './cn'
import Cookies from 'js-cookie'  // 引入js-cookie库来处理cookie
const i18n = createI18n({
  locale: Cookies.get('language') || 'cn',
  messages: {
    cn,
    en
  }
})

export default i18n
