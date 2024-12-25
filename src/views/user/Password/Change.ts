import { apis } from '@/api'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    statusObj: {
      userPasswordStatus: 1, //登陆状态
      userWithdrawPasswordStatus: 1, //支付状态
      isUserInfo: 1 //个人信息绑定
    },
    phone: '',
    email: '',
    areaCode: '',
    isSetAccountPwd: 1,
    isSetPayPwd: 1,
    isUserInfo: 1,

    //获取绑定手机号、email信息
    getBindInfo: async () => {
      System.loading()
      const res = await apis.getUserPhone({
        final: () => {
          System.loading(false)
        }
      })

      let datas = res.data || {}
      conf.phone = datas.userPhone ? sutil.plusXing(datas.userPhone, 3, 2, '*') : ''
      let index = datas.email.indexOf('@')
      conf.areaCode = datas.areaCode
      conf.email = datas.email ? datas.email.substr(0, 3) + '***' + datas.email.substr(index, datas.email.length) : ''

      conf.isSetAccountPwd = datas.isPwd
      conf.isSetPayPwd = datas.isPayPwd
      conf.isUserInfo = datas.isUserInfo

      Cookie.set('SecurityInfoBindStatus', datas)

      // 获取密码状态查询
      const res1 = await apis.passWordStatus({})
      conf.statusObj = res1.data || {}
    },

    handleClick(type: any) {
      let url = null as any
      switch (type) {
        case 'PersonalInformation':
          url = '/user/Password/PersonalInformation'
          break
        case 'Account':
          url = '/user/Password/modify'
          break
        case 'Payment':
          url = '/user/Password/modify'
          break
        case 'Phone':
          if (conf.phone) {
            url = '/user/Password/bind?mode=view&phone=' + conf.phone
          } else {
            url = '/user/Password/bind'
          }
          break
        case 'Email':
          if (conf.email) {
            url = '/user/Password/bind?mode=view&email=' + conf.email
          } else {
            url = '/user/Password/bind'
          }
          break
      }
      Cookie.set('passwordType', type)
      Cookie.set('statusObj', conf.statusObj)
      if (url) System.router.push(url)
    }
  })
  onMounted(() => {
    conf.getBindInfo()
  })

  return conf
}
