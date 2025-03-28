<template>
  <div class="base-game-container">
    <header class="top">
      <video autoplay muted loop id="video-background" style="z-index: 0;">
        <source src="/media/bg2.mp4" type="video/mp4" />
      </video>
      <div class="top-text">
        <div class="tops">{{t('Install')}} <span
            style="color: var(--primary-color);">Oneinstack</span> {{ t('Product')}}</div>
        <div class="ver">{{t('verify')}} <span
            style="color: var(--primary-color);">Oneinstack {{t('website')}}</span> {{t('down')}}</div>
      </div>
      <div class="top-Download">
        <img src="/images/Download-logo.png" alt="" class="samsungs" />
        <div class="top-box">
          <div class="fz32">Linux {{ t('PanelS') }} {{t('formal')}} 0.01</div>
          <div style="font-size: 16px; color: #A2A2A2; font-weight: bold; margin-top: 12px; margin-bottom: 30px;">
            {{ t('support') }}
          </div>
          <el-button type="primary" class="custom-buttons" @click="scrollToFaq">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <img src="/images/dowon.png" alt="" class="custom-icon" />
              {{t('download')}}
            </div>
          </el-button>
        </div>
      </div>
    </header>
    <section class="content" id="faq-section">
      <div class="content-download">
        <div style="display: flex; align-items: center;">
          <div class="lineOrange" />
          <div class="fz42"><span class="contents-text">{{t('linuxdow')}}</span> <span class="contents-texts">{{t('Installation')}} ？</span></div>
        </div>
        <div class="edition">
          <div class="edition-top"><span>{{t('formal')}}: 0.0.1</span></div>
          <div class="edition-bottom tleft"><span>{{t('versions')}}</span><span
              style="color: var(--primary-color); margin-left: 24px;">{{t('Clist')}}</span></div>
        </div>
        <div class="ss">
          <div class="ss-box">
            <span>{{text}}</span>
          </div>
          <el-button type="primary" class="custom-buttons minis" @click="copyCommand">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <img src="/images/copy.png" alt="" class="custom-iconcopy" />
              {{t('copy')}}
            </div>
          </el-button>
        </div>
        <el-divider border-style="dashed" v-show="activeNames[0] == 1 " style="margin-top: 104px;"></el-divider>
        <!-- 折叠面板 -->
        <el-collapse v-model="activeNames">
          <el-collapse-item name="1" class="no-arrow">
            <div>
              <download></download>
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-divider border-style="dashed" content-position="center" style="margin-top: 45px;"><span
            @click="toggleCollapse">{{footer}}</span></el-divider>
      </div>
    </section>

    <section class="footer-bottom">
      <div class=" footer-bottom-s">
        <div class="lineOrange" />
        <div><span class="fz30">{{ t('problem') }}</span></div>
      </div>
      <QA class="QA"></QA>
      <el-divider  border-style="dashed" style="margin-top: 50px;"></el-divider>
    </section>

    <section class="footer-bottomls">
       <app></app>
    </section>

    <foters></foters>

  </div>
</template>
<script setup>
  import {
    ref,
    onMounted
  } from 'vue'
  import {
    useRoute
  } from 'vue-router'
  import {
    useI18n
  } from 'vue-i18n'
  import download from '../../components/download-content.vue';
  import QA from '../../components/download-Q&A.vue'
  import app from '../../components/download-app.vue'
  import foters from '../../components/home-footer.vue'
  import { ElMessage } from 'element-plus'
  const {
    t
  } = useI18n()
  const route = useRoute()
  onMounted(() => {
    const hash = route.hash; // 获取 URL 中的 hash 值
  if (hash) {
    const element = document.querySelector(hash); // 根据 hash 找到目标元素
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
    console.log('路由', route.path)

    // 获取当前语言
  const currentLang = document.cookie.split('; ').find(row => row.startsWith('language='))?.split('=')[1] || 'cn';
  // 设置 html 标签的 lang 属性
  document.documentElement.lang = currentLang;

  // 其他现有的 onMounted 代码...
  })
  const text = ref(
    'if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/install_panel.sh;else wget -O install_panel.sh https://download.bt.cn/install/install_panel.sh;fi;bash install_panel.sh ed8484bec'
  )
  // 添加复制函数
  const copyCommand = () => {
  if (!text.value) {
    ElMessage.error('复制内容为空，请检查');
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    // 使用现代 Clipboard API
    navigator.clipboard.writeText(text.value)
      .then(() => {
        ElMessage.success('复制成功，请到服务器中进行粘贴');
      })
      .catch(() => {
        ElMessage.error('复制失败，请重试');
      });
  } else {
    // 兼容性方案：使用 document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text.value;
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        ElMessage.success('复制成功，请到服务器中进行粘贴');
      } else {
        ElMessage.error('复制失败，请重试');
      }
    } catch {
      ElMessage.error('复制失败，请重试');
    } finally {
      textArea.remove();
    }
  }
}
  const footer = ref(t('click'))
  // 定义绑定的展开状态
  const activeNames = ref([]);
  // 点击事件：切换折叠面板的展开状态
  const toggleCollapse = () => {
    // 如果当前折叠面板已展开，则收起；否则展开
    if (activeNames.value.includes('1')) {
      activeNames.value = []; // 收起
      footer.value = t('click')
    } else {
      activeNames.value = ['1']; // 展开
      footer.value = t('Pack')
    }
  };

  // 在 script setup 中添加跳转方法
const scrollToFaq = () => {
  const element = document.getElementById('faq-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<style scoped lang="scss">
  @import url('../../styles/css/game.scss');
  @import url('../../styles/css/line.css');
  .fz30{
    margin-left: 28px;
    color: #2E2E2E;
    font-weight: bold;
    margin-right: 38px;
    white-space: pre-wrap;
    font-size: 30px;
  }
  .footer-bottomls {
    width: 100%;
    min-height: auto;
    padding: 0 189px 56px 189px;
    background-color: #fff;
  }
  @media(max-width: 961px) {
    .footer-bottomls {
      width: 100%;
      min-height: auto;
      padding: 0 20px 0 20px;
      background-color: #fff;
      padding-bottom: 40px;
    }
    .fz30{
      font-size: 24px;
      margin: 0;
     }
  }
  html[lang="en"] {
    .tleft{
      text-align: left;
    }
  }
</style>
