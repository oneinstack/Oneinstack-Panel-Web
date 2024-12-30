import sapp from '@/sstore/sapp'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
export default class StatusBarConfig {
  /** 状态栏高度 */
  static statusHeight = 0
  static async initStatusBar() {
    this.statusHeight = Cookie.get('statusHeight') || 0
    this.statusHeight = Number(this.statusHeight)
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
}
