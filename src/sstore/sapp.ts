import { EPage } from '@/enum/Enum'
import StatusBarConfig from '@/utils/StatusBarConfig'
import System from '@/utils/System'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { reactive } from 'vue'
import sutil from './sutil'

export const sapp = reactive({
  globalData: {} as any,
  tabar: {
    //路由层级管理，0固定，1以后使用replace
    url: [] as string[]
  },
  tempData: {} as { [key: string]: any; BankCardInfo: any; BankCardType: 'add' | 'edit' },
  keyboard: {
    show: false,
    height: 0,
    clickInputTime: 0
  },
  app: {
    /**
     * 页面高度
     */
    height: 0
  },
  /**
   * 设置页面高度
   */
  setAppHeight: () => {
    if (!sapp.keyboard.show) {
      const _height = document.documentElement.clientHeight
      //如果是点击input，则不设置高度
      if (Date.now() - sapp.keyboard.clickInputTime < 1000) {
        if (!sapp.whiteList.includes(System.getRouterPath())) return
      }
      document.documentElement.style.setProperty('--height', `${_height}px`)
      sapp.app.height = _height
      CEvent.emit(EPage.changeHeight, _height)
    }
  },
  /**
   * 添加键盘事件
   */
  addKeyboardEvent: () => {
    //检测input地址点击
    document.addEventListener(
      'click',
      function (event) {
        let target = event.target as HTMLElement & { href: string }
        if (target.tagName.toLowerCase() === 'input') {
          sapp.keyboard.clickInputTime = Date.now()
        }
      },
      true
    )

    if (!Capacitor.isNativePlatform()) return
    Keyboard.addListener('keyboardWillShow', (info) => {
      sapp.showKeyboard(info.keyboardHeight)
    })

    Keyboard.addListener('keyboardWillHide', () => {
      sapp.hideKeyboard()
    })
  },
  /**
   * 键盘高度影响的白名单列表
   */
  whiteList: ['/chat/chating'] as string[],
  /**
   * 显示键盘事件通知
   */
  showKeyboard: (height: number) => {
    sapp.keyboard.show = true
    sapp.keyboard.height = height
    if (!sapp.whiteList.includes(System.getRouterPath())) return
    FunUtil.throttle(() => {
      document.documentElement.style.setProperty(
        '--height',
        `${sapp.app.height - sapp.keyboard.height + StatusBarConfig.bottomBarHeight}px`
      )
    }, 100)
  },
  /**
   * 隐藏键盘事件通知
   */
  hideKeyboard: () => {
    sapp.keyboard.show = false
    if (!sapp.whiteList.includes(System.getRouterPath())) return
    FunUtil.throttle(() => {
      document.documentElement.style.setProperty('--height', `${sapp.app.height}px`)
    }, 100)
  },

  backbtn: {
    /**
     * 最后一次无法返回点击时间
     */
    lastTime: 0,
    /**
     * 返回事件函数映射
     */
    funMap: {} as any,
    /**
     * 执行返回事件函数
     */
    runFun: () => {
      const _keys = Object.keys(sapp.backbtn.funMap)
      if (_keys.length) {
        for (let i = 0; i < _keys.length; i++) {
          sapp.backbtn.funMap[_keys[i]]()
        }
        sapp.backbtn.funMap = {}
        return true
      }
      return false
    }
  },
  /**
   * 添加返回事件
   */
  addBackButton: () => {
    if (!System.isNative) return
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        if (Date.now() - sapp.backbtn.lastTime < 1000) {
          CapacitorApp.exitApp()
        } else {
          sapp.backbtn.lastTime = Date.now()
          System.toast('再按一次退出应用')
        }
      } else {
        sutil.pageBack()
      }
    })
  }
})

export default sapp
