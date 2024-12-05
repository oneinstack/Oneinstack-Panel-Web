import i18n from '@/lang'
import plugins from '@/plugins'
import { initRouter } from '@/router'
import { initApp } from '@/sstore'
import { Capacitor } from '@capacitor/core'
import { getPlatforms } from '@ionic/vue'
import { App } from 'vue'
import HttpConfig from './HttpConfig'
import StatusBarConfig from './StatusBarConfig'
import System from './System'
import { UpdateVersion } from './UpdateVersion'
export default class Config {
  /**
   * 初始化
   */
  static async init(app: App) {
    // 是否是原生
    System.isNative = Capacitor.isNativePlatform()

    // 平台
    const platforms = getPlatforms() as string[]
    System.platform = System.isNative ? (platforms.includes('android') ? 'android' : 'ios') : 'web'

    // 是否是移动端
    if (
      window.navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      )
    ) {
      System.isMobile = true
    }

    // 初始化环境变量
    System.env = JSON.parse('#{global}')
    System.setNavigationBarColor('#ffffff')

    // 初始化插件
    app.use(plugins)

    // 初始化版本
    window.v = window.version = '#{version}'

    // 初始化状态栏
    await StatusBarConfig.initStatusBar()

    // 初始化i18n
    app.use(i18n as any)
    await i18n.setLang()

    // 初始化http
    HttpConfig.init(System.env)

    // 初始化路由
    const router = initRouter()
    app.use(router)
    router.isReady().then(async () => {
      // 初始化rem适配
      H5Util.rem()
      // 检查更新
      await UpdateVersion()
      // 初始化应用数据
      initApp()
      // 初始化完成
      app.mount('#app')
    })
  }
}
