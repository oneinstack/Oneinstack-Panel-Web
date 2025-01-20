import IMSDK, { IMMethods } from 'openim-uniapp-polyfill'
import { apis } from '@/api/index'
import { DialogName, simdl } from './simdl'
import i18n from '@/lang'
import { svalue } from './svalue'
import { sconfig } from './sconfig'
import System from '@/utils/System'
import csuser from '@/modules/chat/sstore/csuser'
import csconversation from '@/modules/chat/sstore/csconversation'
import csmessage from '@/modules/chat/sstore/csmessage'

export const CustomData = {
  /**
   * 最新开奖号码
   */
  LotteryCode: '01',
  /**
   * 发红包
   */
  RedPack: '10',
  /**
   * 领红包
   */
  RedPackReceive: '11',

  /**
   * 领红包成功通知
   */
  RedPackReceiveSuccessNotice: '12',

   /**
   * 注单分享
   */
   ShareBet: '20',

}

/**
 * 红包领取码
 */
export const RedPackReceiveCode = {

  20: ()=> i18n.t('RedPackReceiveCode.HasTaken'),

  30: ()=> i18n.t('RedPackReceiveCode.Expired'),//超过24小时未领取

  35: ()=> i18n.t('RedPackReceiveCode.NotEligibility'),

  40: ()=> i18n.t('RedPackReceiveCode.Collected'),

  50: ()=> i18n.t('RedPackReceiveCode.Claimed'),
} as any

