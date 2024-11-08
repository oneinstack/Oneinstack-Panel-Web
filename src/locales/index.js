import { createI18n } from 'vue-i18n'
// import messages from '@intlify/unplugin-vue-i18n/messages'
import en from './en'
import cn from './cn'

const i18n = createI18n({
  locale: 'en',
  messages: {
    cn,
    en
  }
})

export default i18n
