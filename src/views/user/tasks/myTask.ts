import { onMounted, reactive } from 'vue'
import { svalue } from '@/sstore/svalue'
import i18n from '@/lang'
import { apis } from '@/api'
import sutil from '@/sstore/sutil'

export const index = () => {
  const conf = reactive({
    typeList: [
      { name: i18n.t('point.all'), id: '' },
      { name: i18n.t('task.ongoing'), id: '0' },
      { name: i18n.t('task.failed'), id: '-1' },
      { name: i18n.t('task.finished'), id: '1' }
    ],
    navLeft: 40,
    navIndex: 0,
    taskList: [] as any[],
    defalutWallet: null as any,
    taskType: '',
    serviceHeiht: 300,
    loading: false,
    pageNum: 1,
    pageSize: 10,
    total: 0,
    changeType(index: number, item: any) {
      conf.navIndex = index
      conf.taskType = item.id
      conf.taskList = []
      conf.pageNum = 1
      conf.total = 0
      conf.getTaskRecord()
    },
    //获取列表
    getTaskRecord(load = true) {
      conf.loading = load
      apis.getUserTaskRecord({
        current: conf.pageNum,
        size: conf.pageSize,
        taskStatus: conf.taskType,
        success: (res: any) => {
          conf.taskList = [...conf.taskList, ...res.data.records]
          conf.total = res.data.total || 0
        },
        complete: () => {
          conf.loading = false
        }
      })
    },
    moreMessage(event: any) {
      const { scrollTop, clientHeight, scrollHeight } = event.target
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        // 5是一个缓冲值，避免提前加载
        if (conf.pageSize * conf.pageNum >= conf.total) return
        conf.pageNum++
        conf.getTaskRecord()
      }
    },
    getLevel(num: any) {
      if (!num) return 0
      let arr = num.split(',')
      arr.sort((a: any, b: any) => {
        return a - b
      })
      return arr[0]
    },
    getProgress(item: any) {
      if (item.userTaskStatus == 2) return 100
      let progress: any = Number(item.taskProgress) //当前进度
      let target = Number(item.taskTarget) //目标进度
      if (target == 0) {
        return 100
      }
      progress = ((progress / target) * 100)?.toFixed(0)
      progress = progress == 'NaN' ? 0 : progress
      return progress
    },
    getBoxTypeNum(reward: any) {
      if (!reward) return []
      let arr = JSON.parse(reward)
      return arr
    }
  })
  onMounted(async () => {
    let windowWidth = window.innerWidth
    conf.navLeft = windowWidth > 500 ? 500 / 4 : windowWidth / 4
    conf.defalutWallet = await svalue.getDefaultWallet()
    conf.getTaskRecord()
  })

  return {
    conf,
    sutil
  }
}
