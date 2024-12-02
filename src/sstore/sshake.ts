// 防抖
import { reactive } from 'vue'

export const sshake = reactive({
  a: {} as any,
  shakeFunction(e: { time?: number; key: string; success?: any; fail?: any } = { key: '' }) {
    // 默认防抖时间3秒
    e.time = e.time ?? 3000
    if (!sshake.a[e.key]) {
      sshake.lockKey(e.key)
      e.success && e.success()
      if (e.time) {
        setTimeout(() => {
          sshake.releaseKey(e.key)
        }, e.time)
      }
    } else {
      e.fail && e.fail()
    }
  },
  releaseKey(key: string) {
    delete sshake.a[key]
  },
  lockKey(key: string) {
    sshake.a[key] = true
  }
})

export default sshake

// 使用
// sshake.shakeFunction({
// 	key: 'rechargeBtn',
// 	time: 2000,
// 	success: () => {
// 		// 点击按钮执行的操作
// 		console.log('666');
// 	},
// 	fail: res => {
// 		// 请勿连续点击
// 		this.$refs.toast.show({
// 			message: this.$t('user.shakeTip'),
// 			type: 'error'
// 		});
// 	}
// })
