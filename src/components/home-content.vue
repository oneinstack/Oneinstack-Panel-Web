<template><!--首页-->
  <div class="base-home-container">
    <section class="section-box">
      <img src="/images/logo_one.png" alt="" class="logo-bj" />
      <div class="section-box-text">
        <span v-for="(text, index) in [t('Native'), t('Efficient')]" :key="index"
          :class="{ active: index === activeIndex }" @mouseenter="stopInterval" @mouseleave="startInterval"
          @mouseover="activeIndex = index">
          {{ text }}
        </span>
      </div>
      <div class="corner-box" :style="cornerBoxStyle">
        <span className="corner top-left"></span>
        <span className="corner top-right"></span>
        <span className="corner bottom-left"></span>
        <span className="corner bottom-right"></span>
      </div>
      <div style="color: #6f6f6f; font-size: 2.3vw;">{{t('oneinstack')}}</div>
      <div class="buttonThree">
        <div class="img-box">
          <el-button :plain="true" type="primary" class="custom-buttons" @click="open">
            <div style="display: flex; justify-content: space-around; align-items: center;">
              <img src="/public/images/dowon.png" alt="" class="custom-icon" />
              {{t('download')}}
            </div>
          </el-button>
        </div>
        <div class="img-box">
          <el-button type="primary" class="custom-buttonsblue" @click="github">
            <img src="/public/images/github.png" alt="" class="custom-icon" />
            <div style="flex:1; display: flex; align-items: center;">
              <span class="star">Star</span> <el-statistic :value="outputValue" class="statistic-white" />
            </div>
          </el-button>
        </div>
        <!-- <div class="img-box">
          <el-button type="primary" class="custom-buttonswhile">
            <img src="/public/images/Group.png" alt="" class="custom-icon" />
            <div style="flex:1; display: flex; align-items: center;">
              <span class="star">Star</span> <el-statistic :value="outputValueone" class="statistic-red" />
            </div>
          </el-button>
        </div> -->
        <div class="img-box">
          <el-button type="primary" class="custom-buttonswhile" @click="redirectToWebsite">
            <img src="/public/images/Group 75.png" alt="" class="icons" :class="['icons',  { 'icons-en': loang === 'en' } ]"  />
            <div style="flex:1; display: flex; align-items: center; color: #007BFF; margin-right: 5%;">
              {{t('ScriptInstallation')}}
            </div>
          </el-button>
        </div>
      </div>
    </section>
    <section class="section-pc">
      <img src="/public/images/pc.png" alt="" class="pc" />
      <img src="/public/images/Intersect.png" alt="" class="arc" />
      <img src="/public/images/chart.png" alt="" class="chart">
      <div class="section-pc-text">
        <div class="one">{{t('installations')}}</div>
        <div class="twodowon">1,146,311<span style="letter-spacing: 0;">{{t('second')}}</span></div>
        <div class="three">{{t('maintenance')}}</div>
      </div>
    </section>
    <section class="option">
      <header class="option-head">
        <div class="option-head-top">{{t('solution')}}</div>
        <div class="option-head-bottom">{{t('slution')}}</div>
      </header>
      <div class="option-box">
        <div class="option-box-orange"></div>
        <div class="option-box-content">
          <div v-for="(item, index) in list" :key="index" class="option-item">
            <img :src="item.icon" alt="" class="option-icon" />
            <div class="option-box-name">{{ t(item.name) }}</div>
            <div class="option-box-text">{{ t(item.text) }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="time-box">
      <div class="time-box-text">
        <div class="time-box-text-top">{{t('time')}}</div>
        <div class="time-box-text-bottom">
          {{t('timetext')}}
        </div>
      </div>
      <div class="time-list">
        <div class="time-list-one">
          <img src="/public/images/sql.png" alt="" class="img-time" />
          <div class="time-list-text">
            <div class="top">{{t('WebsiteAndAatabase')}}</div>
            <div class="bottom">{{t(timeList[0].text)}}</div>
          </div>
        </div>
      </div>

      <div class="time-line">
        <div class="left"></div>
        <div class="bottom"></div>
      </div>

      <div class="time-list" style="margin-top: 0;">
        <div class="time-list-one twoss">
          <div class="time-list-text">
            <div class="top">{{t('analysis')}}</div>
            <div class="bottom">{{t(timeList[1].text)}}</div>
          </div>
          <img src="/public/images/list.png" alt="" class="img-time" />
        </div>
      </div>

      <div class="time-line">
        <div class="right"></div>
        <div class="bottom-left"></div>
      </div>

      <div class="time-list" style="margin-top: 0;">
        <div class="time-list-one">
          <img src="/public/images/lists.png" alt="" class="img-time" />
          <div class="time-list-text">
            <div class="top">{{t('deployment')}}</div>
            <div class="bottom">{{t(timeList[2].text)}}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="footer">
      <img src="/public/images/bgfooter.png" alt="" class="img-bg" />
      <div class="text">{{t('journey')}}</div>
      <el-button type="primary" class="custom-button" :class="{ 'hover-effect': isHovered }"
        @mouseenter="handleMouseEnterFooter" @mouseleave="handleMouseLeaveFooter" @click="open">{{t('GetStarted')}}</el-button>
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


  </div>
</template>

<script setup>
  import {
    reactive,
    ref,
    onMounted,
    onUnmounted,
    watch
  } from 'vue'
  import {
    Scope
  } from 'tools-vue3'
  import {
    useI18n
  } from 'vue-i18n'
  import {
    useTransition
  } from '@vueuse/core'

  import {useRouter} from 'vue-router';
  const activeIndex = ref(0); // 当前活跃的 span 索引
  const interval = ref(null); // 用于存储定时器
  const router = useRouter();
  const source = ref(0)
  const source2 = ref(0)
  const outputValue = useTransition(source, {
    duration: 1500,
  })
  // const outputValueone = useTransition(source2, {
  //   duration: 1500,
  // })
  source.value = 25000
  source2.value = 25321

// 从js-cookie库中导入Cookie对象
import Cookies from 'js-cookie';
const loang = Cookies.get('language');

  // 挂载时启动定时器
  onMounted(() => {
    startInterval()
    window.addEventListener('resize', debounce(handleResize, 100)); //防抖操作
    updateCornerBoxStyle(); // 初始化样式边框移动效果

  });

  // 卸载时清除定时器
  onUnmounted(() => {
    stopInterval()
    window.removeEventListener('resize', debounce(handleResize, 100)); //防抖操作
  });


  const cornerBoxStyle = ref({
    left: '32%', // 初始位置
    top: '8.5%', // 明确设置顶部位置
    height: '15%', // 明确设置高度
    zIndex: 0, // 确保 z-index 被包含
    position: 'absolute' // 添加 position 属性
  });

  // 定义不同屏幕尺寸的样式
  const updateCornerBoxStyle = () => {
    const screenWidth = window.innerWidth;
    const language = Cookies.get('language') ? Cookies.get('language') : 'cn';
    const currentIndex = activeIndex.value;

    if (language === 'cn') {
      const top = screenWidth < 768 ? '9%' : '8%';
      const width = screenWidth < 768 ? '16%' : '17%';
      const height = screenWidth < 768 ? '10%' : '15%';
      const moveDistance = screenWidth < 768 ? '19.8%' : '18.7%';
      const baseLeft = '32%';

      cornerBoxStyle.value = {
        ...cornerBoxStyle.value,
        width,
        height,
        top,
        left: currentIndex === 1 ? `calc(${baseLeft} + ${moveDistance})` : baseLeft
      };
    } else {
      const left = screenWidth < 768 ? '23%' : '20%';
      const width = screenWidth < 768 ? (currentIndex === 1 ? '30%' : '21%') : (currentIndex === 1 ? '33%' : '28%');
      const height = screenWidth < 768 ? '10%' : '15%';
      const moveDistance = screenWidth < 768 ? '25.5%' : '26.1%';

      cornerBoxStyle.value = {
        ...cornerBoxStyle.value,
        width,
        height,
        left: currentIndex === 1 ? `calc(${left} + ${moveDistance})` : left
      };
    }
  };

  // 监听窗口大小变化
  const handleResize = () => {
    requestAnimationFrame(updateCornerBoxStyle);
  };

  // 防抖函数优化
  const debounce = (fn, delay) => {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  };

  // 优化 activeIndex 监听逻辑
  watch(activeIndex, (newIndex, oldIndex) => {
    if (newIndex === oldIndex) return;
    updateCornerBoxStyle();
  }, { flush: 'post' });

  const isHovered = ref(false);

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

  // 处理鼠标进入事件头部的使用
  // const handleMouseEnter = (index) => {
  //   activeIndex.value = index;
  // };


  // 定义一个方法来更新活跃的 span
  const updateActiveSpan = () => {
    activeIndex.value = (activeIndex.value + 1) % 2;
  };

  // 定义一个方法来设置定时器
  const startInterval = () => {
    interval.value = setInterval(updateActiveSpan, 5000); // 每 5 秒切换一次
  };

  // 定义一个方法来清除定时器
  const stopInterval = () => {
    if (interval.value) {
      clearInterval(interval.value);
      interval.value = null;
    }
  };

  const {
    t
  } = useI18n() //多语言化


  const timeList = reactive([{
      text: 'WebsiteAndAatabasetext'
    },
    {
      text: 'analysisText'
    },
    {
      text: 'deploymentText'
    }
  ])
  let list = ref([{
      icon: '/public/images/icon_one.png',
      name: 'efficiency',
      text: 'efficiencytext'
    },
    {
      icon: '/public/images/icon_two.png',
      name: 'efficient',
      text: 'efficienttext'
    },
    {
      icon: '/public/images/icon_three.png',
      name: 'server',
      text: 'servertext'
    }
  ])
  const conf = reactive({
    fetchData: async () => {},
    banners: [],
    newGames: [],
  })

  function redirectToWebsite() {
    window.location.href = "https://oneinstack.com";
  }

  function github(){
    window.location.href = "https://github.com/oneinstack/Oneinstack-Panel";
  }

  function open() {
    router.push({ path: "/download", hash: "#faq-section" });
  }




  conf.fetchData()
  Scope.setConf(conf)
</script>

<style scoped lang="scss">
  @import url("@/styles/css/TrueFocus.css");
  @import url("@/styles/css/home.scss");
</style>
