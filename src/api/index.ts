export const apis = {
  // 上传文件
  upload: (obj?: ApiData) =>
    http.post(
      {
        url: '/system-util/api/util/putFile',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onProgress(percent, loaded, total) {
          if (obj?.onProgress) obj.onProgress(percent, loaded, total)
        }
      },
      obj
    ),
  // 谷歌第三方登录配置
  getConfig: (obj?: ApiData) => http.get('/api/callback/getConfig', obj),
  // 谷歌第三方登录 web端获取 -token
  googleLoginByWeb: (obj?: ApiData) => http.post('/api/callback/googleLoginByWeb', obj),
  // 谷歌第三方登录后 获取token
  googleLogin: (obj?: ApiData) => http.get('/api/callback/googleLogin', obj),
  // 谷歌判断是否第一次登录
  checkUserName: (obj?: ApiData) => http.get('/api/callback/checkUserName', obj),
  // 谷歌获取登录后的code 向后端传参拿到参数登录
  googleLoginCallBackByCode: (obj?: ApiData) => http.get('/api/callback/googleLoginCallBackByCode', obj),

  // 试玩用户登录
  tmpLogin: (obj?: ApiData) => http.post('/api/login/tryLogin', obj),
  //登录注册列表
  appConfigurationV1: (obj?: ApiData) => http.get('/api/systemApi/appConfigurationV1', obj),
  // 用户登陆接口
  login: (obj?: ApiData) => http.post('/api/login/login', obj),
  // 无验证码注册接口
  registerByAccount: (obj?: ApiData) => http.post('/api/login/registerByAccount', obj),
  // 根据语言查询活动列表分页
  activityList: (obj?: ApiData) => http.get('/api/activity/list', obj),
  // 根据id查询详情
  getInfoById: (obj?: ApiData) => http.get('/api/activity/getInfoById', obj),
  // 根据语言查询公告列表分页
  announcementList: (obj?: ApiData) =>
    http.get(
      {
        url: '/api/announcement/list',
        expire: 60
      },
      obj
    ),
  // 根据id查询详情
  announcementById: (obj?: ApiData) => http.get('/api/announcement/getInfoById', obj),
  // 获取首页彩票列表
  lotteryList: (obj?: ApiData) =>
    http.get(
      {
        url: '/api/lottery/list',
        expire: 60
      },
      obj
    ),
  // 获取首页游戏类型列表
  gameType: (obj?: ApiData) => http.get('/api/third-party-game/gameType', obj),
  // 获取彩票类型对应的odds
  lotteryOdds: (obj?: ApiData) => http.get('/api/lottery/odds', obj),
  // 获取彩票上期开奖记录以及本期时间
  lotteryOpen: (obj?: ApiData) => http.get('/api/lottery/open/top', obj),
  // 获取彩票上期开奖记录以及本期时间
  lotteryOpenResult: (obj?: ApiData) => http.get('/api/lottery/open/result', obj),
  // 用户投注
  lotteryUserBets: (obj?: ApiData) => http.post('/api/lottery/user/bets', { ...obj, json: true }),
  // 我的订单（分页）
  lotteryUserOrder: (obj?: ApiData) => http.get('/api/lottery/user/order', obj),
  // 退出登录
  loginOut: (obj?: ApiData) => http.post('/api/login/loginOut', obj),
  // 语言列表
  languageList: (obj?: ApiData) =>
    http.get(
      {
        url: '/api/Language/list',
        expire: 60
      },
      obj
    ),
  // 修改用户昵称和头像
  editUserInfo: (obj?: ApiData) => http.post('/api/users/editUserInfo', { ...obj, json: true }),
  // 邮箱发送验证码
  emailSendCode: (obj?: ApiData) => http.get('/api/login/emailSendCode', obj),
  // 获取系统开关
  switchList: (obj?: ApiData) => http.get('/api/systemApi/switch/list', obj),
  // 用户等级详情(百分比，具体值)
  userGradedInfo: (obj?: ApiData) => http.get('/api/users/userGradedInfo', obj),
  // 获取首页刮刮乐列表
  scratchTicketlHome: (obj?: ApiData) => http.get('/api/scratchTicket/home', obj),
  // 获取刮刮乐列表
  scratchTicketlList: (obj?: ApiData) => http.get('/api/scratchTicket/list', obj),
  // 获取刮刮乐详情
  scratchTicketlDetail: (obj?: ApiData) => http.get('/api/scratchTicket/detail', obj),
  // 用户购买刮刮乐
  scratchTicketlPurchase: (obj?: ApiData) => http.post('/api/scratchTicket/user/purchase', { ...obj, json: true }),
  // 用户刮刮乐结算
  scratchTicketlSettlement: (obj?: ApiData) => http.post('/api/scratchTicket/user/settlement', { ...obj, json: true }),
  // 我的刮刮乐
  scratchTicketlOrder: (obj?: ApiData) => http.get('/api/scratchTicket/user/order', obj),
  // 客服评分
  updateCustomerScore: (obj?: ApiData) => http.get('/api/customerUser/updateCustomerScore', obj),
  //获取三方游戏列表
  getThirdGameList: (obj?: ApiData) =>
    http.get(
      {
        url: '/api/third-party-game/getThirdGameList',
        expire: 60
      },
      obj
    ),
  //获取三方游戏类型
  getGamePlatformList: (obj?: ApiData) => http.get('/api/third-party-game/getGamePlatformList', obj),
  //获取三方游戏首页列表
  getThirdGameHomeList: (obj?: ApiData) => http.get('/api/third-party-game/getThirdGameHomeList', obj),
  //进入游戏
  enterGame: (obj?: ApiData) => http.get('/api/third-party-game/enterGame', obj),
  //退出游戏
  quitGame: (obj?: ApiData) => http.get('/api/third-party-game/quitGame', obj),
  //游戏钱包
  gameWallet: (obj?: ApiData) => http.get('/api/third-party-game/gameWallet', obj),
  //游戏钱包交易
  thirdpartyTransfer: (obj?: ApiData) => http.post('/api/third-party-game/transfer', { ...obj, json: true }),
  getPayPlatformList: (obj?: ApiData) => http.get('/api/third-party-game/getUserPlatformWalletList', obj),
  //获取第三方游戏钱包
  gameWalletForCenter: (obj?: ApiData) => http.get('/api/third-party-game/gameWalletForCenter', obj),
  //获取用户的游戏钱包列表
  getUserGameBalance: (obj?: ApiData) => http.get('/api/third-party-game/getUserGameBalance', obj),
  //进App时查询弹框活动
  getPoPut: (obj?: ApiData) => http.post('/api/activity/getPoPut', obj),

  // <-------------- 钱包模块相关接口 -------------->
  //获取币种列表
  coinlist: (obj?: ApiData) => http.get('/api/wallet/coinlist', obj),
  //获取用户钱包列表
  walletlist: (obj?: ApiData) => http.get('/api/wallet/walletlist', obj),
  //用户创建币种钱包
  createwallet: (obj?: ApiData) => http.post('/api/wallet/createwallet', obj),
  //获取用户钱包消费记录-转账记录
  trade: (obj?: ApiData) => http.get('/api/wallet/trade', obj),
  //汇兑
  exchange: (obj?: ApiData) => http.post('/api/wallet/exchange', { ...obj, json: true }),
  //设置默认钱包
  defaultwallet: (obj?: ApiData) => http.post('/api/wallet/defaultwallet', obj),
  //支付类型列表
  paymentTypeList: (obj?: ApiData) => http.get('/api/UserPaymentInfo/list', obj),
  //提现单列表
  withdrawList: (obj?: ApiData) => http.get('/api/wallet/withdrawList', obj),
  //充值单 -- OTC新增
  addRecharge: (obj?: ApiData) => http.post('/api/OtcDeposit/save', obj),
  //充值 -- 第三方
  recharge: (obj?: ApiData) => http.post('/api/wallet/recharge', { ...obj, json: true }),
  //充值单列表
  depositList: (obj?: ApiData) => http.get('/api/wallet/depositList', obj),
  //提现 -- 第三方
  payouts: (obj?: ApiData) => http.post('/api/wallet/payouts', { ...obj, json: true }),
  //提现单 -- OTC新增
  OtcWithdraw: (obj?: ApiData) => http.post('/api/OtcWithdraw/save', obj),
  //OTC -- 选择提现人或充值人交易
  selectDeal: (obj?: ApiData) => http.post('/api/OtcOrder/selectDeal', obj),
  //小铃铛 -- 待确认条数
  awaitConfirmTotal: (obj?: ApiData) => http.get('/api/wallet/awaitConfirmTotal', obj),
  //获取用户支付类型列表
  userPaymentType: (obj?: ApiData) => http.get('/api/wallet/userPaymentType', obj),
  //获取支付类型厂商列表
  // paymentPlatformList: (obj?:any) => http.get(obj, '/api/wallet/paymentPlatformList', 'GET'),
  // 充值 -支付类型
  payBindMethodList: (obj?: ApiData) => http.get('/api/wallet/payBindMethodList', obj),
  //充值 -支付类型
  rechargePayList: (obj?: ApiData) => http.get('/api/wallet/rechargePayList', obj),
  //提现 -支付类型
  payoutsPayList: (obj?: ApiData) => http.get('/api/wallet/payoutsPayList', obj),

  //判断是否已绑定银行卡
  hasPaymentType: (obj?: ApiData) => http.get('/api/wallet/hasPaymentType', obj),
  //获取剩余打码量数据
  getUserFlow: (obj?: ApiData) => http.get('/api/wallet/getUserFlow', obj),
  //获取提现方式列表数据
  userPaymentTypeWithdrawal: (obj?: ApiData) => http.get('/api/wallet/userPaymentTypeWithdrawal', obj),

  // <-------------- me模块相关接口 -------------->
  //绑定用户支付类型
  bindPaymentType: (obj?: ApiData) => http.post('/api/wallet/bindPaymentType', { ...obj, json: true }),
  //编辑绑定用户支付类型
  modifyPaymentType: (obj?: ApiData) => http.post('/api/wallet/modifyPaymentType', { ...obj, json: true }),
  //用户银行卡列表
  banklist: (obj?: ApiData) => http.get('/api/wallet/banklist', obj),
  //系统支持银行列表
  systemBankList: (obj?: ApiData) => http.get('/api/wallet/systemBankList', obj),
  //个人中心-我的注单
  meOder: (obj?: ApiData) => http.get('/api/lottery/user/me/order', obj),
  //个人中心-交易记录
  meTrade: (obj?: ApiData) => http.get('/api/wallet/me/trade', obj),
  //添加支付方式 - 国家
  getPayTrdCountry: (obj?: ApiData) => http.post('/api/wallet/getPayTrdCountry', obj),
  // //添加支付方式 - 支付方式
  payMethodList: (obj?: ApiData) => http.get('/api/wallet/payMethodList', obj),
  //添加支付方式 - 银行类型
  getBankByCode: (obj?: ApiData) => http.post('/api/wallet/getBankByCode', obj),
  //添加支付方式 - 手机区号
  areaCodelist: (obj?: ApiData) => http.get('/api/sms/areaCodelist', obj),
  //添加支付方式 - 获取手机验证码
  phoneCodeProduce: (obj?: ApiData) => http.get('/api/login/phoneCodeProduce', obj),
  //手机注册 - 获取手机区号
  getCountry: (obj?: ApiData) => http.get('/api/login/getCountry', obj),
  //手机注册 - 获取手机验证码
  registerSendSms: (obj?: ApiData) => http.get('/api/login/registerSendSms', obj),
  //手机登录 - 获取手机验证码
  loginSendSms: (obj?: ApiData) => http.get('/api/login/loginSendSms', obj),
  //安全中心 - 绑定手机号获取验证码
  phoneVerify: (obj?: ApiData) => http.get('/api/users/phoneVerify', obj),
  //安全中心 - 绑定手机号/邮箱数据提交
  bindByCode: (obj?: ApiData) => http.post('/api/users/bindByCode', obj),
  //安全中心 - 获取手机号/邮箱数据绑定信息
  getUserPhone: (obj?: ApiData) => http.get('/api/users/getUserPhone', obj),
  //登录页 => email获取验证码
  emailLoginSendCode: (obj?: ApiData) => http.get('/api/login/emailLoginSendCode', obj),
  //绑定个人信息
  bindUserInfo: (obj?: ApiData) => http.get('/api/users/bindUserInfo', obj),

  //取消用户绑定的支付方式
  unbindPaymentType: (obj?: ApiData) => http.post('/api/wallet/unbindPaymentType', obj),
  //密码状态查询
  passWordStatus: (obj?: ApiData) => http.post('/api/users/passWordStatus', obj),
  //修改登录密码
  changepass: (obj?: ApiData) => http.get('/api/users/changepass', obj),
  //修改支付密码
  updateWithdrawPassword: (obj?: ApiData) => http.get('/api/users/updateWithdrawPassword', obj),
  //我的代理列表数据
  subsetPage: (obj?: ApiData) => http.get('/api/invite/subsetPage', obj),
  //代理详情
  subsetInfo: (obj?: ApiData) => http.get('/api/invite/subsetInfo', obj),

  //otc订单列表
  otcDepositOrderPage: (obj?: ApiData) => http.get('/api/OtcOrder/otcDepositOrderPage', obj),
  //otc订单详情
  otcDepositOrderInfo: (obj?: ApiData) => http.get('/api/OtcOrder/otcDepositOrderInfo', obj),
  //更改otc订单状态
  updateStatus: (obj?: ApiData) => http.post('/api/OtcOrder/updateStatus', obj),

  //红包雨列表
  getPacketRainList: (obj?: ApiData) => http.post('/api/redPacketRain/getPacketRainList', obj),

  // <-------------- promotions模块相关接口 -------------->
  //签到列表
  signinRecordList: (obj?: ApiData) => http.get('/api/userSigninRecord/signinRecordList', obj),
  //签到提交
  savaSigninRecord: (obj?: ApiData) => http.post('/api/userSigninRecord/savaSigninRecord', obj),

  // <-------------- home模块相关接口 -------------->
  //获取虚拟数据
  getStatistics: (obj?: ApiData) =>
    http.get(
      {
        url: '/api/dataStatistics/getData',
        expire: 60
      },
      obj
    ),
  //前台页面的统计信息
  reception: (obj?: ApiData) => http.get('/api/dataStatistics/reception', obj),
  //代理邀请数据
  getSubUserDataStatistics: (obj?: ApiData) => http.get('/api/invite/getSubUserDataStatistics', obj),
  getSubUserStatisticsDetails: (obj?: ApiData) => http.get('/api/invite/getSubUserStatisticsDetails', obj),
  //查询客服是否跳转链接
  getCustomerUrl: (obj?: ApiData) => http.get('/api/Language/getCustomerUrl', obj),
  //任务列表
  getTaskList: (obj?: ApiData) => http.get('/api/activity/getTaskList', obj),
  //领取任务
  pickupActivityTask: (obj?: ApiData) => http.post('/api/activity/pickupActivityTask', obj),
  //判断任务是否已领取
  isClaimed: (obj?: ApiData) => http.get('/api/activity/isClaimed', obj),
  //查看我的任务
  getUserTaskRecord: (obj?: ApiData) => http.get('/api/activity/getUserTaskRecord', obj),
  //首页任务总金额
  activityTaskGiveAmount: (obj?: ApiData) => http.get('/api/activity/activityTaskGiveAmount', obj),
  //余额宝--信息请求
  yebWalletDetail: (obj?: ApiData) => http.get('/api/yeb/detail', obj),
  //余额宝 余额-记录--分页请求
  incomeList: (obj?: ApiData) => http.get('/api/yeb/incomeList', obj),
  //余额宝--收益(时间查询)
  balanceList: (obj?: ApiData) => http.get('/api/yeb/balanceList', obj),
  //余额宝--转入转出
  submit: (obj?: ApiData) => http.post('/api/yeb/submit', { ...obj, json: true }),
  //余额宝--收益规则
  getYebContent: (obj?: ApiData) =>
    http.get(
      {
        url: '/api/yeb/getYebContent',
        expire: 60
      },
      obj
    ),
  // 检查余额宝注册币种
  checkCoin: (obj?: ApiData) => http.get('/api/yeb/checkCoin', obj),
  //进入APP调取接口数据
  backOnline: (obj?: ApiData) => http.get('/api/login/backOnline', obj),
  //离开APP调取接口数据
  offline: (obj?: ApiData) => http.get('/api/login/offline', obj),
  //进入三方游戏
  ingame: (obj?: ApiData) => http.get('/api/third-party-game/ingame', obj),
  //获取用户游戏注单
  userBetRecord: (obj?: ApiData) => http.get('/api/third-party-game/userBetRecord', obj),

  // 聊天室
  getToken: (obj?: ApiData) => http.get('/api/v2/im/getToken', obj),

  // <-------------- IM-------------->
  IMGroupInfoSetLotteryType: (obj?: ApiData) => http.get('/api/v2/IMRedPacket/IMGroupInfo/setLotteryType', obj),
  IMGroupInfoDetail: (obj?: ApiData) => http.get('/api/v2/IMRedPacket/IMGroupInfo/detail', obj),

  // <-------------- 红包-------------->
  // 发红包
  sendRedPacket: (data?: ApiData) => http.post('/api/v2/IMRedPacket/sendRedPacket', data),
  // 领红包
  drawRedPacket: (data?: ApiData) => http.post('/api/v2/IMRedPacket/openRedPacket', data),
  // 红包状态
  redPacketStatus: (data?: ApiData) => http.post('/api/v2/IMRedPacket/redPacketStatus', data),
  // 红包记录
  wrprQueryPage: (data?: ApiData) => http.get('/api/v2/IMRedPacket/getList', data),
  // 获取红包规则列表
  getDrawRuleListByMu: (data?: ApiData) => http.post('/api/v2/IMRedPacket/getDrawRuleList', data),

  // <-------------- 长龙-------------->
  // 获取红包规则列表
  changLong: (data?: ApiData) => http.get('/api/changLong/list', data),
  getbetorder: (data?: ApiData) => http.get('/api/changLong/getbetorder', data),
  //返回当前系统时间戳
  getTime: (data?: ApiData) => http.get('/api/api/gettime', data),
  system: (data?: ApiData) => http.get('/api/api/system/time', data),

  // <-------------- 开宝箱-------------->
  // 宝箱类型列表
  boxReadyList: (data?: ApiData) => http.get('/api/treasureBox/boxReadyList', data),
  // 开宝箱
  openTreasureBox: (data?: ApiData) => http.get('/api/treasureBox/openTreasureBox', data),
  // 宝箱奖励列表
  getBoxRewardList: (data?: ApiData) => http.get('/api/treasureBox/getBoxRewardList', data),
  // 获取宝箱记录
  getBoxRecord: (data?: ApiData) => http.get('/api/treasureBox/getBoxRecord', data),
  // 获取最新10条中奖记录
  boxWinnerList: (data?: ApiData) => http.get('/api/treasureBox/boxWinnerList', data),

  // <-------------- 优惠券-------------->
  getUserCouponsList: (data?: ApiData) => http.get('/api/coupons/getUserCouponsList', data),
  // 使用优惠券
  useCoupon: (data?: ApiData) => http.get('/api/coupons/redeem', data),

  // <-------------- 大转盘-------------->
  // 转盘活动列表
  luckywheelinviteList: (data?: ApiData) => http.get('/api/luckywheelinvite/list', data),
  // 领取转盘活动
  receiveLuckyWheel: (data?: ApiData) => http.get('/api/luckywheelinvite/receiveLuckyWheel', data),
  // 点击转盘
  clickLuckyWheel: (data?: ApiData) => http.get('/api/luckywheelinvite/clickLuckyWheel', data),
  // 点击记录列表
  clickWheelRecords: (data?: ApiData) => http.get('/api/luckywheelinvite/subUserlist', data),
  // 邀请用户列表
  subUserlist: (data?: ApiData) => http.get('/api/luckywheelinvite/subUserInvitelist', data),
  // 查询提现记录
  withdrawalRecord: (data?: ApiData) => http.get('/api/luckywheelinvite/getWinningRecordList', data),
  // 获取其他玩家提现数据
  otherPlayerWithdrawalData: (data?: ApiData) => http.get('/api/dataStatistics/getData', data),

  // <-------------- 积分-------------->
  // 查询积分信息
  getPointsList: (data?: ApiData) => http.get('/api/integralExchange/getPointsList', data),
  // 查询积分信息
  getUserPoint: (data?: ApiData) => http.post('/api/integralExchange/getUserPoint', data),
  // 点击积分签到
  clickPointsSign: (data?: ApiData) => http.get('/api/integralExchange/clickPointsSign', data),
  // 积分详情接口
  getPointsPage: (data?: ApiData) => http.get('/api/integralExchange/getPointsPage', data),
  // 获取可兑换列表
  getIntegralExchangeList: (data?: ApiData) => http.get('/api/integralExchange/getIntegralExchangeList', data),
  // 获取用户兑换记录
  getUserIntegralExchangeRecordList: (data?: ApiData) =>
    http.get('/api/integralExchange/getUserIntegralExchangeRecordList', data),
  // 奖励兑换按钮
  integralExchange: (data?: ApiData) => http.get('/api/integralExchange/exchange', data),

  // <-------------- 站内信-------------->
  // 获取问题类型
  dictBycode: (data?: ApiData) => http.post('/api/systemApi/dictBycode', data),
  // 问题反馈提交
  addQuestion: (data?: ApiData) => http.post('/api/internamessage/addQuestion', { ...data, json: true }),
  // 查询所有反馈
  questionList: (data?: ApiData) => http.post('/api/internamessage/questionList', data),
  // 查询反馈详情
  questionDetail: (data?: ApiData) => http.post('/api/internamessage/questionDetail', data),  
  // 用户-问题反馈回复
  reoly: (data?: ApiData) => http.post('/api/internamessage/reoly', data),  


}
