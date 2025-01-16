export default class ArrayUtil {
  /**
   * 移除数组中的指定内容，用于不是对象素组
   * @param str 删除内容
   * @example
   * let arr = new Array<string>()
   * arr.push("1")
   * arr.push("2")
   * arr.remove("1")
   */
  static remove(_this:any, item:any) {
    for (let i = _this.length - 1; i >= 0; i--) {
      if (typeof item === 'function') {
        if (item(_this[i])) _this.splice(i, 1)
      } else {
        if (_this[i] === item) _this.splice(i, 1)
      }
    }
  }

  /**
   * 去重
   * @param predicate 比较说明
   * @returns
   * @example
   * const arr1 = arr.toSet()
   * const arr2 = arr.toSet((next,pre)=>next.id===pre.id)
   */
  static toSet(_this:any, predicate:any) {
    if (predicate === undefined)
      predicate = (next:any, pre:any) => {
        return next === pre
      }
    return _this.filter((next:any, index:any, arrTemp:any) => {
      return (
        arrTemp.findIndex((pre:any) => {
          return predicate(next, pre)
        }) === index
      )
    })
  }

  /**
   * 随机排序
   */
  static randSort(_this:any) {
    for (let i = 0, len = _this.length; i < len; i++) {
      let rand = parseInt(Math.random() * len + '')
      let temp = _this[rand]
      _this[rand] = _this[i]
      _this[i] = temp
    }
  }
}
