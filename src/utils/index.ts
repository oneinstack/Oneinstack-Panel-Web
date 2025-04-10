export function toPx(val: number) {
  const width = document.documentElement.clientWidth || document.body.clientWidth
  const ratio = width / 375
  const pxVal = ratio * val
  return pxVal
}
export function formatSizeUnits(bytes: number) {
  let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let unitIndex = 0
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024
    unitIndex++
  }
  return `${bytes.toFixed(2)} ${units[unitIndex]}`
}