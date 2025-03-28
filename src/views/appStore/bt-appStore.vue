<template>
  <div class="base-about-container">
    <header class="header">
      <div class="header-left" style="margin-top: 4%;">
        <div class="top">
          <div class="max-text">Oneinstack {{t('appstore')}}</div>
          <div class="mini-text">{{t('Rich')}}</div>
        </div>
        <div>
          <el-input v-model="input" class="custom-input" :placeholder="t('Please')">
            <template #prefix>
              <img src="/public/images/Frame.png" alt="搜索图标" class="custom-icon" />
            </template>
          </el-input>
        </div>
      </div>
      <div class="header-right">
        <div style="width: 700px; height: 620px;">
          <spline-viewer url='/public/scene.splinecode'>
          </spline-viewer>
        </div>
      </div>
    </header>
    <section class="section">
      <div class="section-box">
        <div style="font-size: 32px; font-weight: bold;">{{t('ProductCategory')}}</div>
        <div style="width: 30px; height: 6px;border-radius: 10px; background-color: #FF8E0F; margin-top: 26px;"></div>
      </div>
      <ul>
        <li v-for="item in list" :key="item.id" @click="selectItem(item)">
          <p><span :class="{ 'name-selected': selectedItem?.id === item.id }">{{t(item.name)}}</span> <span
              :class="{ 'name-selecteds': selectedItem?.id === item.id }">({{item.num}})</span></p>
          <img v-if="selectedItem?.id === item.id" src="../../../public/images/Group83.png" class="user-image" />
        </li>
      </ul>

      <div style="display: flex; justify-content: center; margin-bottom: 40px;">
        <el-row :gutter="0">
          <el-col :span="8" v-for="item in lists" :key="item.id" @click="selectItem(item)">
            <div class="box-max">
              <img src="/public/images/Group.png" alt="" style="width: 62px; height: 62px; margin-bottom: 26px;" />
              <div>
                <div><span style="font-size: 24px; font-weight: bold;">{{item.name}}</span><span style="font-size: 16px; font-weight: bold; margin-left: 10px; color: #FF8E0F;">({{item.text}})</span></div>
                <div style="font-size: 18px; color: #5A5A5A; font-weight: bold; margin-top: 16px;">{{item.content}}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>


    </section>
    <footer class="footer-bottom">
      <div class="top">
        <div style="width: 70%; height: 100%;">
          <img src="/public/images/logo-while.png" alt="" class="footer-logo" />
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
    ref,
    onMounted
  } from 'vue';
  import {
    useI18n
  } from 'vue-i18n'
  const {
    t
  } = useI18n() //多语言化
  const input = ref('')
  onMounted(() => {
    let isScriptLoaded = false;
    const handleSplineScript = () => {
      if (isScriptLoaded) return;
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.69/build/spline-viewer.js'
      script.onload = () => {
        isScriptLoaded = true;
        // 脚本加载完成后，可以执行其他操作
      };
      document.head.appendChild(script)
    }
    // 初始化时检查
    handleSplineScript()

    // 监听窗口大小变化
    window.addEventListener('resize', handleSplineScript)
  })

  // 定义列表数据
  const list = ref([{
      id: 1,
      name: 'All',
      num: 134
    },
    {
      id: 2,
      name: 'webServer',
      num: 100
    },
    {
      id: 3,
      name: 'Archive',
      num: 30
    },
    {
      id: 4,
      name: 'OperatingEnvironment',
      num: 4
    },
  ]);

  // 定义列表数据
  const lists = ref([{
      id: 1,
      name: 'OpenResty',
      text: 'web服务器',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    },
    {
      id: 2,
      name: 'MYSQL',
      text: '数据库',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    },
    {
      id: 3,
      name: 'Halo',
      text: '建站',
      content: '强大易用的开源建站工具'
    },
    {
      id: 4,
      name: 'OpenResty',
      text: 'web服务器',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    },
    {
      id: 5,
      name: 'OpenResty',
      text: 'web服务器',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    },
    {
      id: 6,
      name: 'OpenResty',
      text: 'web服务器',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    },
    {
      id: 7,
      name: 'OpenResty',
      text: 'web服务器',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    },
    {
      id: 8,
      name: 'OpenResty',
      text: 'web服务器',
      content: '基于 NGINX 和 LuaJIT 的 Web 平台'
    }
  ]);

  // 定义当前选中的项
  const selectedItem = ref(list.value[0]);
  // 定义当前选中的项
  // const selectedItemone = ref(1);

  // 点击选中项
  function selectItem(item) {
    selectedItem.value = item;
  }



</script>

<style scoped lang="scss">
  @import url('@/styles/css/appstore.scss');

</style>
