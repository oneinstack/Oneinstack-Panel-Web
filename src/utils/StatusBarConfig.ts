import sapp from '@/sstore/sapp'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'
export default class StatusBarConfig {
  /** 状态栏高度 */
  static statusHeight = 0
  static async initStatusBar() {
    this.statusHeight = Cookie.get('statusHeight') || 0
    this.bottomBarHeight = Cookie.get('bottomBarHeight') || 0
    this.statusHeight = Number(this.statusHeight)
    this.bottomBarHeight = Number(this.bottomBarHeight)
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
    const setHeight = async (_height: number) => {
      StatusBarConfig.statusHeight = _height
      Cookie.set('statusHeight', _height)
      document.documentElement.style.setProperty('--status-bar-height', `${_height}px`)
      await StatusBar.setOverlaysWebView({
        overlay: true
      })
    }

    if (StatusBarConfig.statusHeight > 0) {
      setHeight(StatusBarConfig.statusHeight)
      return
    }

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
      const safeArea = Math.abs(document.documentElement.clientHeight - initialHeight)
      return safeArea
    }
    const _statusHeight = await getSafeArea()
    if (_statusHeight > 0) {
      setHeight(_statusHeight)
    }
  }

  /** 底部导航栏高度 */
  static bottomBarHeight = 0

  static async getBottomBarHeight() {
    const setHeight = async (_height: number) => {
      StatusBarConfig.bottomBarHeight = _height
      Cookie.set('bottomBarHeight', _height)
      document.documentElement.style.setProperty('--navigation-bar-height', `${_height}px`)

      await NavigationBar.setTransparency({
        isTransparent: true
      })
      await NavigationBar.show()
    }
    if (StatusBarConfig.bottomBarHeight > 0) {
      setHeight(StatusBarConfig.bottomBarHeight)
      return
    }
    let initialHeight = document.documentElement.clientHeight
    await NavigationBar.hide()
    await Timer.delay(20)
    const _maxHeight = document.documentElement.clientHeight
    initialHeight = _maxHeight - initialHeight
    if (initialHeight > 0) {
      setHeight(initialHeight)
    }
  }
}
