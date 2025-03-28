export function toPx(val: number) {
  const width = document.documentElement.clientWidth || document.body.clientWidth;
  const ratio = width / 375;
  const pxVal = ratio * val;
  return pxVal
}
