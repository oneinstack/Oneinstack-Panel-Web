import csconfig from './csconfig'
import csutil from './csutil'

csutil.store = {
  csconfig,
  csutil
}

export const reset = () => {
  Object.keys(csutil.store).forEach((key) => {
    if (key !== 'csutil') csutil.store[key].reset?.()
  })
}

export const load = () => {
  Object.keys(csutil.store).forEach((key) => {
    if (key !== 'csutil') csutil.store[key].load?.()
  })
}

export const initApp = async () => {
  load()
}

csutil.reset = reset

export default () => {}
