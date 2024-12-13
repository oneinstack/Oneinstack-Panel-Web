import IMSDK from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
import csutil from './csutil'

export const csdk = reactive({
  initStore: () => {
    // this.$store.dispatch('user/getSelfInfo')
    // this.$store.dispatch('conversation/getConversationList')
    // this.$store.dispatch('conversation/getUnReadCount')
    // // this.$store.dispatch("contact/getFriendList");
    // // this.$store.dispatch("contact/getGrouplist");
    // this.$store.dispatch('contact/getBlacklist')
    // this.$store.dispatch('contact/getRecvFriendApplications')
    // this.$store.dispatch('contact/getSentFriendApplications')
    // this.$store.dispatch('contact/getRecvGroupApplications')
    // this.$store.dispatch('contact/getSentGroupApplications')
    // uni.switchTab({
    //   url: '/pages/conversation/conversationList/index?isRedirect=true'
    // })
  },
  Login: async () => {
    const csconfig = csutil.getStore('csconfig')
    console.log('开始登录', csconfig.userInfo.userID)
    await IMSDK.asyncApi(IMSDK.IMMethods.Login, IMSDK.uuid(), {
      userID: csconfig.userInfo.userID,
      token: csconfig.userInfo.imToken,
      platformID: 5,
      wsAddr: csconfig.config.wsUrl,
      apiAddr: csconfig.config.apiUrl
    })
      .then((res) => {
        console.log('登录成功-success', res)
      })
      .catch((err) => {
        console.log('登录失败-error', err)
      })
    csdk.setGlobalIMlistener()
  },
  setGlobalIMlistener: () => {
    IMSDK.subscribe(IMSDK.IMEvents.OnRecvNewMessage, (data) => {
      console.log('OnRecvNewMessage', data)
    })
  }
})

export default csdk
