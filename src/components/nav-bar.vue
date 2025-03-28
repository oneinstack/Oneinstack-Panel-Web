<script setup>
  import {
    onBeforeUnmount,
    onMounted,
    ref,
    watch
  } from 'vue'
  import {
    useCounterStore
  } from '@/stores/index.js'
  defineProps({
    bg: {
      type: String,
      default: '#fff'
    }
  })
  const Store = useCounterStore()
  const show = ref(true)
  const bgColor = ref('') // 默认背景颜色
  const handleToggleShow = () => {
    const scrollTop = document.body.scrollTop || document.documentElement.scrollTop
    show.value = !(scrollTop > 0) // 控制导航栏的显示和隐藏
    if (scrollTop === 0 && Store.selectedIndex !== 1) {
      // 当滚动到顶部时，背景颜色变为无色
      bgColor.value = 'transparent'
    } else if(Store.selectedIndex === -1){
      // 否则，使用默认背景颜色
      bgColor.value = '#fff'
    }else if(Store.selectedIndex === 1){
      bgColor.value = '#EFEFEF'
    }else if(Store.selectedIndex === 0){//下载安装
      bgColor.value = '#fff'
    }
  }
  watch(() => Store.selectedIndex, //监听pinia中的下标
    (newindex) => {
      if(newindex === 1){//商城
        bgColor.value = '#EFEFEF'
      }else{
        bgColor.value = ''
      }
    }
  )

  onMounted(() => document.body.addEventListener('scroll', handleToggleShow))

  onBeforeUnmount(() => document.body.removeEventListener('scroll', handleToggleShow))
</script>

<template><!--首页头部导航-->
  <div v-show="show" class="nav-bar-container" :style="{ backgroundColor: bgColor }">
    <div class="left">
      <slot name="left" />
    </div>
    <div class="center">
      <slot name="center" />
    </div>
    <div class="right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped lang="scss">
  .nav-bar-container {
    padding: 0px 330px 0 240px;
    position: sticky;
    left: 0;
    top: 0px;
    z-index: 999;
    display: flex !important;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 70px;
    // background: transparent;

  }

  @media screen and (max-width: 768px) {
    .nav-bar-container {
      background: #fff;
      padding: 0 5%;
    }
  }
</style>
