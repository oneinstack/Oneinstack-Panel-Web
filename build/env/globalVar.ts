import cdn from './_cdn'
import cdnlocal from './_cdnlocal'
import dev from './_dev'
import pro from './_pro'
import proview from './_proview'
import _var from './_var'
import ll from './_ll'
import ac from './_ac'
import kk from './_kk'
import test from './_test'

const getConf = () => {
  return {
    dev,
    cdn,
    cdnlocal,
    pro,
    proview,
    ll,
    ac,
    kk,
    test
  } as any
}

export const globalVar = (mode: string) => {
  mode = mode == 'production' ? 'pro' : mode
  const _conf = getConf()[mode]
  if (!_conf) {
    throw new Error(`环境${mode}不存在，确认是否导入或声明环境`)
  }
  const env: envType = Object.assign(_conf)
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
