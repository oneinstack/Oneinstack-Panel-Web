import { reactive } from 'vue'
import { sconfig } from './sconfig'
import sutil from './sutil'

export const sstatus = reactive({
  onlineStatus: false,
  setPrompt(key: string, obj: any) {
    let time = sstatus.getTime(1)
    let minute = sstatus.getTime(2)

    let valueArr = Cookie.get(key) || []
    if (!Array.isArray(valueArr)) valueArr = []
    let newKey = sconfig.userInfo ? sconfig.userInfo.uid : ''
    let newObj = {
      uid: newKey,
      time,
      minute,
      ...obj
    }
    let index = valueArr.findIndex((item: any) => item.uid == newKey)
    if (index != -1) {
      valueArr.splice(index, 1, newObj)
    } else {
      valueArr.unshift(newObj)
    }
    Cookie.set(key, valueArr)
  },
  // 获取弹窗提示，勾选不提示(后一天再提示) 不勾选不提示(加载就提示)
  getPrompt(key: string) {
    let valueArr = Cookie.get(key) || []
    if (!Array.isArray(valueArr)) valueArr = []
    let newUid = sconfig.userInfo ? sconfig.userInfo.uid : ''
    let value: any = valueArr.find((item: any) => item.uid == newUid)

    if (!value) return false
    if (value.noPrompt) {
      let time = sstatus.getTime(1)
      return value.time == time
    }
    // let minute = sstatus.getTime(2)
    return false
  },
  getTime(type: number) {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    if (type == 1) return `${year}-${month}-${day}`
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${hour}:${minute}`
  },
  lastIndex: 0,
  // 导航栏选中的项显示在中间
  getscrollLeft(leftRefs:any,n: number, i: number, w: number,aniShow = true) {
    sstatus.lastIndex = i
    let num = (window.innerWidth - sutil.rem2px(n)) / 2
    let scrollNum = num > 0 ? num : 0
    let scrollLeft = (i - 1) * sutil.rem2px(w) - scrollNum
    if(!aniShow) {
      leftRefs.value.scrollLeft = scrollLeft
      return
    }
    leftRefs.value?.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
    
  }
})

export default sstatus
