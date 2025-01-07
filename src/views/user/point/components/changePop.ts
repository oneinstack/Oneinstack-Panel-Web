import i18n from '@/lang'
import System from '@/utils/System'
import { nextTick, reactive } from 'vue'

export const index = ({ emit }: any) => {
  const conf = reactive({
    num: 1,
    show: false,
    vipLevel: '',
    imgUrl: '',
    userVipLevel: '',
    closePop() {
      conf.show = false
    },
    showConfirm() {
      if (!conf.vipLevel) return false
      let arr = conf.vipLevel.split(',')
      return !arr.includes(conf.userVipLevel)
    },
    confirm() {
      let userVip = conf.showConfirm()
      if (userVip) {
        System.toast(i18n.t('code.2603'))
        return
      }
      if (conf.num == 0) conf.num = 1
      conf.show = false
      emit('submit', conf.num)
    },
    getImgUrl(url: any) {
      if (!url) return false
      if (url.indexOf('http') != -1) {
        return true
      }
      return false
    },
    add() {
      let num1 = Math.floor(conf.num)
      if (num1 < 10) conf.num = num1 + 1
    },
    reduce() {
      let num1 = Math.floor(conf.num)
      if (num1 > 1) conf.num = num1 - 1
    },
    input(e: any) {
      let value: any = conf.num
      // 删除数字之外的字符
      let arr = value.match(/[^0-9]/g) || null
      let inputval = value.toString()
      if (arr) {
        for (let i = 0; i < arr.length; i++) {
          let index = inputval.indexOf(arr[i])
          inputval = inputval.split(arr[i]).join('')
        }
      }
      nextTick(() => {
        let inputNum = parseInt(inputval)
        if (inputNum < 1) return (conf.num = 1)
        if (inputNum > 10) return (conf.num = 10)
        conf.num = inputval
      })
    },
    showPop(e: any) {
      conf.num = 1
      conf.vipLevel = e.vipLevel
      conf.imgUrl = e.url
      conf.userVipLevel = e.userVipLevel + ''
      conf.show = e.show
    }
  })

  return conf
}
