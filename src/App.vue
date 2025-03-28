<template>
  <div class="app-container">
    <nav-bar>
      <template #left><!--头部左侧-->
        <router-link to="/" class="logo-box" @click="setSelectedIndex(-1)">
          <img src="/public/images/logo.png" alt="" class="img" />
        </router-link>
      </template>
      <template #center><!--头部中侧-->

      </template>
      <template #right><!--头部右侧-->
        <ul class="nav-block">
          <li v-for="(nav,index) in nav.list" :key="nav.path">
            <router-link v-if="nav.path !== '/s'" :to="nav.path" class="link"
              :class="{ active: route.path === nav.path }" @click="handleNavClick(nav.path, index)">
              {{ nav.label }}
              <img v-show="route.path === nav.path" src="/public/images/rund.png" alt=""
                style=" top: 64%; left: 40%; position: absolute; width: 20%; height: 8%;" />
            </router-link>
            <el-dropdown v-else trigger="click" @command="switchLanguage">
              <span class="language-icon">
                <img src="/public/images/lang.png" alt="" style="width: 30px; height: 25px;" />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="cn" :class="{ active: language === 'cn' }">
                    简体中文
                  </el-dropdown-item>
                  <el-dropdown-item command="en" :class="{ active: language === 'en' }">
                    English
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </li>
        </ul>

        <button class="menu-btn"  @click="nav.show = !nav.show">
          <svg class="svg-inline--fa fa-bars" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bars"
            role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path class="" fill="currentColor"
              d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z">
            </path>
          </svg>
          <span>MENU</span>
        </button>
      </template>
    </nav-bar>
    <div v-show="search.show" class="search-input row">
      <div class="input-box">
        <input v-model="search.value" type="text" class="input" />
        <button class="btn" @click="search.close">
          <svg class="svg-inline--fa fa-xmark" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark"
            role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
            <path class="" fill="currentColor"
              d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z">
            </path>
          </svg>
        </button>
      </div>
    </div>

    <transition name="slide-bottom">
    <ul v-show="nav.show" class="nav-list" @click="nav.close">
      <li v-for="(nav,index) in nav.list" :key="nav.path">
        <router-link v-if="nav.path && nav.path !== '/s'" :to="nav.path" class="link"
          :class="{ active: route.path === nav.path }"
          @click="handleMobileNavClick(nav.path, nav.label,index)">
          {{ nav.label }}
        </router-link>
        <span v-else-if="nav.path === ''" class="link" @click="handleEmptyPath">{{ nav.label }}</span>
      </li>
    </ul>
  </transition>


    <router-view #default="{ Component }" class="main">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <back-top />
  </div>
</template>

<script setup>
  import {
    useCounterStore
  } from '@/stores/index.js'
  import NavBar from '@/components/nav-bar.vue'
  import {
    onMounted,
    reactive,
    ref,
  } from 'vue'
  import {
    useRoute
  } from 'vue-router'
  import {
    useI18n
  } from 'vue-i18n'
  import BackTop from '@/components/back-top.vue'
  import {
    ElMessage
  } from 'element-plus'; // 引入 Element Plus 的消息提示组件

  const {
    t,
    locale
  } = useI18n()

  // const isMobile = ref(false);
  const route = useRoute(); // 获取当前路由信息


  const search = reactive({
    show: false,
    keywords: '',
    close: () => {
      search.keywords = ''
      search.show = false
    }
  })

  const Store = useCounterStore(); //引入pinia
  const nav = reactive({
    show: false,
    close: () => {
      nav.show = false
    },
    list: [{
        label: t('download'),
        path: '/download'
      },
      {
        label: t('appstore'),
        path: '/appStore'
      },
      {
        label: t('forumhelp'),
        path: ''
      },
      {
        label: '', // 这里 label 只是一个占位符，实际渲染时会替换为 language-switch
        path: '/s',
      }
    ]
  })

  // 设置选中的下标
  const setSelectedIndex = (index) => {
    Store.setSelectedIndex(index); // 这里会自动处理本地存储
    nav.show = false; // 关闭菜单
  };
  // 语言切换逻辑
const language = ref(document.cookie.split('; ').find(row => row.startsWith('language='))?.split('=')[1] || 'cn'); // 默认选中中文
  const switchLanguage = (lang) => {
    console.log(lang)
    language.value = lang;
    // 这里可以添加语言切换的逻辑，比如调用 i18n 切换语言
    console.log(`切换到 ${lang}`);
    document.cookie = `language=${lang}`
    // 设置 HTML lang 属性
    document.documentElement.lang = lang;
    locale.value = lang
    window.location.reload()
  };
  // 处理导航点击事件
  const handleNavClick = (path, index) => {
    console.log('路由',path)
    setSelectedIndex(index);
    if (index === 2) {
      // 显示提示信息
      ElMessage.info('开发中，敬请期待');
    }
  };
  // 添加移动端导航点击处理方法
const handleMobileNavClick = (path, label, index) => {
  nav.show = false; // 关闭菜单
  setSelectedIndex(index); // 添加存储下标功能
  if (label === t('forumhelp')) {
    ElMessage.info('开发中，敬请期待');
  }
};
  // 处理空路径的点击
const handleEmptyPath = () => {
  nav.show = false; // 关闭菜单
  ElMessage.info('开发中，敬请期待');
};
  onMounted(() => {
    // 在组件挂载时设置初始语言
    document.documentElement.lang = language.value;
    // const ageRestriction = localStorage.getItem('age-restriction')
    // if (!ageRestriction) modal.show = true
  })
</script>

<style scoped lang="scss">
  @import url('styles/css/app.scss');

  /* 使用穿透语法覆盖 Element Plus 的内部样式 */
  ::v-deep(.el-dropdown-menu__item:not(.is-disabled):focus),
  ::v-deep(.el-dropdown-menu__item:not(.is-disabled):hover) {
    background-color: #fff;
    /* 悬停或聚焦时的背景颜色 */
    color: var(--primary-color);
    /* 悬停或聚焦时的字体颜色 */
  }

  ::v-deep(.el-dropdown-menu__item) {
    font-weight: bold;
  }
</style>
