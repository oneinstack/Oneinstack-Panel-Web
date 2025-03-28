<template>
  <div style="width: 100%; height: 100%;">
    <div class="content-download" style="padding: 0;">
      <div style="display: flex; align-items: center;">
      </div>
      <div class="edition" style="margin-top: 0px;">
        <div class="edition-top"><span>{{t('formal')}}: 0.0.1</span></div>
        <div class="edition-bottom"><span>{{t('versions')}}</span><span
            style="color: var(--primary-color); margin-left: 24px;">{{t('Clist')}}</span></div>
      </div>
      <div class="ss-max">
        <div class="ss-box">
          <span>{{text}}</span>
        </div>
        <el-button type="primary" class="custom-buttons minis">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <img src="/public/images/copy.png" alt="" class="custom-iconcopy" />
            {{t('copy')}}
          </div>
        </el-button>
      </div>
    </div>
    <el-divider border-style="dashed" ></el-divider>
    <div class="content-download" style="padding: 0;">
      <div style="display: flex; align-items: center;">
      </div>
      <div class="edition" style="margin-top: 80px;">
        <div class="edition-top"><span>{{t('formal')}}: 0.0.1</span></div>
        <div class="edition-bottom"><span>{{t('versions')}}</span><span
            style="color: var(--primary-color); margin-left: 24px;">{{t('Clist')}}</span></div>
      </div>
      <div class="ss-max">
        <div class="ss-box">
          <span>{{text}}</span>
        </div>
        <el-button type="primary" class="custom-buttons minis">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <img src="/public/images/copy.png" alt="" class="custom-iconcopy" />
            {{t('copy')}}
          </div>
        </el-button>
      </div>
    </div>
  </div>

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
  } = useI18n()
  const text = ref(
    'if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/install_panel.sh;else wget -O install_panel.sh https://download.bt.cn/install/install_panel.sh;fi;bash install_panel.sh ed8484bec'
  )

</script>

<style scoped lang="scss">
  @import url('../styles/css/game.scss');
</style>
