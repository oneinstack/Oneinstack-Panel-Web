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
      'phoneNumber': '15519686068',
      'areaCode': '+86',
      'password': 'c6bd6cd028502d6e1f6f4fe21c7d53b9',
      'platform': 5
    })

    csconfig.setUserInfo(data)
  }
}
