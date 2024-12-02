import { sbet } from './sbet'
import { sconfig } from './sconfig'
import { shome } from './shome'
import { slottery } from './slottery'
import { sshake } from './sshake'
import { sstatus } from './sstatus'
import { stween } from './stween'
import { sutil } from './sutil'
import { svalue } from './svalue'
import { svf } from './svf'
import sweb from './sweb'

sutil.store = {
  shome,
  stween,
  sutil,
  slottery,
  svalue,
  svf,
  sconfig,
  sstatus,
  sbet,
  sshake,
  sweb
}

export const reset = () => {
  Object.keys(sutil.store).forEach((key) => {
    if (key !== 'sutil') sutil.store[key].reset?.()
  })
}

export const load = () => {
  Object.keys(sutil.store).forEach((key) => {
    if (key !== 'sutil') sutil.store[key].load?.()
  })
}

//初始化应用
export const initApp = async () => {
  load()
  await sconfig.getSystemTime()
}

sutil.reset = reset

export default () => {}
