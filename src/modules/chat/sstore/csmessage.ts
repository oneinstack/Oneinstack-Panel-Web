import IMSDK, { MessageItem, MessageStatus, MessageType } from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
import { UpdateMessageTypes } from '../constant'

interface MessageState {
  historyMessageList: any[]
  previewImageList: string[]
  hasMoreMessage: boolean
  quoteMessage?: any
}

export const csmessage = reactive({
  historyMessageList: [] as (MessageItem & { isme: boolean })[],
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
