import System from '@/utils/System'
import { reactive } from 'vue'

export const index = ({ props }: any) => {
  const conf = reactive({
    // 获取vip多个等级时取最小的
    getLevel(num: any) {
      if (!num) return 0
      let arr = num.split(',')
      arr.sort((a: any, b: any) => {
        return a - b
      })
      return arr[0]
    },
    getDeposit(num: any) {
      if (!num) return false
      return parseFloat(num)
    },
    //进入详情页
    handleIntoDetail(obj: any) {
      obj.taskDesc = obj.taskDesc.replace(/&/g, '%26')
      let deposit: any = this.getDeposit(obj.deposit)
      if (deposit > 0) {
        deposit = props.defalutWallet.coinSymbol + deposit
      } else {
        deposit = ''
      }
      System.router.push({ path: '/user/tasks/taskDetail', query: { id: obj.id, taskDesc: obj.taskDesc, deposit } })
    },
    getBoxTypeNum(reward: any) {
      if (!reward) return 1
      let arr = JSON.parse(reward)
      return arr
    }
  })

  return conf
}
