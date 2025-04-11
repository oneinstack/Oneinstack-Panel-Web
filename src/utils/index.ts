export function toPx(val: number) {
  const width = document.documentElement.clientWidth || document.body.clientWidth
  const ratio = width / 375
  const pxVal = ratio * val
  return pxVal
}
export function formatSizeUnits(bytes:number) {
  let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let unitIndex = 0
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024
    unitIndex++
  }
  return `${bytes.toFixed(2)} ${units[unitIndex]}`
}
export const titleMap:any = {
  'cpu': 'CPU使用率',
  'ram': '内存使用率',
  'disk': '硬盘使用率',
  'io': '磁盘IO',
  'flow': '流量'
}

/**
 * 获取主题颜色变量值
 * @param variable CSS变量名称，例如: '--primary-color'
 * @returns CSS变量对应的值
 */
export function getThemeColor(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}