<template>
  <x-page no-header tabbar>
    <div class="header">
      <x-statusbar />
      <UserInfo />
      <Search />
    </div>
    <div class="content">
      <ServerStatusList />
      <ApplicationList />
      <FileList />
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import UserInfo from './components/userInfo.vue';
import Search from './components/search.vue';
import ServerStatusList from "./components/serverStatusList.vue"
import ApplicationList from './components/applicationList.vue';
import FileList from './components/fileList.vue';
</script>

<style lang="less" scoped>
.header {
  position: fixed;
  top: 0;
  height: 332rem;
  width: 750rem;
  background: url('/static/img/home/home.png');
  background-size: 100% 100%;
  padding: 0 36rem;
}
.content {
  height: calc(100% - 432rem);
  background: var(--bg-color);
  border-radius: 32rem;
  margin-top: -24rem;
  padding: 0 32rem 68rem 32rem;
  margin-top: 260rem;
  overflow: scroll;
  z-index: 2;
}
</style>
