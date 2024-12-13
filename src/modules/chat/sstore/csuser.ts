import IMSDK from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
import { capis } from '../api'
import { filterEmptyValue } from '../utils/cUtil'

export const csuser = reactive({
  selfInfo: {} as any,
  authData: {} as any,
  isSyncing: false,
  getSelfInfo: async () => {
    const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetSelfUserInfo, StrUtil.uuid())
    const { users } = await capis.businessGetUserInfo(data.userID)
    const businessData = users[0] ?? {}
    filterEmptyValue(businessData)
    csuser.selfInfo = businessData
  },

  async updateBusinessInfo() {
    const { users } = await capis.businessGetUserInfo(csuser.selfInfo.userID)
    const businessData = users[0] ?? {}
    filterEmptyValue(businessData)
    csuser.selfInfo = {
      ...csuser.selfInfo,
      ...businessData
    }
  }
})

export default csuser
