export default class CTweenAction {
  /**
   * 匀速运动
   * @returns
   */
  static lerp({ startValue, endValue, percent }: any) {
    return startValue + (endValue - startValue) * percent
  }

  /**
   * 16进制颜色转换
   * @returns
   */
  static interpolateColor({ startValue, endValue, percent }: any) {
    const fun = (startValue: any, endValue: any, percent: number) => {
      function hexToRgb(hex: any) {
        let bigint = parseInt(hex.slice(1), 16)
        let r = (bigint >> 16) & 255
        let g = (bigint >> 8) & 255
        let b = bigint & 255
        return [r, g, b]
      }

      function rgbToHex(r: any, g: any, b: any) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
      }

      function interpolate(start: any, end: any, factor: number) {
        return start + (end - start) * factor
      }

      let startRgb = hexToRgb(startValue)
      let endRgb = hexToRgb(endValue)

      let interpolatedRgb = [
        Math.round(interpolate(startRgb[0], endRgb[0], percent)),
        Math.round(interpolate(startRgb[1], endRgb[1], percent)),
        Math.round(interpolate(startRgb[2], endRgb[2], percent))
      ]

      return rgbToHex(interpolatedRgb[0], interpolatedRgb[1], interpolatedRgb[2])
    }
    let res: any = ''
    if (Array.isArray(startValue)) {
      res = []
      for (let i = 0; i < startValue.length; i++) {
        res[i] = fun(startValue[i], endValue[i], percent)
      }
    } else {
      res = fun(startValue, endValue, percent)
    }
    return res
  }
}
