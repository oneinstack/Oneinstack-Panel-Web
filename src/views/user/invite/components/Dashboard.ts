import { apis } from '@/api'
import i18n from '@/lang'
import { sconfig } from '@/sstore/sconfig'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { info } from 'node:console'
import { title } from 'node:process'
import { onMounted, reactive } from 'vue'

export const index = () => {
  const conf = reactive({
    socialPlatforms: [
        { name: 'Facebook', icon: '/icons/facebook.svg' },
        { name: 'Twitter', icon: '/icons/twitter.svg' },
        { name: 'Telegram', icon: '/icons/telegram.svg' },
        { name: 'VK', icon: '/icons/vk.svg' },
        { name: 'Line', icon: '/icons/line.svg' },
        { name: 'Skype', icon: '/icons/skype.svg' },
        { name: 'OK', icon: '/icons/ok.svg' },
        { name: 'LinkedIn', icon: '/icons/linkedin.svg' },
        { name: 'WhatsApp', icon: '/icons/whatsapp.svg' }
      ] as any,

      totalReward:'$0.00' as string,
      totalFriends:'0' as string,
      referralReward:'$0.00' as string,
      commissionReward:'$0.00' as string,
      rewardsList: [
        {
          username: 'SFvjdjhjjzlfvbkbkbbbbnb',
          amount: 805.26,
          type: 'increase'
        },
        {
          username: 'sgdhhkx',
          amount: 805.26,
          type: 'decrease'
        }
      ] as any,

      copyToClipboard:(type:any) => {
        const text = type === 'link' 
          ? 'https://bcgame.im/i-32a7vmavy-n/' 
          : '32a7vmavy'
        navigator.clipboard.writeText(text)
          .then(() => {
            System.toast(i18n.t('invite.CopySuccessful') || 'success', 'success')
          })
      },
  })

  onMounted(() => {

  })
  return conf
}
