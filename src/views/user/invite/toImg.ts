import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import System from '@/utils/System'
import { onMounted, reactive } from 'vue'

export const index = (swiperInstance: any) => {
  const conf = reactive({
    InvitationCode: '',
    qrcode: '', //二维码的内容链接
    hrefUrl: '',
    size: 120,

    onSwiper(swiper: any) {
      swiperInstance.value = swiper
    },
    //复制邀请码推广链接
    handleCopyLink() {
      StrUtil.copyText(conf.qrcode)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    },

    exportCardAsImage: async () => {
      System.loading()
      const res = await System.getImgPic({
        id: 'card' + swiperInstance.value.realIndex
      })
      await System.download(res)
      System.loading(false)
    }
  })

  const init = async () => {
    conf.InvitationCode = sconfig.userInfo.userInvitationCode.toUpperCase()
    conf.hrefUrl = location.origin
    conf.qrcode = location.origin + '/#/register?code=' + conf.InvitationCode
  }
  onMounted(init)

  return conf
}
