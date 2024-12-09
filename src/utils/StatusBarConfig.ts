import sapp from '@/sstore/sapp'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'
export default class StatusBarConfig {
  /** 状态栏高度 */
  static statusHeight = Cookie.get('statusHeight') || 0
  static async initStatusBar() {
    const setBoxHeight = () => {
      setTimeout(() => {
        sapp.setAppHeight()
      }, 20)
    }
    setBoxHeight()
    window.addEventListener('resize', setBoxHeight)
    if (!Capacitor.isNativePlatform()) return
    await StatusBar.setStyle({
      style: Style.Light
    })
    await StatusBarConfig.getStatusHeight()
    StatusBarConfig.getBottomBarHeight()
  }

  /**
   * 获取状态栏高度
   */
  static async getStatusHeight() {
    const getSafeArea = async () => {
      await StatusBar.setOverlaysWebView({
        overlay: false
      })
      await Timer.delay(20)
      const initialHeight = document.documentElement.clientHeight
      sapp.setAppHeight()
      await StatusBar.setOverlaysWebView({
        overlay: true
      })
      await Timer.delay(20)
      const currentHeight = document.documentElement.clientHeight
      const safeArea = Math.abs(currentHeight - initialHeight)
      document.documentElement.style.setProperty('--safe-area-top', `${safeArea}px`)
      return safeArea
    }
    const _statusHeight = await getSafeArea()
    if (_statusHeight > 0) {
      StatusBarConfig.statusHeight = _statusHeight
      sapp.app.statusBarHeight = _statusHeight
      Cookie.set('statusHeight', _statusHeight)
    }
  }

  /** 底部导航栏高度 */
  static bottomBarHeight = Cookie.get('bottomBarHeight') || 0

  static async getBottomBarHeight() {
    let initialHeight = document.documentElement.clientHeight
    sapp.app.height
    await NavigationBar.hide()
    await Timer.delay(20)
    const _maxHeight = document.documentElement.clientHeight
    initialHeight = _maxHeight - initialHeight
    if (initialHeight > 0) {
      StatusBarConfig.bottomBarHeight = initialHeight
      sapp.app.bottomBarHeight = initialHeight
      Cookie.set('bottomBarHeight', initialHeight)
    }
    await NavigationBar.setTransparency({
      isTransparent: true
    })
    await NavigationBar.show()
  }
}
