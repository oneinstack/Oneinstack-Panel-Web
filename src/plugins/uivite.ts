import uiVite from 'ui-vite'
import { App } from 'vue'
export const install = (app: App) => {
  app.use(uiVite)
  VConf.vicon.url = '/static/vicon'

  VConf.vicon.fun.getRes = async (url) => {
    let _val = Cookie.get(url)
    return _val || null
  }

  VConf.vicon.fun.setRes = (url, content) => {
    Cookie.set(url, content)
  }
  VConf.vicon.unit = 'rem'

  VConf.vsicon.url = '/static/vicon/svg'
  VConf.vsicon.lib = ''

  VConf.vsicon.fun.getRes = async (url) => {
    let _val = Cookie.get(url)
    return _val || null
  }

  VConf.vsicon.fun.setRes = (url, content) => {
    Cookie.set(url, content)
  }
  VConf.vsicon.unit = 'rem'
}

export default {
  install
}
