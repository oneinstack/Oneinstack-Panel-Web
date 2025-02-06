import IMSDK from 'openim-uniapp-polyfill'
import { reactive } from 'vue'

export const cscontact = reactive({
  friendList: [] as any[],
  blackList: [] as any[],
  groupList: [] as any[],
  getCheckedList: [] as any[],
  recvFriendApplications: [] as any[],
  sentFriendApplications: [] as any[],
  recvGroupApplications: [] as any[],
  sentGroupApplications: [] as any[],
  unHandleFriendApplicationNum: 0,
  unHandleGroupApplicationNum: 0,

  async getFriendList() {
    let offset = 0
    let friendInfoList: any[] = []
    let initialFetch = true
    while (true) {
      try {
        const count = initialFetch ? 10000 : 1000
        const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetFriendListPage, StrUtil.uuid(), {
          offset,
          count
        })
        friendInfoList = [...friendInfoList, ...data]
        offset += count
        if (data.length < count) break
        initialFetch = false
      } catch (error) {
        console.error('getFriendListPage error', error)
        break
      }
    }
    cscontact.friendList = friendInfoList
  },

  async getGroupList() {
    let offset = 0
    let groupList: any[] = []
    while (true) {
      try {
        const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetJoinedGroupListPage, StrUtil.uuid(), {
          offset,
          count: 1000
        })
        groupList = [...groupList, ...data]
        offset += 1000
        if (data.length < 1000) break
      } catch (error) {
        console.error('getGroupList error', error)
        break
      }
    }
    groupList.forEach((item) => {
      if (item.groupID) {
        let groupFace:any = Cookie.get('groupFaceList') || {}
        if(groupFace[item.groupID]) return item.faceURL = groupFace[item.groupID]
        IMSDK.asyncApi(IMSDK.IMMethods.GetGroupMemberList, IMSDK.uuid(), {
          groupID: item.groupID,
          filter: 0,
          offset: 0,
          count: 9
        }).then(({ data }: any) => {
          if (data.length) {
            item.faceURL = data.map((v: any) => v.faceURL)
            groupFace[item.groupID] = item.faceURL
            Cookie.set('groupFaceList', groupFace)
          }
        })
      }
    })
    cscontact.groupList = groupList
  },

  async getBlacklist() {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetBlackList, StrUtil.uuid(), {
        offset: 0,
        count: 1000
      })
      cscontact.blackList = data
    } catch (error) {
      console.error('getBlacklist error', error)
    }
  },

  async getRecvFriendApplications() {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetFriendApplicationListAsRecipient, StrUtil.uuid(), {
        offset: 0,
        count: 1000
      })
      cscontact.recvFriendApplications = data
      cscontact.unHandleFriendApplicationNum = data.filter(
        (application:any) =>
          application.handleResult === 0 ).length;
    } catch (error) {
      console.error('getRecvFriendApplications error', error)
    }
  },

  async getSentFriendApplications() {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetFriendApplicationListAsApplicant, StrUtil.uuid(), {
        offset: 0,
        count: 1000
      })
      cscontact.sentFriendApplications = data
    } catch (error) {
      console.error('getSentFriendApplications error', error)
    }
  },

  async getRecvGroupApplications() {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetGroupApplicationListAsRecipient, StrUtil.uuid(), {
        offset: 0,
        count: 1000
      })
      cscontact.recvGroupApplications = data
      cscontact.unHandleGroupApplicationNum = data.filter(
        (application:any) =>
          application.handleResult === 0
      ).length;
    } catch (error) {
      console.error('getRecvGroupApplications error', error)
    }
  },

  async getSentGroupApplications() {
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetGroupApplicationListAsApplicant, StrUtil.uuid(), {
        offset: 0,
        count: 1000
      })
      cscontact.sentGroupApplications = data
    } catch (error) {
      console.error('getSentGroupApplications error', error)
    }
  },

  pushNewFriend(friendInfo: any) {
    const idx = cscontact.friendList.findIndex((item) => item.userID === friendInfo.userID)
    if (idx === -1) {
      cscontact.friendList.push(friendInfo)
    }
  },

  updateFriendInfo(friendInfo: any, isRemove = false) {
    const idx = cscontact.friendList.findIndex((item) => item.userID === friendInfo.userID)
    if (idx !== -1) {
      if (isRemove) {
        cscontact.friendList.splice(idx, 1)
      } else {
        cscontact.friendList[idx] = { ...friendInfo }
      }
    }
  },

  pushNewBlack(blackInfo: any) {
    const idx = cscontact.blackList.findIndex((item) => item.userID === blackInfo.userID)
    if (idx === -1) {
      cscontact.blackList.push(blackInfo)
    }
  },

  updateBlackInfo(blackInfo: any, isRemove = false) {
    const idx = cscontact.blackList.findIndex((item) => item.userID === blackInfo.userID)
    if (idx !== -1) {
      if (isRemove) {
        cscontact.blackList.splice(idx, 1)
      } else {
        cscontact.blackList[idx] = { ...blackInfo }
      }
    }
  },

  pushNewGroup(groupInfo: any) {
    const idx = cscontact.groupList.findIndex((item) => item.groupID === groupInfo.groupID)
    if (idx === -1) {
      cscontact.groupList.push(groupInfo)
    }
  },

  updateGroupInfo(groupInfo: any, isRemove = false) {
    const idx = cscontact.groupList.findIndex((item) => item.groupID === groupInfo.groupID)
    if (idx !== -1) {
      if (isRemove) {
        cscontact.groupList.splice(idx, 1)
      } else {
        cscontact.groupList[idx] = { ...groupInfo }
      }
    }
  }
})

export default cscontact
