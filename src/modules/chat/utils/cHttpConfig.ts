import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import System from '@/utils/System'
import csconfig from '../sstore/csconfig'

export default class cHttpConfig {
  static isInit = false
  static init(config: cConfigParam) {
    if (cHttpConfig.isInit) return
    cHttpConfig.isInit = true

    const funrun = (obj: any, fields: string[], ...data: any) => {
      fields.forEach((field) => {
        if (obj[field]) obj[field](...data)
      })
    }

    const error = (_code: number, config: any, xhr: any) => {
      let code = xhr?.data?.code || _code
      const msg = i18n.t(`code.${code}`)
      if (config.data.toast) config.data.toast(code, xhr, config)
      else System.toast(msg, 'error')
      funrun(config.data, ['final', 'fail', 'complete'], _code == 200, config, xhr)
      if (code == 401) {
        sconfig.logout()
        if (config.data.toLogin?.() !== false) {
          System.router.replace('/login')
        }
      }
    }
    const _http = httpBean()
    _http.setConfig({
      base: config.url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      before(config) {
        config.param.headers = config.param.headers || {}

        Object.keys(config.data).forEach((key) => {
          const _str = config.data[key] + ''
          if (_str == 'undefined' || _str == 'null') {
            delete config.data[key]
          }
        })
        csconfig.token && (config.param.headers.Token = csconfig.token)
      },
      after(xhr, config) {
        const { code } = xhr.data
        if (code != 200) {
          error(code, config, xhr)
          return
        }
        funrun(config.data, ['final', 'success', 'complete'], xhr.data, config, xhr)
      },
      error
    })
    window.chttp = _http
  }
}
