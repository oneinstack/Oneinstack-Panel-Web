import { TimeAction, TimeBean, TimeRender } from 'tools-time'
import { getCurrentInstance, reactive } from 'vue'

export const sani = reactive({
  /**
   * 创建一个动画对象
   * @example
   * const ani = sani.Ani()
   * ani({
   *  start: 0,
   *  end: 100,
   *  duration: 3000,
   *  final: () => {
   *    console.log('动画结束')
   *  },
   *  update: (val: any) => {
   *    conf.bean = parseInt(val)
   *  }
   * })
   * @returns
   */
  Ani: () => {
    const vm: any = getCurrentInstance()
    const _run = () => !vm.isUnmounted
    return ({ start, end, duration, update, ease, final }: AniParam) => {
      const _update = update
      update = (val: any) => {
        if (!_run()) {
          //@ts-ignore
          bean?.killAll()
          return
        }
        _update(val)
      }
      const bean = sani.to({ start, end, duration, update, ease, final })
      return bean
    }
  },
  /**
   * 对目标值进行动画过渡
   * @param param0
   * @returns
   */
  to: ({ start, end, duration, update, ease, final }: AniParam) => {
    TimeRender.run()
    if (!ease) ease = TimeAction.lerp
    let bean = new TimeBean({
      target: {
        name: 'test',
        x: start
      }
    })
    bean.setOptionSource(bean.target as any)
    const uuid = TimeRender.add(bean)
    const kill = () => {
      TimeRender.remove(uuid)
      TimeRender.stop()
      bean = null as any
    }
    bean.setOption({
      x: end,
      duration,
      ease: {
        default: ease
      },
      update: (_bean: any) => {
        update(_bean.target?.x)
      },
      final: () => {
        kill()
        final?.()
      }
    } as any)
    bean.start()
    //@ts-ignore
    bean.killAll = kill
    return bean
  }
})

export default sani

type AniParam = {
  /**
   * 初始值
   */
  start: number
  /**
   * 目标值
   */
  end: number
  /**
   * 动画时长
   */
  duration: number
  /**
   * 实时值回调
   */
  update: (val: any) => void
  /**
   * 动画过渡方式-默认为'linear'
   */
  ease?: ({ start, end, percent }: any) => any
  /**
   * 动画结束回调
   */
  final?: () => void
}
