import System from '@/utils/System'
import IMSDK, { MessageReceiveOptType, MessageType, SessionType } from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
import { PageEvents } from '../constant'
import { conversationSort } from '../utils/cUtil'
import csconfig from './csconfig'
import cscontact from './cscontact'
import csconversation from './csconversation'
import csmessage from './csmessage'
import csuser from './csuser'

export const csdk = reactive({
  Login: async () => {
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
    csdk.initStore()
  },
  setGlobalIMlistener: () => {
    console.log('setGlobalIMlistener')
    // init
    const kickHander = (message: any) => {
      // toastWithCallback(message, () => {
      //   uni.removeStorage({
      //     key: "IMToken",
      //   });
      //   uni.removeStorage({
      //     key: "BusinessToken",
      //   });
      //   // Igexin.unbindAlias(this.storeCurrentUserID)
      //   uni.$u.route("/pages/login/index");
      // });
    }
    IMSDK.subscribe(IMSDK.IMEvents.OnConnectFailed, ({ errCode }) => {
      console.log('OnConnectFailed', errCode)
    })
    IMSDK.subscribe(IMSDK.IMEvents.OnConnecting, (data) => {
      console.log('OnConnecting', data)
    })
    IMSDK.subscribe(IMSDK.IMEvents.OnConnectSuccess, (data) => {
      console.log('OnConnectSuccess', data)
    })
    IMSDK.subscribe(IMSDK.IMEvents.OnKickedOffline, (data) => {
      console.log('OnKickedOffline', data)
      kickHander('您的账号在其他设备登录，请重新登陆！')
    })
    IMSDK.subscribe(IMSDK.IMEvents.OnUserTokenExpired, (data) => {
      console.log('OnUserTokenExpired', data)
      kickHander('您的登录已过期，请重新登陆！')
    })
    IMSDK.subscribe(IMSDK.IMEvents.OnUserTokenInvalid, (data) => {
      kickHander('您的登录已无效，请重新登陆！')
    })

    // sync
    const syncStartHandler = () => {
      System.loading()
      csuser.isSyncing = true
    }
    const syncFinishHandler = () => {
      System.loading(false)
      csconversation.getConversationList()
      cscontact.getFriendList()
      cscontact.getGroupList()
      csconversation.getUnReadCount()
      csuser.isSyncing = false
    }
    const syncFailedHandler = () => {
      System.loading(false)
      System.toast('同步消息失败')
      csconversation.getConversationList()
      csconversation.getUnReadCount()
      csuser.isSyncing = false
    }
    IMSDK.subscribe(IMSDK.IMEvents.OnSyncServerStart, syncStartHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnSyncServerFinish, syncFinishHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnSyncServerFailed, syncFailedHandler)

    // self
    const selfInfoUpdateHandler = ({ data }: any) => {
      // this.$store.commit("user/SET_SELF_INFO", {
      //   ...this.storeSelfInfo,
      //   ...data,
      // });
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnSelfInfoUpdated, selfInfoUpdateHandler)

    // message
    const newMessagesHandler = ({ data }: any) => {
      if (csuser.isSyncing) {
        return
      }
      const inCurrentConversation = (newServerMsg: any) => {
        const storeCurrentConversation = csconversation.currentConversation
        switch (newServerMsg.sessionType) {
          case SessionType.Single:
            return (
              newServerMsg.sendID === storeCurrentConversation.userID ||
              (newServerMsg.sendID === csuser.selfInfo.userID &&
                newServerMsg.recvID === storeCurrentConversation.userID)
            )
          case SessionType.WorkingGroup:
            return newServerMsg.groupID === storeCurrentConversation.groupID
          case SessionType.Notification:
            return newServerMsg.sendID === storeCurrentConversation.userID
          default:
            return false
        }
      }
      data.forEach((newServerMsg: any) => {
        if (inCurrentConversation(newServerMsg)) {
          const isSingleMessage = newServerMsg.sessionType === SessionType.Single

          if (isSingleMessage) {
            FunUtil.throttle(() => CEvent.emit(PageEvents.OnlineStateCheck), 2000)
          }

          if (newServerMsg.contentType === MessageType.TypingMessage) {
            if (isSingleMessage) {
              CEvent.emit(PageEvents.TypingUpdate)
            }
          } else {
            if (newServerMsg.contentType === MessageType.RevokeMessage) {
            } else {
              newServerMsg.isAppend = true
              csmessage.pushNewMessage(newServerMsg)
              setTimeout(() => CEvent.emit(PageEvents.ScrollToBottom, true))
            }
            FunUtil.debounce(() => {
              IMSDK.asyncApi(
                IMSDK.IMMethods.MarkConversationMessageAsRead,
                IMSDK.uuid(),
                csconversation.currentConversation.conversationID
              )
            }, 2000)
          }
        } else {
          if (newServerMsg.contentType !== MessageType.TypingMessage) {
            FunUtil.throttle(() => {
              const newMessageNotify = async (newServerMsg: any) => {
                if (csuser.isSyncing) {
                  return
                }

                const disableNotify = Cookie.get(`${csuser.selfInfo.userID}_DisableNotify`)
                if (disableNotify || csuser.selfInfo.globalRecvMsgOpt !== MessageReceiveOptType.Nomal) {
                  return
                }

                let cveItem = [...csconversation.conversationList, ...csconversation.cacheConversationList].find(
                  (conversation) => {
                    if (newServerMsg.sessionType === SessionType.WorkingGroup) {
                      return newServerMsg.groupID === conversation.groupID
                    }
                    return newServerMsg.sendID === conversation.userID
                  }
                )

                if (!cveItem) {
                  try {
                    const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetOneConversation, IMSDK.uuid(), {
                      sourceID: newServerMsg.groupID || newServerMsg.sendID,
                      sessionType: newServerMsg.sessionType
                    })
                    cveItem = data
                    csconversation.cacheConversationList = [...csconversation.cacheConversationList, data]
                  } catch (e) {
                    return
                  }
                }

                if (cveItem.recvMsgOpt !== MessageReceiveOptType.Nomal) {
                  return
                }
              }
              newMessageNotify(newServerMsg)
            }, 1000)
          }
        }
      })
    }
    const c2cReadReceiptHandler = ({ data: receiptList }: any) => {
      // if (receiptList[0].userID !== this.storeCurrentConversation.userID) {
      //   return;
      // }
      // receiptList.forEach((item) => {
      //   item.msgIDList.forEach((msgID) => {
      //     this.updateOneMessage({
      //       message: {
      //         clientMsgID: msgID,
      //       },
      //       type: UpdateMessageTypes.KeyWords,
      //       keyWords: {
      //         key: "isRead",
      //         value: true,
      //       },
      //     });
      //   });
      // });
    }
    const groupReadReceiptHandler = ({ data: receiptList }: any) => {
      // if (receiptList[0].groupID !== this.storeCurrentConversation.groupID) {
      //   return;
      // }
      // receiptList.forEach((item) => {
      //   item.msgIDList.forEach((msgID) => {
      //     const inlineMessage = this.storeHistoryMessageList.find(
      //       (message) => message.clientMsgID === msgID,
      //     );
      //     if (inlineMessage) {
      //       inlineMessage.attachedInfoElem.groupHasReadInfo.hasReadUserIDList =
      //         [
      //           ...(inlineMessage.attachedInfoElem.groupHasReadInfo
      //             .hasReadUserIDList ?? []),
      //           item.userID,
      //         ];
      //       // Members who join later in the workgroup will also send read receipts. Need filter.
      //       if (
      //         inlineMessage.attachedInfoElem.groupHasReadInfo
      //           .groupMemberCount -
      //           inlineMessage.attachedInfoElem.groupHasReadInfo.hasReadCount >
      //         1
      //       ) {
      //         inlineMessage.attachedInfoElem.groupHasReadInfo.hasReadCount += 1;
      //       }
      //       console.log({
      //         ...inlineMessage,
      //       });
      //       this.updateOneMessage({
      //         message: {
      //           ...inlineMessage,
      //         },
      //       });
      //     }
      //   });
      // });
    }
    const newRecvMessageRevokedHandler = ({ data: revokedMessage }: any) => {
      // if (!this.storeCurrentConversation.conversationID) {
      //   return;
      // }
      // this.updateOneMessage({
      //   message: {
      //     clientMsgID: revokedMessage.clientMsgID,
      //   },
      //   type: UpdateMessageTypes.KeyWords,
      //   keyWords: [
      //     {
      //       key: "contentType",
      //       value: MessageType.RevokeMessage,
      //     },
      //     {
      //       key: "notificationElem",
      //       value: {
      //         detail: JSON.stringify(revokedMessage),
      //       },
      //     },
      //   ],
      // });
      // this.updateQuoteMessageRevoke({
      //   clientMsgID: revokedMessage.clientMsgID
      // })
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnRecvNewMessages, newMessagesHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnRecvC2CReadReceipt, c2cReadReceiptHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnRecvGroupReadReceipt, groupReadReceiptHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnNewRecvMessageRevoked, newRecvMessageRevokedHandler)

    // friend
    const friendInfoChangeHandler = ({ data }: any) => {
      console.log('cim---friendInfoChangeHandler', data)
      // if (data.userID === this.storeCurrentConversation?.userID) {
      //   this.updateMessageNicknameAndFaceUrl({
      //     sendID: data.userID,
      //     senderNickname: data.nickname,
      //     senderFaceUrl: data.faceURL,
      //   });
      //   this.$store.commit(
      //     "conversation/SET_CURRENT_CONVERSATION",
      //     {...this.storeCurrentConversation, showName: data.nickname},
      //   );
      // }
      // console.log(this.storeConversationList)
      // this.updateFriendInfo({
      //   friendInfo: data,
      // });
    }
    const friendAddedHandler = ({ data }: any) => {
      // this.pushNewFriend(data);
    }
    const friendDeletedHander = ({ data }: any) => {
      // this.updateFriendInfo({
      //   friendInfo: data,
      //   isRemove: true,
      // });
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnFriendInfoChanged, friendInfoChangeHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnFriendAdded, friendAddedHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnFriendDeleted, friendDeletedHander)

    // blacklist
    const blackAddedHandler = ({ data }: any) => {
      // this.pushNewBlack(data);
    }
    const blackDeletedHandler = ({ data }: any) => {
      // this.updateBlackInfo({
      //   blackInfo: data,
      //   isRemove: true,
      // });
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnBlackAdded, blackAddedHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnBlackDeleted, blackDeletedHandler)

    // group
    const joinedGroupAddedHandler = ({ data }: any) => {
      // this.pushNewGroup(data);
    }
    const joinedGroupDeletedHandler = ({ data }: any) => {
      // this.updateGroupInfo({
      //   groupInfo: data,
      //   isRemove: true,
      // });
    }
    const groupInfoChangedHandler = ({ data }: any) => {
      // this.updateGroupInfo({
      //   groupInfo: data,
      // });
    }
    const groupMemberInfoChangedHandler = ({ data }: any) => {
      // if (data.groupID === this.storeCurrentConversation?.groupID) {
      //   this.updateMessageNicknameAndFaceUrl({
      //     sendID: data.userID,
      //     senderNickname: data.nickname,
      //     senderFaceUrl: data.faceURL,
      //   });
      //   this.updateCurrentMemberInGroup(data);
      // }
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnJoinedGroupAdded, joinedGroupAddedHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnGroupInfoChanged, groupInfoChangedHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler)

    // application
    const friendApplicationNumHandler = ({ data }: any) => {
      // const isRecv = data.toUserID === this.storeCurrentUserID;
      // if (isRecv) {
      //   this.pushNewRecvFriendApplition(data);
      // } else {
      //   this.pushNewSentFriendApplition(data);
      // }
    }
    const friendApplicationAccessHandler = ({ data }: any) => {
      // const isRecv = data.toUserID === this.storeCurrentUserID;
      // if (isRecv) {
      //   this.updateRecvFriendApplition({
      //     application: data,
      //   });
      // } else {
      //   this.updateSentFriendApplition({
      //     application: data,
      //   });
      // }
    }
    const groupApplicationNumHandler = ({ data }: any) => {
      // const isRecv = data.userID !== this.storeCurrentUserID;
      // if (isRecv) {
      //   this.pushNewRecvGroupApplition(data);
      // } else {
      //   this.pushNewSentGroupApplition(data);
      // }
    }
    const groupApplicationAccessHandler = ({ data }: any) => {
      // const isRecv = data.userID !== this.storeCurrentUserID;
      // if (isRecv) {
      //   this.updateRecvGroupApplition({
      //     application: data,
      //   });
      // } else {
      //   this.updateSentGroupApplition({
      //     application: data,
      //   });
      // }
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnFriendApplicationAdded, friendApplicationNumHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnFriendApplicationAccepted, friendApplicationAccessHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnFriendApplicationRejected, friendApplicationAccessHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnGroupApplicationAdded, groupApplicationNumHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnGroupApplicationAccepted, groupApplicationAccessHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnGroupApplicationRejected, groupApplicationAccessHandler)

    // conversation
    const totalUnreadCountChangedHandler = ({ data }: any) => {
      // if (this.storeIsSyncing) {
      //   return;
      // }
      // this.$store.commit("conversation/SET_UNREAD_COUNT", data);
    }
    const newConversationHandler = ({ data }: any) => {
      if (csuser.isSyncing) return
      csconversation.conversationList = [...data, ...csconversation.conversationList]
      conversationSort(csconversation.conversationList)
    }
    const conversationChangedHandler = ({ data }: any) => {
      if (csuser.isSyncing) {
        return
      }
      let filterArr = [] as any[]
      console.log(data)
      const chids = data.map((ch: any) => ch.conversationID)
      filterArr = csconversation.conversationList.filter((tc: any) => !chids.includes(tc.conversationID))
      const idx = data.findIndex((c: any) => c.conversationID === csconversation.currentConversation.conversationID)
      if (idx !== -1) csconversation.currentConversation = data[idx]
      const result = [...data, ...filterArr]
      csconversation.conversationList = conversationSort(result)
    }

    IMSDK.subscribe(IMSDK.IMEvents.OnTotalUnreadMessageCountChanged, totalUnreadCountChangedHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnNewConversation, newConversationHandler)
    IMSDK.subscribe(IMSDK.IMEvents.OnConversationChanged, conversationChangedHandler)
  },
  initStore: () => {
    csuser.getSelfInfo()
    csconversation.getConversationList()
    csconversation.getUnReadCount()
    cscontact.getFriendList()
    cscontact.getGroupList()
    cscontact.getBlacklist()
    cscontact.getRecvFriendApplications()
    cscontact.getSentFriendApplications()
    cscontact.getRecvGroupApplications()
    cscontact.getSentGroupApplications()
  }
})

export default csdk
