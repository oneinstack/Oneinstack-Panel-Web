import { loading } from '@/components/loading/loading'
import { toast } from '@/components/toast/toast'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { getPlatforms } from '@ionic/vue'
import { Router } from 'vue-router'
import { globalType } from '../../build/env/globalVar'

export default class System {
  /** 是否是原生 */
  static isNative = false

  /** 平台 */
  static platform = 'pc' as 'pc' | 'android' | 'ios'

  /** 是否是移动端 */
  static isMobile = false

  /**
   * 环境变量
   */
  static env: globalType = {} as any

  /**
   * 初始化系统参数
   */
  static init() {
    // 是否是原生
    System.isNative = Capacitor.isNativePlatform()

    // 平台
    const platforms = getPlatforms() as string[]

    const platformMap = {
      android: 'android',
      ios: 'ios',
      mobile: 'android'
    } as any

    // 获取运行设备平台
    System.platform = (platformMap[platforms.find((platform) => platformMap[platform]) as any] || 'pc') as any

    // 是否是移动端
    System.isMobile = System.platform !== 'pc'

    // 初始化环境变量
    System.env = JSON.parse('#{global}')
  }

  /**
   * 路由
   */
  static router: Router

  /**
   * 获取路由路径
   */
  static getRouterPath = (): any => {
    return this.router.currentRoute.value.path
  }

  /**
   * 获取路由参数,自动获取query、params中的参数， 哪个有就返回哪个
   */
  static getRouterParams = (): any => {
    const _query = this.router.currentRoute.value.query || {}
    const _params = this.router.currentRoute.value.params || {}
    if (Object.keys(_query).length) {
      return _query
    } else if (Object.keys(_params).length) {
      return _params
    }
    return {}
  }

  static isloading = null as any
  static loadingTimeout = 30000
  static isloadingPro = null as any
  private static loadObjTimer = null as any

  /**
   * 显示和隐藏加载
   * @param show
   */
  static loading = async (show: boolean = true) => {
    Timer.un(this.loadObjTimer)
    if (show) {
      if (!this.isloading) {
        this.loadObjTimer = Timer.once(() => {
          this.loading(false)
        }, System.loadingTimeout)
        this.isloadingPro = new Promise(async (resolve, reject) => {
          this.isloading = await loading({})
          resolve(true)
          this.isloadingPro = null
        })
      }
    } else {
      if (this.isloadingPro) await this.isloadingPro
      this.isloading?.remove()
      this.isloading = null
    }
  }

  /**
   * 显示提示
   */
  static toast = (
    message: any,
    status: 'success' | 'error' | 'warning' | 'info' = 'error',
    duration: number = 2000
  ) => {
    FunUtil.debounce(() => {
      toast({
        content: message,
        type: status,
        duration: duration
      })
    }, 300)
  }

  /**
   * 打开新地址
   * @param url
   * @param isCenter
   */
  static openUrl = (url: string, isCenter: boolean = true) => {
    if (isCenter) {
      let left = screen.width / 2 - 1000 / 2
      let top = screen.height / 2 - 800 / 2 - 30
      window.open(
        url,
        '_blank',
        'toolbar=no, location=yes, directories=no, status=yes, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=' +
          1000 +
          ', height=' +
          800 +
          ', top=' +
          top +
          ', left=' +
          left
      )
    } else {
      window.open(
        url,
        'DescriptiveWindowName' + StrUtil.getId(),
        'resizable,scrollbars=yes,status=1,width=1024, height=600, top=0, left=0'
      )
    }
  }

  static moduleObj = {
    'lottie': async () => {
      return await import('@lottiefiles/lottie-player')
    },
    'html2canvas': async () => {
      return await import('html2canvas')
    }
  }

  /**
   * 加载模块
   * @param module
   */
  static loadModule = async (module: keyof typeof System.moduleObj): Promise<any> => {
    const _module = await System.moduleObj[module]()
    return _module.default
  }

  /**
   * 截图返回图片url数据
   * @param param
   * @returns
   */
  static getImgPic = (param: { id: string; windowWidth?: number; windowHeight?: number }): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      let htmlDom: any = document.getElementById(param.id)
      const html2canvas = await System.loadModule('html2canvas')
      try {
        html2canvas(htmlDom, {
          logging: false,
          allowTaint: true,
          scale: window.devicePixelRatio,
          width: param.windowWidth,
          height: param.windowHeight,
          windowWidth: param.windowWidth,
          windowHeight: param.windowHeight,
          useCORS: true,
          backgroundColor: '#ffffff'
        }).then(function (canvas: any) {
          let imgUrl = canvas.toDataURL('image/png')
          resolve(imgUrl)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   *  下载文件
   */
  static async download(content: string, name: string = 'download.png', toast = true): Promise<any> {
    if (System.isNative) {
      const res1 = await Filesystem.stat({ path: 'app', directory: Directory.Documents })
      if (!res1?.ctime) await Filesystem.mkdir({ path: 'app', directory: Directory.Documents })
      const res = await Filesystem.writeFile({
        path: 'app/' + name,
        data: content,
        directory: Directory.Documents
      })
      if (toast) {
        System.toast('Successfully saved to : ' + res.uri, 'success', 5000)
      }
      return res.uri
    }
    if (content.startsWith('http')) {
      const res = await fetch(content)
      const blob = await res.blob()
      content = URL.createObjectURL(blob)
    }
    const tempLink = document.createElement('a')
    tempLink.style.display = 'none'
    tempLink.href = content
    tempLink.setAttribute('download', name)
    tempLink.setAttribute('target', '_blank')
    document.body.appendChild(tempLink)
    tempLink.click()
    document.body.removeChild(tempLink)
    window.URL.revokeObjectURL(content)

    if (toast) {
      System.toast('Successfully saved', 'success')
    }
  }

  /**
   * 切换主题
   * @param theme
   */
  static setTheme = (theme: string) => {
    Cookie.set('pageTheme', theme)
    window.location.reload()
  }
}
