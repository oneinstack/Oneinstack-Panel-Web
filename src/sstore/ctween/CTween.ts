const optionsStyles = ['x', 'y', 'opacity', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateZ', 'color']

export default class CTween {
  target
  options
  /**
   * 处理前数据
   */
  optionsSource: any
  /**
   * 进度百分比
   */
  percent = 0
  /**
   * 动画耗时
   */
  usedTime = 0
  /**
   * 是否暂停
   */
  paused = false
  /**
   * 是否反转
   */
  reversed = false
  /**
   * 已循环次数
   */
  usedLoop = 0
  /**
   * 播放速度
   */
  scale = 1

  constructor(target: any, options: any) {
    this.target = target
    //@ts-ignore
    if (target.dom) this.target = target.target

    this.options = { ...options }
    if (!this.options.final) this.options.final = () => {}
    if (!this.options.update) this.options.update = () => {}

    const setInitVal = (name: any, value: any) => {
      if (Array.isArray(name)) {
        name.forEach((item: any) => {
          setInitVal(item, value)
        })
        return
      }
      //@ts-ignore
      if (options[name] !== undefined && this.target[name] === undefined) this.target[name] = value
    }
    setInitVal(['rotate', 'rotateZ'], 0)
    setInitVal(['scale', 'scaleX', 'scaleY'], 1)
  }

  /**
   * 清楚所有动作并开始
   */
  start() {
    this.usedLoop = 0
    this.init()
  }

  /**
   * 开始下一次循环
   */
  init() {
    this.reversed = false
    this.paused = false
    this.percent = 0
    this.usedTime = 0
  }

  /**
   * 渲染函数
   */
  update(timestamp: number) {
    timestamp = timestamp * this.scale

    if (this.paused) return

    if (!this.reversed) this.usedTime += timestamp
    else this.usedTime -= timestamp

    if (!this.optionsSource) {
      this.optionsSource = {}
      for (const key in this.target) {
        if (optionsStyles.includes(key)) {
          //@ts-ignore
          this.optionsSource[key] = this.target[key]
        }
      }
    }

    const _ttime = this.options.duration + this.options.delay
    if (this.usedTime > _ttime) this.usedTime = _ttime
    else if (this.usedTime < 0) this.usedTime = 0

    let _pnum = this.usedTime - this.options.delay
    if (_pnum < 0) _pnum = 0
    this.percent = _pnum / this.options.duration

    this.options.update(_pnum, this.percent)
    this.animate()
  }

  /**
   * 动画渲染逻辑
   */
  animate = () => {
    if (this.percent >= 0 && this.percent <= 1) {
      for (const key in this.options) {
        if (optionsStyles.includes(key)) {
          const val: any = this.options.action({
            key,
            startValue: this.optionsSource[key],
            endValue: this.options[key],
            percent: this.percent
          })
          //@ts-ignore
          if (val !== undefined && val !== null && !isNaN(val)) this.target[key] = val
        }
      }
    }

    if (this.options.delay > 0 && this.usedTime > 0 && this.usedTime <= this.options.delay) return

    if ((this.percent >= 1 && !this.reversed) || (this.percent <= 0 && this.reversed)) {
      if (!this.options.loop || this.usedLoop == this.options.loop) {
        this.pause()
        this.options.final(this, true)
      } else {
        if (this.options.loop > 0) this.usedLoop++
        for (const key in this.optionsSource) {
          //@ts-ignore
          this.target[key] = this.optionsSource[key]
        }
        this.init()
      }
    }
  }

  /**
   * 暂停动画
   */
  pause() {
    this.paused = true
  }

  /**
   * 恢复动画
   */
  resume() {
    if (this.paused) {
      this.paused = false
    }
  }

  /**
   * 反向运动
   */
  reverse() {
    this.reversed = !this.reversed
  }

  /**
   * 直接切换到整个动画变化时长的x秒的时间点的状态
   * @param time
   */
  seek(time: number) {
    this.usedTime = time
  }

  /**
   * 直接切换到整个变化过程的百分比的节点状态
   */
  progress(percent: number) {
    this.percent = percent
    this.seek(this.options.duration * percent)
  }

  /**
   * 让运动减速或者加速
   * @param scale
   */
  timeScale(scale: number) {
    this.scale = scale
  }

  /**
   * 直接销毁实例，让垃圾回收机制可以处理该实例所占用的内存
   */
  kill() {
    this.pause()
    this.options.final(this, false)
  }
}
