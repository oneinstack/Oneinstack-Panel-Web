import { App } from 'vue'

export const install = (app: App) => {
  /** 清除cookie并保存需要保存的cookie */
  const clearAndSaveCookie = (_cookie: any, clearFun: Function) => {
    const noVlearValue = {
      'statusHeight': '',
      
      'bulletinDialogInfo': '',
      'bindDialogInfo': '',
      'PopNotifyDialogInfo': '',
      'signReminder': '',
      'gameMethod': '',
      'apiurl': '',
    } as any
    Object.keys(noVlearValue).forEach((key) => {
      let item = _cookie.get(key) || ''
      if (item) noVlearValue[key] = item
    })
    clearFun()
    Object.keys(noVlearValue).forEach((key) => {
      if (noVlearValue[key]) _cookie.set(key, noVlearValue[key])
    })
  }

  /** 如果浏览器支持localStorage，则将cookie的get、set、remove、clear方法指向localStorage的get、set、remove、clear方法 */
  if (localStorage) {
    Cookie.get = CookieL.get
    Cookie.set = CookieL.set
    Cookie.remove = CookieL.remove
    Cookie.clear = CookieL.clear
  } else {
    // 如果浏览器不支持localStorage，则将cookieL的localStorage指向cookie
    CookieL.localStorage = {
      getItem(key: string) {
        return Cookie.get(key)
      },
      setItem(key: string, value: any) {
        Cookie.set(key, value)
      },
      removeItem(key: string) {
        Cookie.remove(key)
      },
      clear() {
        Cookie.clear()
      }
    } as any
  }

  const _clearCookie = Cookie.clear
  Cookie.clear = () => {
    clearAndSaveCookie(Cookie, _clearCookie)
  }
}

export default {
  install
}
