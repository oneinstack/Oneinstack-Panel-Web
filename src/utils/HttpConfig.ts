import i18n from '@/lang'
import sconfig from '@/sstore/sconfig'
import { Capacitor } from '@capacitor/core'
import { globalType } from '../../build/env/globalVar'
import System from './System'

export default class HttpConfig {
  static init(env: globalType) {
    //#ifvar-dev
    let apiurl = StrUtil.getParam(location.href).apiurl
    if (!apiurl) apiurl = Cookie.get('apiurl')
    if (apiurl) {
      Cookie.set('apiurl', apiurl)
    }
    if (Capacitor.isNativePlatform()) {
      env.API = 'https://demo.bggame.live'
    }
    //#endvar

    const funrun = (obj: any, fields: string[], ...data: any) => {
      fields.forEach((field) => {
        if (obj[field]) obj[field](...data)
      })
    }

    const error = (_code: number, config: any, xhr: any) => {
      let code = xhr.data?.code || _code
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
    http.setConfig({
      base: env.API,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic c2FiZXI6c2FiZXJfc2VjcmV0'
      },
      before(config) {
        config.param.headers = config.param.headers || {}

        //#ifvar-dev
        config.param.headers['apiurl'] = apiurl
        //#endvar

        Object.keys(config.data).forEach((key) => {
          const _str = config.data[key] + ''
          if (_str == 'undefined' || _str == 'null') {
            delete config.data[key]
          }
        })
        const token = sconfig.userInfo?.token
        token && (config.param.headers.Token = token)
        if (config.data?.json) {
          config.param.headers['Content-Type'] = 'application/json'
          delete config.data.json
        }
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
  }
}
