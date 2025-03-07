<template>
  <div class="column nav-box fit-height">
    <slot name="header">
      <div class="c-head-main" :style="{
        position: fixed ? 'fixed' : 'relative',
        background: conf.headerBgColor
      }" v-if="noHeader === false">
        <x-statusbar />
        <div class="c-head-nav" :style="{ height: uspage.header.height }"
          :class="{ 'c-head-nav-bottom': conf.scrollTop > 5 }">
          <div class="back" @click="conf.goBack">
            <div v-if="showBack">
              <div class="back-black" :style="{background: conf.backColor}" v-if="conf.pageType == 'black'">
                <van-icon size="28rem" color="#fff" name="arrow-left" />
              </div>
              <van-icon v-else class="back-img" :name="backIcon" :color="conf.backColor" :size="backIconSize" />
            </div>

          </div>
          <div class="c-head-nav-title">
            <slot name="title" />
          </div>
          <div class="c-head-nav-right">
            <slot name="right" />
          </div>
        </div>
      </div>
    </slot>
    <slot name="top"></slot>
    <div class="col relative" style="overflow-y: scroll; overflow-x: hidden" ref="scrollRef" @scroll="conf.scroll">
      <div class="absolute column no-wrap" style="width: 750rem; height: 100%">
        <div v-if="noHeader === false && topfill && fixed">
          <x-statusbar header />
        </div>
        <slot></slot>
        <div>
          <div v-if="noFooter === false" :style="{ height: tabbar === false ? '60rem' : uspage.tabbar.height }"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { EPage } from '@/enum/Enum'
import sapp from '@/sstore/sapp'
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { onBeforeMount, onMounted, reactive, ref, watch } from 'vue'
import uspage from './uspage'
import stheme from '@/sstore/stheme'
const props = defineProps({
  /**
   * 是否固定header，默认true
   */
  fixed: {
    default: true
  },
  /**
   * 是否填充顶部，默认true
   */
  topfill: {
    default: true
  },
  /**
   * 是否隐藏header，默认false
   */
  noHeader: {
    default: false
  },
  /**
   * 是否显示返回按钮，默认true
   */
  showBack: {
    default: true
  },
  /**
   * 返回按钮颜色，默认#ffffff
   */
  backColor: {
    default: undefined as any
  },
  /**
   * 返回按钮点击事件，默认null
   */
  backFun: {
    default: null as any
  },
  /**
   * 返回按钮图标，默认arrow-left
   */
  backIcon: {
    default: 'arrow-left'
  },
  /**
   * 返回按钮图标大小，默认50rem
   */
  backIconSize: {
    default: '48rem'
  },
  /**
   * 头部背景颜色，默认渐变'linear-gradient(180deg, #EB602D 0%, #FFA64F 100%)'
   */
  headerBgColor: {
    default: undefined as any
  },
  /**
   * 背景颜色，默认透明
   */
  bgcolor: {
    default: undefined as any
  },
  /**
   * 是否隐藏底部，默认false
   */
  noFooter: {
    default: false
  },
  /**
   * 是否显示底部导航栏的高度，默认false
   */
  tabbar: {
    default: false
  },
  /**
   * 页面类型
   */
  pageType: {
    default: ''
  }
})

const scrollRef = ref<any>()
const conf = reactive({
  pageType: props.pageType,
  bgColor: props.bgcolor || uspage.bgcolor,
  headerBgColor: props.headerBgColor || uspage.header.bgColor,
  backColor: props.backColor || uspage.header.backColor,
  scrollTop: 0,
  /**
   * 滚动事件
   */
  scroll: (e: any) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    conf.scrollTop = scrollTop
    const _bottom = scrollHeight - scrollTop - clientHeight
    CEvent.emit(EPage.scroll, {
      top: scrollTop,
      bottom: _bottom
    })
    if (_bottom < 50) {
      FunUtil.throttle(() => {
        CEvent.emit(EPage.scrollBottom, {
          top: scrollTop,
          bottom: _bottom
        })
      })
    }
  },
  /**
   * 滚动条
   */
  scrollRef: scrollRef,
  /**
   * 返回
   */
  goBack: () => {
    if (!props.showBack) return
    sapp.backbtn.clear()
    if (typeof props.backFun === 'function') {
      props.backFun()
    } else {
      sutil.pageBack()
    }
  },
  /**
   * 设置背景颜色
   */
  setBgColor: () => {
    if (props.pageType) {
      conf.bgColor = props.bgcolor ||  '#222627'
      conf.headerBgColor = props.headerBgColor || stheme.theme.black.headerBgColor()
      conf.backColor = props.backColor || '#464F50'
      uspage.tabbar.height = '120rem'
    }
    document.documentElement.style.setProperty('--bgcolor', conf.bgColor)
  },
  /**
   * 滚动到顶部
   */
  toTop: () => {
    if (!scrollRef.value) return
    scrollRef.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  },
  /**
   * 滚动到最底部
   */
  toBottom: () => {
    if (!scrollRef.value) return
    scrollRef.value.scrollTo({
      top: scrollRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
})

defineExpose({ ...conf })

watch(
  () => props.headerBgColor,
  (val: any) => {
    conf.headerBgColor = val
  }
)

onBeforeMount(() => {
  conf.setBgColor()
})

onMounted(() => {
  System.loading(false)
})
</script>
<style lang="less" scoped>
.nav-box {
  position: relative;
}

.c-head {
  position: relative;

  &-main {
    width: 750rem;
    color: #fff;
    z-index: 99;
  }

  &-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    &-title {
      font-size: 32rem;
      font-weight: Bold;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .back {
      position: absolute;
      height: 100%;
      display: flex;
      align-items: center;
      width: 100rem;
      left: 0;

      .back-black{
        margin-left: 30rem;
        // background: #464F50;
        width: 56rem;
        height: 56rem;
        border-radius: 12rem;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .back-img {
        margin-left: 30rem;
      }
    }

    &-right {
      position: absolute;
      right: 0rem;
      height: 100%;
      display: flex;
      align-items: center;
    }
  }
}
</style>
