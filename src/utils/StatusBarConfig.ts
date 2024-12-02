import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
export default class StatusBarConfig {
  /** 状态栏高度 */
  static statusHeight = Cookie.get('statusHeight') || 0
  static async initStatusBar() {
    const setBoxHeight = () => {
      const initialHeight = document.documentElement.clientHeight
      document.documentElement.style.setProperty('--height', `${initialHeight}px`)
    }
    setBoxHeight()
    window.addEventListener('resize', setBoxHeight)
    if (!Capacitor.isNativePlatform()) return
    await StatusBar.setStyle({
      style: Style.Light
    })
    await StatusBarConfig.getStatusHeight()
  }

  static async getStatusHeight() {
    const getSafeArea = async () => {
      await StatusBar.setOverlaysWebView({
        overlay: false
      })
      await Timer.delay(20)
      const initialHeight = document.documentElement.clientHeight
      document.documentElement.style.setProperty('--height', `${initialHeight}px`)
      await StatusBar.setOverlaysWebView({
        overlay: true
      })
      await Timer.delay(20)
      const currentHeight = document.documentElement.clientHeight
      const safeArea = currentHeight - initialHeight
      document.documentElement.style.setProperty('--safe-area-top', `${safeArea}px`)
      return Math.abs(safeArea)
    }
    const _statusHeight = await getSafeArea()
    if (_statusHeight > 0) {
      StatusBarConfig.statusHeight = _statusHeight
      Cookie.set('statusHeight', StatusBarConfig.statusHeight)
    }
  }
}
