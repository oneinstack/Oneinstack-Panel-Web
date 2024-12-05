import { reactive } from 'vue'

export const csutil = reactive({
  /**
   * 请求根地址
   */
  baseUrl: '',
  reset: () => {},
  store: {} as any,
  getStore(name: string) {
    return csutil.store[name]
  }
})

export default csutil
