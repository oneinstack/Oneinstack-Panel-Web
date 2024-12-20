import System from '@/utils/System'
import IMSDK, { GroupAtType, MessageType, SessionType } from 'openim-uniapp-polyfill'
import csconversation from '../sstore/csconversation'
import csmessage from '../sstore/csmessage'
import csuser from '../sstore/csuser'
import PinYin from './pinyin'

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
const regex = /\b(http[s]?:\/\/[^\s]+)\b/g
export const parseLink = (content: string) => content.replace(regex, (match: string) => formatHyperlink(match, match))

export const parseBr = (content: string) => {
  if (!content) {
    return ''
  }
  return content.replace(/\n/g, '\\n').trim()
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

const nomalTypes = [GroupAtType.AtAll, GroupAtType.AtAllAtMe, GroupAtType.AtMe]

export const markConversationAsRead = (conversation: any, fromChating = false) => {
  if (conversation.unreadCount !== 0) {
    IMSDK.asyncApi(IMSDK.IMMethods.MarkConversationMessageAsRead, IMSDK.uuid(), conversation.conversationID)
  }
  const isNomalAtType = nomalTypes.includes(conversation.groupAtType)
  if ((isNomalAtType && !fromChating) || (fromChating && conversation.groupAtType === GroupAtType.AtGroupNotice)) {
    IMSDK.asyncApi(IMSDK.IMMethods.ResetConversationGroupAtType, IMSDK.uuid(), conversation.conversationID)
  }
}
export const navigateToDesignatedConversation = (
  sourceID:any,
  sessionType:any,
  back2Tab = false,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data }:any = await IMSDK.asyncApi(
        IMSDK.IMMethods.GetOneConversation,
        IMSDK.uuid(),
        {
          sessionType,
          sourceID,
        },
      );
      prepareConversationState(data, back2Tab);
      resolve(data);
    } catch (e) {
      reject(e);
    }
  });
};

export const prepareConversationState = (conversation: any, back2Tab = false) => {
  markConversationAsRead(conversation)
  console.log(conversation);
  

  if (conversation.conversationType === SessionType.WorkingGroup) {
    csconversation.getCurrentGroup(conversation.groupID)
    csconversation.getCurrentMemberInGroup(conversation.groupID)
  }
  csmessage.resetMessageState()
  csconversation.currentConversation = {
    ...conversation
  }

  let url = `/chat/chating?back2Tab=${back2Tab}`
  if (conversation.conversationType === SessionType.Notification) {
    url = '/pages/conversation/notifyMessageList/index'
  }
  System.router.push(url)
}
export const formatChooseData = (data: any, key = 'nickname') => {
  const ucfirst = (l1: any) => {
    if (l1.length > 0) {
      var first = l1.substr(0, 1).toUpperCase()
      var spare = l1.substr(1, l1.length)
      return first + spare
    }
  }

  const arraySearch = (l1: any, l2: any) => {
    let Pinarr: any = PinYin
    for (let name in Pinarr) {
      if (Pinarr[name].indexOf(l1) != -1) {
        return ucfirst(name)
        break
      }
    }
    return false
  }

  const codefans = (l1: any) => {
    l1 = l1 ?? 'unkown'
    var l2 = l1.length
    var I1 = ''
    var reg = new RegExp('[a-zA-Z0-9- ]')
    for (var i = 0; i < l2; i++) {
      var val = l1.substr(i, 1)
      var name = arraySearch(val, PinYin)
      if (reg.test(val)) {
        I1 += val
      } else if (name !== false) {
        I1 += name
      }
    }
    I1 = I1.replace(/ /g, '-')
    while (I1.indexOf('--') > 0) {
      I1 = I1.replace('--', '-')
    }
    return I1
  }

  var arr = [],
    firstName

  for (var i = 0; i < data.length; i++) {
    firstName = data[i].initial = codefans(data[i][key]).substr(0, 1)
    arr.push(firstName.toUpperCase())
  }

  var arrlist = []
  for (i = 0; i < arr.length; i++) {
    if (arrlist.indexOf(arr[i]) == -1) {
      arrlist.push(arr[i])
    }
  }

  var dataSort = [] as any
  for (var i = 0; i < arrlist.length; i++) {
    dataSort[i] = {
      initial: arrlist[i]
    }
    dataSort[i].data = []
    for (var j = 0; j < data.length; j++) {
      if (data[j].initial.toUpperCase() == dataSort[i].initial) {
        dataSort[i].data.push(data[j])
      }
    }
  }
  for (var i = 0; i < dataSort.length - 1; i++) {
    for (var j = 1; j < dataSort.length - i; j++) {
      if (dataSort[j - 1].initial > dataSort[j].initial) {
        var a = dataSort[j]
        dataSort[j] = dataSort[j - 1]
        dataSort[j - 1] = a
      }
    }
  }
  const NomalInitial = 'QWERTYUIOPLKJHGFDSAZXCVBNM'.split('')
  const special = {
    initial: '#',
    data: []
  } as any
  const newFilterData = dataSort.filter((d: any) => {
    if (!NomalInitial.includes(d.initial)) {
      special.data = [...special.data, ...d.data]
    } else {
      return d
    }
  })
  if (special.data.length > 0) {
    newFilterData.push(special)
  }
  const indexList = newFilterData.map((item: any) => item.initial)
  const dataList = newFilterData.map((item: any) => item.data)
  return {
    indexList,
    dataList
  }
}

