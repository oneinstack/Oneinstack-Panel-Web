import { reactive } from 'vue'

export const csconfig = reactive({
  token: null,
  load: () => {
    csconfig.token = Cookie.get('IMToken')
  }
})

export default csconfig
