## uni替换表

### 缓存
```
uni.setStorageSync、uni.setStorage -> Cookie.set
uni.getStorageSync、uni.getStorage -> Cookie.get
uni.removeStorageSync、uni.removeStorage -> Cookie.remove
uni.clearStorageSync、uni.clearStorage -> Cookie.clear
```

### 系统信息
```
uni.getSystemInfoSync().windowHeight -> window.innerHeight
uni.getSystemInfoSync().windowWidth -> window.innerWidth
```

### 导航
```
uni.navigateTo -> System.router.push
uni.navigateBack -> System.router.back
uni.reLaunch -> System.router.replace
```

### 请求
```
uni.request -> http.get
```

### 加载
```
uni.showLoading -> System.loading()
uni.hideLoading -> System.loading(false)
```

### 提示
```
uni.showToast -> System.toast('')、System.toast('','success')
```

### template标签
```
<view></view> -> <div></div>
<block></block> -> <template></template>
<text></text> -> <span></span>
<image></image> -> <img />
<scroll-view></scroll-view> -> <div></div>
```

### css样式
```
rpx -> rem
```

### 复制文本
```
uni.setClipboardData -> StrUtil.copyText
```

### 单位转换
```
uni.upx2px -> sutil.rem2px
```

## 常用指令

构建
```
ionic build
```

同步到其他平台
```
ionic cap sync android
ionic cap sync ios
```

打开到ide
```
ionic cap open android
ionic cap open ios
```