export const toastWithCallback = (message:any, callBack:any, duration = 1000) => {
  System.toast(message,"success")
  setTimeout(callBack, duration);
};


export const offlinePushInfo = {
  title: 'you have a new message',
  desc: 'you have a new message',
  ex: '',
  iOSPushSound: '',
  iOSBadgeCount: true
}

export const tipMessaggeFormat = (msg:any, currentUserID:any) => {
  const getName = (user:any) =>
    user.userID === currentUserID ? "你" : user.nickname;

  const getUserID = (user:any) => user.userID;

  const parseInfo = (user:any) => formatHyperlink(getName(user), getUserID(user));

  switch (msg.contentType) {
    case MessageType.FriendAdded:
      return `你们已经是好友了~`;
    case MessageType.GroupCreated:
      const groupCreatedDetail = JSON.parse(msg.notificationElem.detail);
      const groupCreatedUser = groupCreatedDetail.opUser;
      return `${parseInfo(groupCreatedUser)}创建了群聊`;
    case MessageType.GroupInfoUpdated:
      const groupUpdateDetail = JSON.parse(msg.notificationElem.detail);
      const groupUpdateUser = groupUpdateDetail.opUser;
      let updateFiled = "群设置";
      if (groupUpdateDetail.group.groupName) {
        updateFiled = `群名称为 ${groupUpdateDetail.group.groupName}`;
      }
      if (groupUpdateDetail.group.faceURL) {
        updateFiled = "群头像";
      }
      if (groupUpdateDetail.group.introduction) {
        updateFiled = "群介绍";
      }
      return `${parseInfo(groupUpdateUser)}修改了${updateFiled}`;
    case MessageType.GroupOwnerTransferred:
      const transferDetails = JSON.parse(msg.notificationElem.detail);
      const transferOpUser = transferDetails.opUser;
      const newOwner = transferDetails.newGroupOwner;
      return `${parseInfo(transferOpUser)}转让群主给${parseInfo(newOwner)}`;
    case MessageType.MemberQuit:
      const quitDetails = JSON.parse(msg.notificationElem.detail);
      const quitUser = quitDetails.quitUser;
      return `${parseInfo(quitUser)}退出了群组`;
    case MessageType.MemberInvited:
      const inviteDetails = JSON.parse(msg.notificationElem.detail);
      const inviteOpUser = inviteDetails.opUser;
      const invitedUserList = inviteDetails.invitedUserList ?? [];
      let inviteStr = "";
      invitedUserList.find(
        (user:any, idx:any) => (inviteStr += parseInfo(user) + "、") && idx > 3,
      );
      inviteStr = inviteStr.slice(0, -1);
      return `${parseInfo(inviteOpUser)} 邀请了${inviteStr}${
        invitedUserList.length > 3 ? "..." : ""
      }加入群聊`;
    case MessageType.MemberKicked:
      const kickDetails = JSON.parse(msg.notificationElem.detail);
      const kickOpUser = kickDetails.opUser;
      const kickdUserList = kickDetails.kickedUserList ?? [];
      let kickStr = "";
      kickdUserList.find(
        (user:any, idx:any) => (kickStr += parseInfo(user) + "、") && idx > 3,
      );
      kickStr = kickStr.slice(0, -1);
      return `${parseInfo(kickOpUser)} 踢出了${kickStr}${
        kickdUserList.length > 3 ? "..." : ""
      }`;
    case MessageType.MemberEnter:
      const enterDetails = JSON.parse(msg.notificationElem.detail);
      const enterUser = enterDetails.entrantUser;
      return `${parseInfo(enterUser)}加入了群聊`;
    case MessageType.GroupDismissed:
      const dismissDetails = JSON.parse(msg.notificationElem.detail);
      const dismissUser = dismissDetails.opUser;
      return `${parseInfo(dismissUser)}解散了群聊`;
    case MessageType.GroupNameUpdated:
      const groupNameUpdateDetail = JSON.parse(msg.notificationElem.detail);
      const groupNameUpdateUser = groupNameUpdateDetail.opUser;
      return `${parseInfo(groupNameUpdateUser)}修改了群名称为${
        groupNameUpdateDetail.group.groupName
      }`;
    case MessageType.OANotification:
      const customNoti = JSON.parse(msg.notificationElem.detail);
      return customNoti.text;
    default:
      return "";
  }
};