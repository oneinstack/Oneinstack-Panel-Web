import cHttpConfig from './cHttpConfig'

export default class cConfig {
  static isInit = false
  static init() {
    if (cConfig.isInit) return
    cConfig.isInit = true

    cHttpConfig.init()
  }
}
