import { EKey } from '@/enum/Enum'
import sconfig from '@/sstore/sconfig'
import { globalType } from '../../build/env/globalVar'
import System from './System'
import { HttpCode } from '@/enum/HttpCode'
import { formatHttpStatusMessage, resolveHttpErrorMessage } from '@/utils/http-error'

export default class HttpConfig {
  static init(env: globalType) {
    //#ifvar-dev
    let apiurl = StrUtil.getParam(location.href).apiurl
    if (!apiurl) apiurl = Cookie.get(EKey.apiurl)
    if (apiurl) {
      Cookie.set(EKey.apiurl, apiurl)
    }
    //#endvar

    const funrun = (obj: any, fields: string[], ...data: any) => {
      fields.forEach((field) => {
        if (obj[field]) obj[field](...data)
      })
    }

    const error = (_code: number, config: any, xhr: any) => {
      const isAcceptedSuccess =
        _code >= 200 &&
        _code < 300 &&
        (xhr?.data?.code === 0 || xhr?.data?.success === true)
      if (isAcceptedSuccess) {
        // tools-javascript currently routes non-200 2xx responses through its
        // error hook. Preserve correct HTTP semantics for 201/202 task APIs.
        funrun(config.data, ['final', 'success', 'complete'], xhr.data, config, xhr)
        return
      }

      let code = xhr?.data?.code ?? _code,
        msg = resolveHttpErrorMessage(xhr?.data, formatHttpStatusMessage(_code, xhr?.statusText))

      funrun(config.data, ['final', 'fail', 'complete'], _code == 200, config, xhr)
      if (config.param?.silentError) return
      if (_code === HttpCode.LOGIN_EXPIRED) {
        if (config.param?.ignoreUnauthorizedLogout) {
          return
        }
        System.er(msg || '登录已过期，请重新登录', { type: 'error' })
        sconfig.logout(true)
        return
      }
      switch (code) {
        case 'PASSWORD_CHANGE_REQUIRED':
          if (System.getRouterPath() !== '/first-login') {
            System.er('首次登录必须先修改初始密码', { type: 'warning' })
            System.router.replace('/first-login')
          }
          break
        case HttpCode.LOGIN_EXPIRED:
          System.er(msg, { type: 'error' })
          sconfig.logout(true)
          break
        case HttpCode.NETWORK_ERROR:
          System.er('网络异常，请稍后再试', { type: 'error' })
          break
        case HttpCode.REQUEST_TIMEOUT:
          System.er('请求超时，请稍后再试', { type: 'error' })
          break
        default:
          System.er(msg || formatHttpStatusMessage(_code, xhr?.statusText), { type: 'error' })
          break
      }
    }
    http.setConfig({
      base: env.API,
      headers: {},
      withCredentials: true,
      before(config) {
        config.param.headers = config.param.headers || {}

        //#ifvar-dev
        config.param.headers[EKey.apiurl] = apiurl
        //#endvar

        Object.keys(config.data).forEach((key) => {
          const _str = config.data[key] + ''
          if (_str == 'undefined' || _str == 'null') {
            delete config.data[key]
          }
        })
        const currentPath = System.getRouterPath()
        if (!sconfig.userInfo?.authenticated && !currentPath.includes('/login'))
          return System.router.replace('/login')
        if (config.data?.json) {
          config.param.headers['Content-Type'] = 'application/json'
          delete config.data.json
        }
        if (config.data?.ignoreUnauthorizedLogout !== undefined) {
          config.param.ignoreUnauthorizedLogout = config.data.ignoreUnauthorizedLogout
          delete config.data.ignoreUnauthorizedLogout
        }
        if (config.data?.silentError !== undefined) {
          config.param.silentError = config.data.silentError
          delete config.data.silentError
        }
      },
      after(xhr, config) {
        if (config.data?.isBlob) {
          const blob = new Blob([xhr.data], { type: 'application/octet-stream' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = config.data.filename
          a.click()
          window.URL.revokeObjectURL(url)
        }
        const { code } = xhr.data
        if (code === undefined) return
        if (code != 0) {
          error(code, config, xhr)
          throw new Error(resolveHttpErrorMessage(xhr.data, String(code)))
        }
        funrun(config.data, ['final', 'success', 'complete'], xhr.data, config, xhr)
      },
      error
    })
  }
}