export const sim = {

  config:{
    /** 是否显示添加好友功能  */
    add_friend:false,
    /** 是否显示创建群组功能  */
    create_group:false,
  },

  /**
   * 使用外部登陆token
   */
  IMAccessToken: null,

  /**
   * 将聊天框内容最底部的显示出来
   */
  contentBottom: () => { },
  /**
   * 获取当前聊天框相关信息
   */
  getInfo() {
    // return store.getters
  },
  /**
   * 获取当前聊天框storeCurrentConversation信息
   */
  getCurrentInfo() {
    return csconversation.currentConversation || {}
  },
  /**
   * 获取自己信息
   */
  getSelfInfo() {
    return csuser.selfInfo || {}
  },
  isGroup() {
    const info = sim.getCurrentInfo()
    return info.conversationType === 3
  },
  //发送消息到后台
  sendMessage(msg:any) { },
  //发送图片消息到后台
  batchCreateImageMesage(paths:any) { },
  //发送自定义消息
  async sendCM(data:any, extension:any) {
    const message:any = await IMSDK.asyncApi(IMMethods.CreateCustomMessage, IMSDK.uuid(), {
      data,
      extension: JSON.stringify(extension),
      description: data
    })
    csmessage.sendMessage(message)
    sim.sendMessage(message)
  },
  //最新消息提示
  latestMessageConfig: {
    [CustomData.RedPack]: (extension:any) => {
      return `[${i18n.t('chatRoom.rpkt')}] ${extension.data}`
    },
    [CustomData.ShareBet]: (extension:any) => {
      return `[${i18n.t('game.bet')}] ${extension.data.betTitle}`
    }
  },
  getLatestMessage(parsedMessage:any) {
    const data = parsedMessage.customElem.data
    const extension = JSON.parse(parsedMessage.customElem.extension)
    return sim.latestMessageConfig[data](extension)
  },
  //发送红包消息
  /**
   * 
   * @param {*} data 
   * @example
   * {
      type: 1, //普通红包，拼手气红包
      money: 1, //总金额
      number: 1, //最大领取个数，普通红包为1，拼手气红包大于1
      content: '', //封面显示内容
    }
   */
  async sendRedpack(data:any) {
    const info = sim.getCurrentInfo()
    const selfinfo = sim.getSelfInfo()
    let sendInfo = {}
    if (info.conversationType === 3) {
      sendInfo = {
        groupId: info.groupID,
        // drawRuleId:
        type: data.type,
        number: Number(data.number),
        totalMoney: Number(data.money),
        singleMoney: data.type == 3 ? undefined : Number(data.money),
        blessings: data.data,
        tradePassword: data.tradePassword
      }
    } else if (info.conversationType === 1) {
      sendInfo = {
        friendMemberId: info.userID,
        // drawRuleId:
        type: 1,
        number: 1,
        totalMoney: Number(data.money),
        singleMoney: Number(data.money),
        blessings: data.data,
        tradePassword: data.tradePassword
      }
    }
    System.loading()
    let item = await svalue.getDefaultWallet()
    const res = await apis.sendRedPacket({
      ...sendInfo,
      coinCode:item.coinCode,
      final: (status,data:any) => {
        if (!status) {
          let key
          switch (data.code) {
            case 100042:
              key = 'maxNumber'
              break
            case 100043:
              key = 'minMoney'
              break
            case 100044:
              key = 'maxMoney'
              break
          }
          System.toast(i18n.t(`code.${data.code}`))
        }
        System.loading(false)
      },
      tip: () => {}
    })
    data.id = res.data
    data.sendUserId = selfinfo.userID
    data.tradePassword = undefined
    data.coinCode = item.coinCode
    sim.sendCM(CustomData.RedPack, {
      ...data
    })
    Timer.once(() => {
      sim.contentBottom()
    }, 500)
  },
  //发送领取红包消息
  async receiveRedPack(item:any) {
    //请求api领取红包，如果为true证明领取成功，其他为领取失败
    //领取成功才能发送领取成功消息(或者后台在领取成功后发送到群聊？)
    //status = api({id:item.id})
    //发送到群使用InsertGroupMessageToLocalStorage，私聊使用InsertSingleMessageToLocalStorage
    const res = await apis.drawRedPacket({
      packetId: item.id,
      final: (s, data) => {
        if (!s) {
          simdl.close(DialogName.RedPackDetail)
        }
      }
    })

    let _code = res.data.code
    if ([40, 50].includes(_code)) {
      _code = 50
      item.status = _code
      sim.setRedPacketStatus(item.id, _code)

      // if (_code === 50) {
      //   //发送领取的消息给发送红包的人
      //   const selfInfo = sim.getSelfInfo()
      //   sim.sendCM(CustomData.RedPackReceiveSuccessNotice, {
      //     id: item.id,
      //     sendUserId: item.sendUserId,
      //     getUserId: selfInfo.userID
      //   })
      // }
      return true
    }
    System.toast(res.data.msg)
    item.status = _code
    sim.setRedPacketStatus(item.id, _code)
  },

  /**
   * 设置缓存的红包状态
   * @returns
   */
  async setRedPacketStatus(id:any, code:any) {
    const selfInfo = sim.getSelfInfo()
    let rps = Cookie.get('redPacketStatus') || '{}'
    rps = JSON.parse(rps)
    let obj = rps[selfInfo.userID] || {}
    obj[id] = code
    rps[selfInfo.userID] = obj
    Cookie.set('redPacketStatus', JSON.stringify(rps))

    CEvent.emit('setRedPacketStatus', {
      id: id,
      status: code
    })
  },

  /**
   * 从缓存中获取红包状态
   * @returns
   */
  getRedPacketStatus(id:any) {
    const selfInfo = sim.getSelfInfo()
    let rps = Cookie.get('redPacketStatus') || '{}'
    console.log('6655');
    
    console.log(rps);
    
    // rps = JSON.parse(rps)
    const obj = rps[selfInfo.userID] || {}
    return obj[id] || 35
  },
  /**
   * 去红包领取页面
   */
  async toRedPackList(item:any, fun:any) {
    simdl.open(DialogName.loading)
    const res = await apis.wrprQueryPage({
      packetId: item.data.id,
      page: 1,
      limit: 15
    })
    res.data.list = res.data.records
    res.data.totalPage = res.data.pages
    item.list = res.data.list.map((v:any)=>{
      v.money = Number(v.money)
      v.sendMemberHeadIcon = v.sendImgUrl
      v.sendMemberNickName = v.sendNickname
      v.drawTime = v.harvestTime
      v.sendMemberId = v.sendUserId
      v.sendMemberHeadIcon = v.sendImgUrl

      v.memberNickName = v.userNickname
      v.memberHeadIcon = v.userImgUrl
      v.memberId = v.userId

      return v
    })
    item.listRes = {}
    item.listRes.totalPage = res.data.totalPage
    item.list = item.list.filter((v:any) => v.drawTime)
    simdl.data[DialogName.RedPackDetail] = {
      ...item
    }
    console.log('6688');
    
    System.router.push('/chat/redPacket/list')
    fun()
    simdl.close(DialogName.loading)
  }
}
