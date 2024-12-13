import IMSDK from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
import csconfig from './csconfig'
import cscontact from './cscontact'
import csconversation from './csconversation'
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
    console.log("setGlobalIMlistener");
    // init
    const kickHander = (message:any) => {
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
    };
    IMSDK.subscribe(IMSDK.IMEvents.OnConnectFailed, ({ errCode }) => {
      console.log('OnConnectFailed', errCode)
    });
    IMSDK.subscribe(IMSDK.IMEvents.OnConnecting, (data) => {
      console.log('OnConnecting', data)
    });
    IMSDK.subscribe(IMSDK.IMEvents.OnConnectSuccess, (data) => {
      console.log('OnConnectSuccess', data)
    });
    IMSDK.subscribe(IMSDK.IMEvents.OnKickedOffline, (data) => {
      console.log('OnKickedOffline', data)
      kickHander("您的账号在其他设备登录，请重新登陆！");
    });
    IMSDK.subscribe(IMSDK.IMEvents.OnUserTokenExpired, (data) => {
      console.log('OnUserTokenExpired', data)
      kickHander("您的登录已过期，请重新登陆！");
    });
    IMSDK.subscribe(IMSDK.IMEvents.OnUserTokenInvalid, (data) => {
      kickHander("您的登录已无效，请重新登陆！");
    });

    // sync
    const syncStartHandler = () => {
      // uni.showLoading({
      //   title: "同步中",
      //   mask: true,
      // });
      // this.$store.commit("user/SET_IS_SYNCING", true);
    };
    const syncFinishHandler = () => {
      // uni.hideLoading();
      // this.$store.dispatch("conversation/getConversationList");
      // this.$store.dispatch("contact/getFriendList");
      // this.$store.dispatch("contact/getGrouplist");
      // this.$store.dispatch("conversation/getUnReadCount");
      // this.$store.commit("user/SET_IS_SYNCING", false);
    };
    const syncFailedHandler = () => {
      // uni.hideLoading();
      // uni.$u.toast("同步消息失败");
      // this.$store.dispatch("conversation/getConversationList");
      // this.$store.dispatch("conversation/getUnReadCount");
      // this.$store.commit("user/SET_IS_SYNCING", false);
    };
    IMSDK.subscribe(IMSDK.IMEvents.OnSyncServerStart, syncStartHandler);
    IMSDK.subscribe(IMSDK.IMEvents.OnSyncServerFinish, syncFinishHandler);
    IMSDK.subscribe(IMSDK.IMEvents.OnSyncServerFailed, syncFailedHandler);

    // self
    const selfInfoUpdateHandler = ({ data }:any) => {
      // this.$store.commit("user/SET_SELF_INFO", {
      //   ...this.storeSelfInfo,
      //   ...data,
      // });
    };

    IMSDK.subscribe(IMSDK.IMEvents.OnSelfInfoUpdated, selfInfoUpdateHandler);

    // message
    const newMessagesHandler = ({ data }:any) => {
      // if (this.storeIsSyncing) {
      //   return;
      // }
      // data.forEach(this.handleNewMessage);
    };
    const c2cReadReceiptHandler = ({ data: receiptList }:any) => {
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
    };
    const groupReadReceiptHandler = ({ data: receiptList }:any) => {
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
    };
    const newRecvMessageRevokedHandler = ({ data: revokedMessage }:any) => {
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
    };

    IMSDK.subscribe(IMSDK.IMEvents.OnRecvNewMessages, newMessagesHandler);
    IMSDK.subscribe(
      IMSDK.IMEvents.OnRecvC2CReadReceipt,
      c2cReadReceiptHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnRecvGroupReadReceipt,
      groupReadReceiptHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnNewRecvMessageRevoked,
      newRecvMessageRevokedHandler,
    );

    // friend
    const friendInfoChangeHandler = ({ data }:any) => {
      // console.log(data);
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
    };
    const friendAddedHandler = ({ data }:any) => {
      // this.pushNewFriend(data);
    };
    const friendDeletedHander = ({ data }:any) => {
      // this.updateFriendInfo({
      //   friendInfo: data,
      //   isRemove: true,
      // });
    };

    IMSDK.subscribe(
      IMSDK.IMEvents.OnFriendInfoChanged,
      friendInfoChangeHandler,
    );
    IMSDK.subscribe(IMSDK.IMEvents.OnFriendAdded, friendAddedHandler);
    IMSDK.subscribe(IMSDK.IMEvents.OnFriendDeleted, friendDeletedHander);

    // blacklist
    const blackAddedHandler = ({ data }:any) => {
      // this.pushNewBlack(data);
    };
    const blackDeletedHandler = ({ data }:any) => {
      // this.updateBlackInfo({
      //   blackInfo: data,
      //   isRemove: true,
      // });
    };

    IMSDK.subscribe(IMSDK.IMEvents.OnBlackAdded, blackAddedHandler);
    IMSDK.subscribe(IMSDK.IMEvents.OnBlackDeleted, blackDeletedHandler);

    // group
    const joinedGroupAddedHandler = ({ data }:any) => {
      // this.pushNewGroup(data);
    };
    const joinedGroupDeletedHandler = ({ data }:any) => {
      // this.updateGroupInfo({
      //   groupInfo: data,
      //   isRemove: true,
      // });
    };
    const groupInfoChangedHandler = ({ data }:any) => {
      // this.updateGroupInfo({
      //   groupInfo: data,
      // });
    };
    const groupMemberInfoChangedHandler = ({ data }:any) => {
      // if (data.groupID === this.storeCurrentConversation?.groupID) {
      //   this.updateMessageNicknameAndFaceUrl({
      //     sendID: data.userID,
      //     senderNickname: data.nickname,
      //     senderFaceUrl: data.faceURL,
      //   });
      //   this.updateCurrentMemberInGroup(data);
      // }
    };

    IMSDK.subscribe(
      IMSDK.IMEvents.OnJoinedGroupAdded,
      joinedGroupAddedHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnJoinedGroupDeleted,
      joinedGroupDeletedHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnGroupInfoChanged,
      groupInfoChangedHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnGroupMemberInfoChanged,
      groupMemberInfoChangedHandler,
    );

    // application
    const friendApplicationNumHandler = ({ data }:any) => {
      // const isRecv = data.toUserID === this.storeCurrentUserID;
      // if (isRecv) {
      //   this.pushNewRecvFriendApplition(data);
      // } else {
      //   this.pushNewSentFriendApplition(data);
      // }
    };
    const friendApplicationAccessHandler = ({ data }:any) => {
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
    };
    const groupApplicationNumHandler = ({ data }:any) => {
      // const isRecv = data.userID !== this.storeCurrentUserID;
      // if (isRecv) {
      //   this.pushNewRecvGroupApplition(data);
      // } else {
      //   this.pushNewSentGroupApplition(data);
      // }
    };
    const groupApplicationAccessHandler = ({ data }:any) => {
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
    };

    IMSDK.subscribe(
      IMSDK.IMEvents.OnFriendApplicationAdded,
      friendApplicationNumHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnFriendApplicationAccepted,
      friendApplicationAccessHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnFriendApplicationRejected,
      friendApplicationAccessHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnGroupApplicationAdded,
      groupApplicationNumHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnGroupApplicationAccepted,
      groupApplicationAccessHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnGroupApplicationRejected,
      groupApplicationAccessHandler,
    );

    // conversation
    const totalUnreadCountChangedHandler = ({ data }:any) => {
      // if (this.storeIsSyncing) {
      //   return;
      // }
      // this.$store.commit("conversation/SET_UNREAD_COUNT", data);
    };
    const newConversationHandler = ({ data }:any) => {
      // if (this.storeIsSyncing) {
      //   return;
      // }
      // const result = [...data, ...this.storeConversationList];
      // this.$store.commit(
      //   "conversation/SET_CONVERSATION_LIST",
      //   conversationSort(result),
      // );
    };
    const conversationChangedHandler = ({ data }:any) => {
      // if (this.storeIsSyncing) {
      //   return;
      // }
      // let filterArr = [];
      // console.log(data);
      // const chids = data.map((ch) => ch.conversationID);
      // filterArr = this.storeConversationList.filter(
      //   (tc) => !chids.includes(tc.conversationID),
      // );
      // const idx = data.findIndex(
      //   (c) =>
      //     c.conversationID === this.storeCurrentConversation.conversationID,
      // );
      // if (idx !== -1)
      //   this.$store.commit(
      //     "conversation/SET_CURRENT_CONVERSATION",
      //     data[idx],
      //   );
      // const result = [...data, ...filterArr];
      // this.$store.commit(
      //   "conversation/SET_CONVERSATION_LIST",
      //   conversationSort(result),
      // );
    };

    IMSDK.subscribe(
      IMSDK.IMEvents.OnTotalUnreadMessageCountChanged,
      totalUnreadCountChangedHandler,
    );
    IMSDK.subscribe(IMSDK.IMEvents.OnNewConversation, newConversationHandler);
    IMSDK.subscribe(
      IMSDK.IMEvents.OnConversationChanged,
      conversationChangedHandler,
    );
  
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
