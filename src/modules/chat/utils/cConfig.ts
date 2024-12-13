import csconfig from '../sstore/csconfig'
import cHttpConfig from './cHttpConfig'

export default class cConfig {
  static isInit = false
  static init() {
    if (cConfig.isInit) return
    cConfig.isInit = true

    csconfig.initConfig()
    csconfig.setUserInfo({
      userID: '4205415917',
      chatToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOiI0MjA1NDE1OTE3IiwiVXNlclR5cGUiOjEsIlBsYXRmb3JtSUQiOjAsImV4cCI6MTc0MTgzMTYzNCwibmJmIjoxNzM0MDU1NTc0LCJpYXQiOjE3MzQwNTU2MzR9.YJh4Bt9zzv1qsfM_0QpU31NXhU9KObifTLp8udr6Wzg',
      imToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOiI0MjA1NDE1OTE3IiwiUGxhdGZvcm1JRCI6NSwiZXhwIjoxNzQxODMxNjM0LCJpYXQiOjE3MzQwNTU2Mjl9.fJM7gzxMZLJTBMderCpUBLMKXSeSqDYW0y8kMLnoDu8'
    })

    cHttpConfig.init()
  }
}
