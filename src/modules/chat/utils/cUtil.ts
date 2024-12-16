import { MessageType } from 'openim-uniapp-polyfill'
import csuser from '../sstore/csuser'

export const filterEmptyValue = (obj: any) => {
  for (let key in obj) {
    if (obj[key] === '') {
      delete obj[key]
    }
  }
}

export const conversationSort = (conversationList: any[]) => {
  const arr: any[] = []
  const filterArr = conversationList.filter((c: any) => !arr.includes(c.conversationID) && arr.push(c.conversationID))
  filterArr.sort((a: any, b: any) => {
    if (a.isPinned === b.isPinned) {
      const aCompare = a.draftTextTime > a.latestMsgSendTime ? a.draftTextTime : a.latestMsgSendTime
      const bCompare = b.draftTextTime > b.latestMsgSendTime ? b.draftTextTime : b.latestMsgSendTime
      if (aCompare > bCompare) {
        return -1
      } else if (aCompare < bCompare) {
        return 1
      } else {
        return 0
      }
    } else if (a.isPinned && !b.isPinned) {
      return -1
    } else {
      return 1
    }
  })
  return filterArr
}

export const formatHyperlink = (nickname: string, currentUserID: string) => {
  return `<a href="${currentUserID}" style="color:#0089FF; text-decoration:none;">${nickname}</a>`
}
export const parseAt = (atel: any, isParse = false) => {
  let mstr = atel.text
  const pattern = /@\S+\s/g
  const arr = mstr.match(pattern)
  const atUserList = atel.atUsersInfo ?? []
  arr?.map((match: any) => {
    const member = atUserList.find((user: any) => user.atUserID === match.slice(1, -1))
    if (member && !isParse) {
      mstr = mstr.replace(match, formatHyperlink(`@${member.groupNickname} `, member.atUserID))
    } else {
      mstr = mstr.replace(match, `@${member.groupNickname} `)
    }
  })
  return mstr
}

export const parseMessageByType = (pmsg: any, isNotify = false) => {
  const isSelf = (id: string) => id === csuser.selfInfo.userID
  const getName = (user: any) => {
    return user.userID === csuser.selfInfo.userID ? '你' : user.nickname
  }
  switch (pmsg.contentType) {
    case MessageType.TextMessage:
      return `${pmsg.senderNickname}：${pmsg.textElem.content}`
    case MessageType.AtTextMessage:
      return `${pmsg.senderNickname}：${parseAt(pmsg.atTextElem, true)}`
    case MessageType.PictureMessage:
      return `${pmsg.senderNickname}：[图片]`
    case MessageType.VideoMessage:
      return `${pmsg.senderNickname}：[视频]`
      return `${pmsg.senderNickname}：[表情]`
    case MessageType.FriendAdded:
      return '你们已经是好友了，开始聊天吧~'
    case MessageType.MemberEnter:
      const enterDetails = JSON.parse(pmsg.notificationElem.detail)
      const enterUser = enterDetails.entrantUser
      return `${getName(enterUser)}进入了群聊`
    case MessageType.GroupCreated:
      const groupCreatedDetail = JSON.parse(pmsg.notificationElem.detail)
      const groupCreatedUser = groupCreatedDetail.opUser
      return `${getName(groupCreatedUser)}创建了群聊`
    case MessageType.MemberInvited:
      const inviteDetails = JSON.parse(pmsg.notificationElem.detail)
      const inviteOpUser = inviteDetails.opUser
      const invitedUserList = inviteDetails.invitedUserList ?? []
      let inviteStr = ''
      invitedUserList.find((user: any, idx: number) => (inviteStr += getName(user) + '、') && idx > 3)
      inviteStr = inviteStr.slice(0, -1)
      return `${getName(inviteOpUser)}邀请了${inviteStr}${invitedUserList.length > 3 ? '...' : ''}进入群聊`

    case MessageType.MemberKicked:
      const kickDetails = JSON.parse(pmsg.notificationElem.detail)
      const kickOpUser = kickDetails.opUser
      const kickdUserList = kickDetails.kickedUserList ?? []
      let kickStr = ''
      kickdUserList.find((user: any, idx: number) => (kickStr += getName(user) + '、') && idx > 3)
      kickStr = kickStr.slice(0, -1)
      return `${getName(kickOpUser)}踢出了${kickStr}${kickdUserList.length > 3 ? '...' : ''}`
    case MessageType.MemberQuit:
      const quitDetails = JSON.parse(pmsg.notificationElem.detail)
      const quitUser = quitDetails.quitUser
      return `${getName(quitUser)}退出了群聊`
    case MessageType.GroupInfoUpdated:
      const groupUpdateDetail = JSON.parse(pmsg.notificationElem.detail)
      const groupUpdateUser = groupUpdateDetail.opUser
      let updateFiled = '群设置'
      if (groupUpdateDetail.group.groupName) {
        updateFiled = `群名称为 ${groupUpdateDetail.group.groupName}`
      }
      if (groupUpdateDetail.group.faceURL) {
        updateFiled = '群头像'
      }
      if (groupUpdateDetail.group.introduction) {
        updateFiled = '群介绍'
      }
      return `${getName(groupUpdateUser)}修改了${updateFiled}`
    case MessageType.GroupOwnerTransferred:
      const transferDetails = JSON.parse(pmsg.notificationElem.detail)
      const transferOpUser = transferDetails.opUser
      const newOwner = transferDetails.newGroupOwner
      return `${getName(transferOpUser)}将群主转让给${getName(newOwner)}`
    case MessageType.GroupDismissed:
      const dismissDetails = JSON.parse(pmsg.notificationElem.detail)
      const dismissUser = dismissDetails.opUser
      return `${getName(dismissUser)}解散了群聊`
    case MessageType.GroupNameUpdated:
      const groupNameUpdateDetail = JSON.parse(pmsg.notificationElem.detail)
      const groupNameUpdateUser = groupNameUpdateDetail.opUser
      return `${getName(groupNameUpdateUser)}修改了群名称为${groupNameUpdateDetail.group.groupName}`
    case MessageType.OANotification:
      const customNoti = JSON.parse(pmsg.notificationElem.detail)
      return customNoti.text
    default:
      return ''
  }
}
