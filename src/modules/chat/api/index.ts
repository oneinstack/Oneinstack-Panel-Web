import sutil from '../sstore/csutil'

const getRU = () => sutil.store.csconfig.config.registerUrl

export const capis = {
  // ===========  imApi  ===========
  getOnlineStateFromSvr: (obj?: ApiData) => chttp.get('/user/get_users_status', obj),
  subUserOnlineStatus: (obj?: ApiData) => chttp.get('/user/subscribe_users_status', obj),
  unSubUserOnlineStatus: (obj?: ApiData) => chttp.get('/user/unsubscribe_users_status', obj),

  // ===========  login  ===========
  businessLogin: (obj?: ApiData) => chttp.post(getRU() + '/account/login', obj),
  businessSendSms: (obj?: ApiData) => chttp.post('/account/code/send', obj),
  businessVerifyCode: (obj?: ApiData) => chttp.post('/account/code/verify', obj),
  businessRegister: (obj?: ApiData) => chttp.post('/account/register', obj),
  businessReset: (obj?: ApiData) => chttp.post('/account/password/reset', obj),
  businessModify: (obj?: ApiData) => chttp.post('/account/password/change', obj),
  businessInfoUpdate: (obj?: ApiData) => chttp.post('/user/update', obj),
  businessGetUserInfo: (obj?: ApiData) => chttp.post('/user/find/full', obj),
  businessSearchUserInfo: (obj?: ApiData) => chttp.post('/user/search/full', obj),
  businessSearchUser: (obj?: ApiData) => chttp.post('/friend/search', obj),

  // ===========  file  ===========
  initiateFormData: (obj?: ApiData) => chttp.post('/object/initiate_form_data', obj),
  completeFormData: (obj?: ApiData) => chttp.post('/object/complete_form_data', obj)
}
