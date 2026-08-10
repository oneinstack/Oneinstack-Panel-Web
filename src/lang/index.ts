import { EKey } from '@/enum/Enum'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'

const supportedLocales = ['zh-CN', 'en-US']
const defaultLocale = 'zh-CN'
const languageModules = import.meta.glob('./modules/**/*.ts', { eager: true })
const localeMessages: Record<string, any> = {}

Object.entries(languageModules).forEach(([path, module]) => {
  const match = path.match(/\/modules\/([^/]+)\/([^/]+)\.ts$/)
  if (!match) return
  const [, moduleLocale, moduleName] = match
  if (!localeMessages[moduleLocale]) localeMessages[moduleLocale] = {}
  localeMessages[moduleLocale][moduleName] = (module as any).default
})

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  messages: localeMessages
})
const activeLocale = ref(defaultLocale)

const normalizeLocale = (lang?: string) => {
  if (lang && supportedLocales.includes(lang)) return lang
  return defaultLocale
}

//@ts-ignore
i18n.setLang = async (lang: string = Cookie.get(EKey.language) || defaultLocale) => {
  const locale = normalizeLocale(lang)
  i18n.global.locale = locale
  activeLocale.value = locale
  Cookie.set(EKey.language, locale)
}

//@ts-ignore
i18n.t = (...args: any[]) => {
  // Local translation helpers call this function directly, so explicitly track
  // the active locale to keep templates and computed labels reactive.
  activeLocale.value
  return (i18n.global.t as any)(...args)
}

Object.defineProperty(i18n, 'locale', {
  get: () => activeLocale.value,
  set: (locale: string) => {
    activeLocale.value = normalizeLocale(locale)
  }
})

export default i18n as any as {
  [key: string]: any
  /** 翻译 */
  t: (name: string) => any
  /** 设置语言 */
  setLang: (lang?: string) => Promise<void>
  /** 当前语言 */
  locale: string
}
