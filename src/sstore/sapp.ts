import { reactive } from 'vue'

export const sapp = reactive({
  globalData: {} as any,
  tabar: {
    //路由层级管理，0固定，1以后使用replace
    url: [] as string[]
  },
  tempData: {} as {[key:string]:any;BankCardInfo:any;BankCardType:'add'|'edit'}
})

export default sapp
