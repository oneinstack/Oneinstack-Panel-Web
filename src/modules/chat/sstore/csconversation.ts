import IMSDK from 'openim-uniapp-polyfill'
import { reactive } from 'vue'

export const csconversation = reactive({
  conversationList: [] as any[],
  cacheConversationList: [] as any[],
  currentConversation: {} as any,
  unReadCount: 0,
  currentGroup: {} as any,
  currentMemberInGroup: {} as any,

  async getConversationList(isFirstPage = true) {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetConversationListSplit, StrUtil.uuid(), {
        offset: isFirstPage ? 0 : this.conversationList.length,
        count: 10
      })
      this.conversationList = isFirstPage ? [...data] : [...this.conversationList, ...data]
      return [...data]
    } catch (e) {
      console.error(e)
      this.conversationList = []
      return []
    }
  },

  delConversationByCID(conversationID: string) {
    const idx = this.conversationList.findIndex((conversation) => conversation.conversationID === conversationID)
    if (idx > -1) {
      this.conversationList.splice(idx, 1)
    }
  },

  async getCurrentGroup(groupID: string) {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetSpecifiedGroupsInfo, StrUtil.uuid(), [groupID])
      this.currentGroup = data[0] ?? {}
    } catch (e) {
      console.error(e)
      this.currentGroup = {}
    }
  },

  async getCurrentMemberInGroup(groupID: string, userID: string) {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetSpecifiedGroupMembersInfo, StrUtil.uuid(), {
        groupID,
        userIDList: [userID]
      })
      this.currentMemberInGroup = data[0] ?? {}
    } catch (e) {
      console.error(e)
      this.currentMemberInGroup = {}
    }
  },

  async getUnReadCount() {
    try {
      const res: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetTotalUnreadMsgCount, StrUtil.uuid())
      this.unReadCount = res.data
    } catch (e) {
      console.error(e)
    }
  },

  updateCurrentMemberInGroup(memberInfo: any) {
    if (
      memberInfo.groupID === this.currentMemberInGroup.groupID &&
      memberInfo.userID === this.currentMemberInGroup.userID
    ) {
      this.currentMemberInGroup = { ...memberInfo }
    }
  },

  resetConversationState() {
    this.currentMemberInGroup = {}
    this.currentGroup = {}
    this.currentConversation = {}
  }
})

export default csconversation
