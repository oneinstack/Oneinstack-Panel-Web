import System from '@/utils/System'
import { sapp } from './sapp'
import { sconfig } from './sconfig'
import { shome } from './shome'
import { simdl } from './simdl'
import { sshake } from './sshake'
import { sstatus } from './sstatus'
import { stween } from './stween'
import { sutil } from './sutil'
import { svalue } from './svalue'
import { svf } from './svf'
import { sweb } from './sweb'
import { stheme } from './stheme'

sutil.store = {
  shome,
  stween,
  sutil,
  svalue,
  svf,
  sconfig,
  sstatus,
  sshake,
  sweb,
  sapp,
  stheme,
  simdl
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
