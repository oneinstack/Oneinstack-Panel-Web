const manager = {
  ERouter: {
    /**
     * 路由改变
     */
    change: '',

    /**
     * 重新加载当前页面
     */
    reload: '',

    /**
     * 浏览器显示和隐藏通知
     */
    browserShow: ''
  },
  EUser: {
    /**
     * 打开登录弹框
     */
    showLogin: ''
  },
  EPage: {
    /**
     * page组件页面正在滚动
     */
    scroll: '',

    /** page组件页面被滚动到底部50px */
    scrollBottom: '',

    /** 页面高度被改变 */
    changeHeight: ''
  }
}

Object.keys(manager).forEach((ikey) => {
  //@ts-ignore
  const item = manager[ikey]
  Object.keys(item).forEach((jkey) => {
    //@ts-ignore
    manager[ikey][jkey] = `${ikey}_${jkey}`
  })
})

export const ERouter = manager.ERouter
export const EUser = manager.EUser
export const EPage = manager.EPage
