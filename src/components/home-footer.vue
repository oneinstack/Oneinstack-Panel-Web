<template>
  <section class="footer" >
    <img src="/public/images/bgfooter.png" alt="" class="img-bg" />
    <div class="text">{{t('journey')}}</div>
    <el-button type="primary" class="custom-button" :class="{ 'hover-effect': isHovered }"
      @mouseenter="handleMouseEnterFooter" @mouseleave="handleMouseLeaveFooter" @click="scrollToFaq">{{t('GetStarted')}}</el-button>
    <div class="line" :style="lineStyle"></div>
  </section>
  <footer class="footer-bottom">
      <div class="top">
        <div style="width: 70%; height: 100%;">
          <img src="/public/images/logo_footer.png" alt="" class="footer-logo" />
          <div class="footer-text">{{t('independence')}}</div>
        </div>
        <div class="code-box">
          <div>
            <img src="/public/images/qqreturn.jpg" alt="" class="code-img" />
            <div class="code-text">{{ t('group') }}</div>
            <div class="code-text">{{t('GroupNumber')}}:922856809</div>
          </div>
          <div>
            <img src="/public/images/code.png" alt="" class="code-img" />
            <div class="code-text">{{t('code')}}</div>
          </div>
        </div>

      </div>
      <div class="copyright">
        <span>{{t('site')}}</span>
        <span>{{t('copyright')}}</span>
      </div>
    </footer>
</template>

<script setup>
  import {
    ref
  } from 'vue'
  import {
    useI18n
  } from 'vue-i18n'
  const {
    t
  } = useI18n() //多语言化
  import { useRouter } from 'vue-router'
  const isHovered = ref(false);
  const router = useRouter()
  // 添加跳转方法
const scrollToFaq = () => {
  router.push({
    path: '/download',
    hash: '#faq-section'
  })
}

  //动态计算.line的样式
  const lineStyle = ref({
    top: '56.8%',
    left: '46.2%'
  });

  const handleMouseEnterFooter = () => {
    isHovered.value = true;
    lineStyle.value = {
      top: '56.0%', // 向上移动 1%
      left: '46.0%' // 向左移动 1%
    };
  };

  const handleMouseLeaveFooter = () => {
    isHovered.value = false;
    lineStyle.value = {
      top: '56.8%',
      left: '46.2%'
    };
  };
</script>

<style scoped lang="scss">
  @import url('../styles/css/home.scss');
</style>
