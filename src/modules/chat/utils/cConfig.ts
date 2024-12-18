import { capis } from '../api/index'
import csconfig from '../sstore/csconfig'
import cHttpConfig from './cHttpConfig'

export default class cConfig {
  static isInit = false
  static async init() {
    if (cConfig.isInit) return
    cConfig.isInit = true

    csconfig.initConfig()

    cHttpConfig.init()

    const data = await capis.businessLogin({
      'phoneNumber': '13111111234',
      'areaCode': '+86',
      'password': 'c82aef8ec4e9c18ca54745ebfa472b6e',
      'platform': 5
    })

    csconfig.setUserInfo(data)
  }
}
