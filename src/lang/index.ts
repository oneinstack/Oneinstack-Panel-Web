import System from '@/utils/System'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'en-us',
  messages: {}
})

export const langobj: any = {
  'en-us': 'US',
  'hi-IN': 'IN',
  'th-TH': 'TH',
  'id-ID': 'IDN',
  'pt-PT': 'PT',
  'es-ES': 'ES'
}

//@ts-ignore
i18n.setLang = async (lang: string = Cookie.get('language') || 'en-us') => {
  System.loading(true)
  const modules = import.meta.glob('@/lang/**/*.ts')
  const module: any = await modules[`/src/lang/${lang}.ts`]()
  i18n.global.setLocaleMessage(lang, module.default)
  i18n.global.locale = lang
  //@ts-ignore
  i18n.locale = lang
  Cookie.set('language', lang)
  System.loading(false)
}

//@ts-ignore
i18n.t = i18n.global.t

//@ts-ignore
i18n.locale = 'en-us'

export default i18n as any as {
  [key: string]: any
  /** 翻译 */
  t: (name: string) => any
  /** 设置语言 */
  setLang: (lang?: string) => Promise<void>
  /** 当前语言 */
  locale: string
}
