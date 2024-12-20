import { reactive } from 'vue'

const uximg = reactive({
  cache: {} as any,
  errorCache: {} as any,

  task: {
    max: 4, //每个优先级最大执行数量
    /**
     * 优先级等待列表管理
     */
    map: {} as { [key: string]: TImgTask[] },

    /**
     * 执行任务管理
     */
    runArr: [] as TImgTask[],

    /**
     * 缓存url的promise
     */
    urlPro: {} as { [key: string]: Promise<any> },

    /**
     * 创建加载img的任务
     */
    create: async (param: Omit<TImgTask, 'success' | 'id' | 'pro' | 'proresolve'>) => {
      return new Promise((resolve, reject) => {
        //@ts-ignore
        param.success = (res: any) => {
          resolve(res)
        }
        //@ts-ignore
        uximg.task.createFun(param)
      })
    },

    /**
     * 创建加载img的任务，需要传入success回调
     */
    createFun: async (param: TImgTask) => {
      //如果优先级不存在，创建
      if (!uximg.task.map[param.zIndex]) {
        uximg.task.map[param.zIndex] = []
      }

      //对url进行处理，同一个url同时间只执行一次
      if (param.url) {
        const findItem = uximg.task.map[param.zIndex].find((v) => v.url == param.url)
        if (findItem) {
          param.abort = () => {
            findItem.proresolve(false)
          }
          const res = await findItem.pro
          findItem.success(res)
          return
        }
      }

      const item = {
        id: StrUtil.getId(),
        action: async () => {
          const res = await param.action()
          item.success(res)
          item.proresolve(res)
          uximg.task.clear(item)
        },
        zIndex: param.zIndex,
        url: param.url,
        pro: null as any,
        proresolve: null as any,
        success: param.success,
        abort: null as any
      }

      const pro = new Promise((resolve, reject) => {
        item.proresolve = resolve
        param.abort = () => {
          item.proresolve(false)
        }
      })
      item.pro = pro

      uximg.task.map[param.zIndex].push(item)
      uximg.task.run(item)
    },
    /**
     * 执行任务
     */
    run: (item: TImgTask) => {
      const indexArr = uximg.task.runArr.filter((v) => v.zIndex == item.zIndex)
      if (indexArr.length >= uximg.task.max) return
      uximg.task.runArr.push(item)
      uximg.task.map[item.zIndex].remove((v) => v.id == item.id)
      item.action()
    },
    /**
     * 清除任务
     */
    clear: (item: TImgTask) => {
      uximg.task.runArr.remove((v) => v.id == item.id)
      //执行下一个任务，先执行优先级高的
      const keys = Object.keys(uximg.task.map)
      keys.sort((a, b) => Number(a) - Number(b))
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (uximg.task.map[key].length > 0) {
          uximg.task.run(uximg.task.map[key][0])
          break
        }
      }
    }
  }
})

export default uximg

type TImgTask = {
  /**
   * 任务id
   */
  id: string
  /**
   * 执行任务
   */
  action: any
  /**
   * 优先级
   */
  zIndex: string
  /**
   * 唯一url，用于标记同一个任务的返回结果
   */
  url: string
  /**
   * 缓存url的promise
   */
  pro: Promise<any>
  /**
   * 缓存url的promise回调
   */
  proresolve: any
  /**
   * 执行完毕回调通知
   */
  success: any

  /**
   * 主动取消任务执行
   */
  abort: any
}
