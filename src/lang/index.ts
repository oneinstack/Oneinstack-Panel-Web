import { createI18n } from 'vue-i18n'
import zh from "./modules/zh-CN";
import en from "./modules/en-us";
import es from "./modules/es-ES";
import hi from "./modules/hi-IN";
import id from "./modules/id-ID";
import pt from "./modules/pt-PT";
import th from "./modules/th-TH";
const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    zh,
    en,
    es,
    hi,
    id,
    pt,
    th
  }
})

export const langObj: any = {
  'zh-CN': 'CN', //中文
  'en-us': 'US', //英语
  'hi-IN': 'IN', //印地语
  'th-TH': 'TH', //泰语
  'id-ID': 'IDN', //印度利西亚语
  'pt-PT': 'PT', //葡萄牙语
  'es-ES': 'ES' //西班牙语
}

//@ts-ignore
i18n.setLang = async (lang: string = Cookie.get('language') || 'zh-CN') => {
  const modules = import.meta.glob('@/lang/**/*.ts')
  // const module: any = await modules[`/src/lang/${lang}.ts`]()
  // i18n.global.setLocaleMessage(lang, module.default)
  i18n.global.locale = lang as any
  //@ts-ignore
  i18n.locale = lang
  Cookie.set('language', lang)
}

//@ts-ignore
i18n.t = i18n.global.t

//@ts-ignore
i18n.locale = 'zh-CN'

export default i18n as any as {
  [key: string]: any
  /** 翻译 */
  t: (name: string) => any
  /** 设置语言 */
  setLang: (lang?: string) => Promise<void>
  /** 当前语言 */
  locale: string,
}
