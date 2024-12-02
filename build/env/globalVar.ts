import cdn from './_cdn'
import cdnlocal from './_cdnlocal'
import dev from './_dev'
import pro from './_pro'
import proview from './_proview'
import _var from './_var'
import ll from './_ll'
import ac from './_ac'
import kk from './_kk'

const getConf = () => {
  return {
    dev,
    cdn,
    cdnlocal,
    pro,
    proview,
    ll,
    ac,
    kk
  } as any
}

export const globalVar = (mode: string) => {
  mode = mode == 'production' ? 'pro' : mode
  const env: envType = Object.assign(getConf()[mode])
  let res = Object.assign(_var, { env })
  //@ts-ignore
  res = Object.assign(res, env)
  res = {
    ...res,
    //@ts-ignored
    global: res
  }
  return res as any
}

export type envType = typeof dev & typeof pro & typeof proview
export type globalType = typeof _var &
  envType & {
    /**
     * 环境变量
     */
    env: envType

    /**
     * 全局变量
     */
    global: globalType
  }
