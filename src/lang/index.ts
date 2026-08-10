import { EKey } from '@/enum/Enum'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'zh-CN',
  messages: {}
})

const supportedLocales = ['zh-CN', 'en-US']
const defaultLocale = 'zh-CN'
const languageModules = import.meta.glob('./modules/**/*.ts', { eager: true })

const localeMessages: Record<string, any> = {}

Object.entries(languageModules).forEach(([path, module]) => {
  const match = path.match(/\/modules\/([^/]+)\/([^/]+)\.ts$/)
  if (!match) return
  const [, moduleLocale, moduleName] = match
  if (!localeMessages[moduleLocale]) localeMessages[moduleLocale] = {}
  const value = (module as any).default
  if (moduleName === 'index') {
    Object.assign(localeMessages[moduleLocale], value)
    return
  }
  localeMessages[moduleLocale][moduleName] = value
})

const getModuleMessages = (lang: string) => {
  return localeMessages[lang] || {}
}

const normalizeLocale = (lang?: string) => {
  if (lang && supportedLocales.includes(lang)) return lang
  return defaultLocale
}

//@ts-ignore
i18n.setLang = async (lang: string = Cookie.get(EKey.language) || defaultLocale) => {
  const locale = normalizeLocale(lang)
  i18n.global.setLocaleMessage(locale, getModuleMessages(locale))
  i18n.global.locale = locale
  //@ts-ignore
  i18n.locale = locale
  Cookie.set(EKey.language, locale)
}

//@ts-ignore
i18n.t = i18n.global.t

//@ts-ignore
i18n.locale = defaultLocale

export default i18n as any as {
  [key: string]: any
  /** 翻译 */
  t: (name: string) => any
  /** 设置语言 */
  setLang: (lang?: string) => Promise<void>
  /** 当前语言 */
  locale: string
}
