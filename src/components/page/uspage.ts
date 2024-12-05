import { reactive } from 'vue'

const defaultConf = {
  bgcolor: '#f5f5f7',
  tabbar: {
    height: '210rem'
  },
  header: {
    height: '104rem',
    bgColor: 'linear-gradient(180deg, #eb602d 0%, #ffa64f 100%)'
  }
}

/**
 * 默认x-page组件配置
 */
export const uspage = reactive({
  ...defaultConf,
  /**
   * 恢复到默认
   */
  setConfig: (conf: any = defaultConf) => {
    const newConf = ObjectUtil.deepMerge(defaultConf, conf)
    Object.keys(newConf).forEach((key) => {
      //@ts-ignore
      uspage[key] = newConf[key]
    })
  }
})

export default uspage
