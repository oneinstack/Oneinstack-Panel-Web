import sutil from '@/sstore/sutil'
import IMSDK, { IMMethods, MessageItem, MessageStatus, MessageType } from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
import { UpdateMessageTypes } from '../constant'
import { offlinePushInfo } from '../utils/cUtil'
import csconversation from './csconversation'

interface MessageState {
  historyMessageList: any[]
  previewImageList: string[]
  hasMoreMessage: boolean
  quoteMessage?: any
}

export const csmessage = reactive({
  historyMessageList: [] as (MessageItem & { isme: boolean; noticeContent: string })[],
  previewImageList: [] as any[],
  hasMoreMessage: true,
  quoteMessage: undefined,

  async getHistoryMessageList(params: any) {
    let emptyFlag = true
    let lastMinSeq = 0
    try {
      const { data }: any = await IMSDK.asyncApi(IMSDK.IMMethods.GetAdvancedHistoryMessageList, StrUtil.uuid(), params)
      const isFirstPage = !params.startClientMsgID && !params.lastMinSeq
      const messages = data.messageList ?? []
      const imageList = filterPreviewImage(messages)
      emptyFlag = messages.length === 0
      lastMinSeq = data.lastMinSeq

      this.historyMessageList = [...messages, ...(isFirstPage ? [] : this.historyMessageList)]
      this.previewImageList = [...imageList, ...(isFirstPage ? [] : this.previewImageList)]

      this.hasMoreMessage = !data.isEnd && messages.length === 20
    } catch (e) {
      this.historyMessageList = []
    }
    return {
      emptyFlag,
      lastMinSeq
    }
  },

  pushNewPreviewImage(url: string) {
    this.previewImageList = [...this.previewImageList, url]
  },

  pushNewMessage(message: any) {
    if (message.contentType === MessageType.PictureMessage && message.status === MessageStatus.Succeed) {
      const imageList = filterPreviewImage([message])
      if (imageList.length > 0) {
        this.previewImageList = [...this.previewImageList, ...imageList]
      }
    }
    message.isme = true
    this.historyMessageList = [...this.historyMessageList, message]
  },

  updateOneMessage({ message, type = UpdateMessageTypes.Overall, keyWords = [], isSuccess = false }: any) {
    const idx = this.historyMessageList.findIndex((msg) => msg.clientMsgID === message.clientMsgID)
    if (idx !== -1) {
      if (type === UpdateMessageTypes.Overall) {
        if (message.contentType === MessageType.PictureMessage && isSuccess) {
          const imageList = filterPreviewImage([message])
          if (imageList.length > 0) {
            this.previewImageList = [...this.previewImageList, ...imageList]
          }
        }
        this.historyMessageList[idx] = { ...message }
      } else if (type === UpdateMessageTypes.KeyWords) {
        keyWords.forEach((field: any) => {
          //@ts-ignore
          this.historyMessageList[idx][field.key] = field.value
        })
      }
    }
  },

  deleteMessages(messages: any[]) {
    this.historyMessageList = this.historyMessageList.filter(
      (msg) => !messages.some((message) => msg.clientMsgID === message.clientMsgID)
    )
  },

  resetMessageState() {
    this.historyMessageList = []
    this.previewImageList = []
    this.hasMoreMessage = true
    this.quoteMessage = undefined
  },

  updateMessageNicknameAndFaceUrl({ sendID, senderFaceUrl, senderNickname }: any) {
    this.historyMessageList = this.historyMessageList.map((message: any) => {
      if (message.sendID === sendID) {
        message.senderFaceUrl = senderFaceUrl
        message.senderNickname = senderNickname
      }
      return message
    })
  },

  updateQuoteMessageRevoke({ clientMsgID }: any) {
    this.historyMessageList = this.historyMessageList.map((message: any) => {
      if (
        message.contentType === MessageType.QuoteMessage &&
        message.quoteElem?.quoteMessage?.clientMsgID === clientMsgID
      ) {
        return {
          ...message,
          quoteElem: {
            ...message.quoteElem,
            quoteMessage: {
              ...message.quoteElem.quoteMessage,
              contentType: 2101
            }
          }
        }
      }
      return message
    })
  },
  /**
   * 创建文本消息
   * @param content 消息内容
   * @returns 消息对象
   */
  createTextMessage: async (content: string) => {
    return await IMSDK.asyncApi(IMMethods.CreateTextMessage, IMSDK.uuid(), content)
  },
  /**
   * 创建图片消息
   * @param file 图片文件
   * @returns 消息对象
   */
  createImageMessage: async (file: any) => {
    const baseInfo = {
      uuid: IMSDK.uuid(),
      type: sutil.getFileType(file.name),
      size: file.size,
      width: file.width,
      height: file.height,
      url: file
    }
    const options = {
      sourcePicture: baseInfo,
      bigPicture: baseInfo,
      snapshotPicture: baseInfo,
      sourcePath: '',
      file: file
    }
    const { data }: any = await IMSDK.asyncApi(
      //@ts-ignore
      'createImageMessageByFile',
      IMSDK.uuid(),
      options
    )
    return data
  },
  /**
   * 发送消息到当前会话对象
   * @param message
   */
  sendMessage: async (message: MessageItem) => {
    csmessage.pushNewMessage(message)
    IMSDK.asyncApi(IMMethods.SendMessage, IMSDK.uuid(), {
      recvID: csconversation.currentConversation.userID,
      groupID: csconversation.currentConversation.groupID,
      message,
      offlinePushInfo
    })
      .then(({ data }: any) => {
        csmessage.updateOneMessage({
          message: data,
          isSuccess: true
        })
        console.log('cim', '发送成功')
      })
      .catch(({ data, errCode, errMsg }: any) => {
        console.log('cim', '发送失败')
        csmessage.updateOneMessage({
          message: data,
          type: UpdateMessageTypes.KeyWords,
          keyWords: [
            {
              key: 'status',
              value: MessageStatus.Failed
            },
            {
              key: 'errCode',
              value: errCode
            }
          ]
        })
      })
  }
})

function filterPreviewImage(messages: any[]): string[] {
  return messages
    .filter((message) => {
      if (message.contentType === MessageType.PictureMessage) {
        return true
      }
      if (message.contentType === MessageType.OANotification) {
        let notificationData = {} as any
        try {
          notificationData = JSON.parse(message.notificationElem.detail)
        } catch (error) {}
        if (notificationData.mixType === 1) {
          message.pictureElem.snapshotPicture.url = notificationData.pictureElem.sourcePicture.url
          return true
        }
        return false
      }
      return false
    })
    .map((item) => item.pictureElem.sourcePicture.url)
}

export default csmessage
