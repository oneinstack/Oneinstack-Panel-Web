import CTween from './ctween/CTween'
import { reactive } from 'vue'

export const stween = reactive({
  /**
   * 动画对象管理
   */
  sprite: {
    /**
     * 对象列表
     * {
     *  "name":this
     * }
     */
    list: {} as any,
    add(spinfo: any) {
      stween.sprite.list[spinfo.name] = spinfo
    },
    remove({ name }: any) {
      delete stween.sprite.list[name]
    }
  },
  render: {
    /**
     * 帧渲染对象
     */
    renderFun: null as any,
    /**
     * 上一次检测时间
     */
    checkTime: Date.now(),
    /**
     * 检测是否正常渲染，返回false时停止渲染，每400毫秒检测一次
     * @returns
     */
    check() {
      const ttime = Date.now()
      if (ttime - stween.render.checkTime < 400) return true
      stween.render.checkTime = ttime

      //检测动画对象是否存在，不存在时进行清理
      for (const key in stween.sprite.list) {
        const info = stween.sprite.list[key]
        const dom = info.dom ? info.dom : info
        if (dom._isDestroyed === true || dom._?.isUnmounted === true || dom.isUnmounted === true) {
          stween.sprite.remove(info)
          stween.timelineObj.remove(info)
        }
      }

      //检测是否还有动画对象
      if (!Object.keys(stween.sprite.list).length) {
        stween.render.stop()
        return false
      }
      return true
    },
    get() {
      if (stween.render.renderFun) return
      stween.render.renderFun =
        ('undefined' != typeof window &&
          ((window.requestAnimationFrame && window.requestAnimationFrame.bind(window)) ||
            (window.msRequestAnimationFrame && window.msRequestAnimationFrame.bind(window)) ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame)) ||
        function (t: any) {
          setTimeout(t, 16)
        }
    },
    stop() {
      stween.render.renderFun = null
      stween.updateTimer = 0
    },
    /**
     * 获取帧渲染对象，在创建完毕动画任务后调用
     */
    run() {
      if (!stween.render.renderFun) {
        stween.render.get()
        if (stween.render.renderFun) {
          stween.updateTimer = Date.now()
          stween.render.renderFun(stween.update)
        }
      }
    }
  },

  updateTimer: 0,
  /**
   * 获取帧渲染时间
   * @returns
   */
  getUpdateTimer() {
    const ttime = Date.now()
    if (!stween.updateTimer) {
      stween.updateTimer = ttime - 16
    }
    const gtime = ttime - stween.updateTimer
    stween.updateTimer = ttime
    return gtime
  },
  /**
   * 主渲染线程
   */
  update() {
    if (!stween.render.check()) return
    const time = stween.getUpdateTimer()
    const _list = stween.timelineObj.list as any
    for (const key in _list) {
      const ctweens = _list[key]
      ctweens.forEach((item: any) => item.update(time))
    }
    stween.render.renderFun(stween.update)
  },
  /**
   * 时间线管理对象
   */
  timelineObj: {
    /**
     * {
     *  '1001':[
     *  new Tween()
     *  ]
     * }
     */
    list: {} as any,
    remove({ name }: any) {
      const _list = stween.timelineObj.list
      for (const key in _list) {
        const ctweens = _list[key]
        for (let i = ctweens.length - 1; i >= 0; i--) {
          const element = ctweens[i]
          if (element.target.name === name) {
            stween.timelineObj.list[key].splice(i, 1)
          }
        }
      }
    }
  },
  /**
   * 时间线动画
   */
  timeline() {
    const id = StrUtil.getId()
    stween.timelineObj.list[id] = []
    stween.render.run()
    return {
      to: (name: any, options: any) => {
        const info = stween.sprite.list[name]

        if (options.final) {
          const _final = options.final
          options.final = (status: any) => {
            if (status) _final()
            delete stween.timelineObj.list[id]
          }
        }

        stween.initOptions(options)
        if (info) stween.timelineObj.list[id].push(new CTween(info, options))
      },
      kill: () => {
        for (let i = 0; i < stween.timelineObj.list[id].length; i++) {
          const item = stween.timelineObj.list[id][i]
          item.kill()
        }
        delete stween.timelineObj.list[id]
      }
    }
  },
  initOptions(options: any) {
    options.duration = options.duration || options.time || 3000
    options.delay = options.delay || 0
    options.action =
      options.action ||
      function lerp({ startValue, endValue, percent }: any) {
        return startValue + (endValue - startValue) * percent
      }
  },
  /**
   * 执行一个动画任务，如果控制多个属性，使用timeline，如果存在在执行的动画，返回动画对象，不会覆盖
   * @param name
   * @param options - 只支持基础属性{ x,y,opacity,scale,scaleX,scaleY,rotate,rotateZ } + 动画属性 { time,final,delay,loop }
   */
  to(name: any, options: any) {
    if (Array.isArray(name)) {
      for (let i = 0; i < name.length; i++) {
        stween.to(name[i], options)
      }
      return
    }
    const info = stween.sprite.list[name]
    if (info) {
      const id = StrUtil.getId()

      if (options.final) {
        const _final = options.final
        options.final = (status: any) => {
          if (status) _final()
          delete stween.timelineObj.list[id]
        }
      }

      stween.initOptions(options)
      //@ts-ignore
      stween.timelineObj.list[id] = [new CTween(info, options)]
      stween.render.run()
    }
  },
  /**
   * 设置值
   * @param name
   * @param options
   */
  set(name: any, options: any) {
    if (Array.isArray(name)) {
      for (let i = 0; i < name.length; i++) {
        stween.set(name[i], options)
      }
      return
    }
    const info = stween.sprite.list[name]
    if (info) {
      for (const key in options) {
        //@ts-ignore
        info[key] = options[key]
      }
    }
  },
  /**
   * 暂停动画
   * @param name
   */
  pause(name: any) {
    const _list = stween.timelineObj.list as any
    const isArr = Array.isArray(name)
    for (const key in _list) {
      const _arr = _list[key]
      _arr.forEach((item: any) => {
        const _name = item.target.name
        if (isArr ? name.includes(_name) : _name == name) {
          item.pause()
        }
      })
    }
  },
  /**
   * 销毁动画
   * @param name
   */
  kill(name: any) {
    const _list = stween.timelineObj.list as any
    const isArr = Array.isArray(name)
    for (const key in _list) {
      const _arr = _list[key]
      _arr.forEach((item: any) => {
        const _name = item.target.name
        if (isArr ? name.includes(_name) : _name == name) {
          item.kill()
        }
      })
    }
  }
})

export default stween
