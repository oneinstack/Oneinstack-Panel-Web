<template>
  <x-page no-header tabbar>
    <div class="head-fixed" v-if="conf.isHeadFixed">
      <x-statusbar />
    </div>
    <div class="head">
      <x-statusbar />
      <div style="height: 578rem; position: relative">
        <div class="setting" @click.stop="conf.pageToSettings">
          <van-icon name="setting-o" size="52rem"/>
          <!-- <VSIcon class="setting-img" lib="blue" name="settings" :size="52" /> -->
        </div>
      </div>
    </div>
    <div class="menu-list">
      <div class="menu-item">
        <div v-for="(item, index) of conf.menu1.flat()" :key="index">
          <van-cell
            is-link
            @click="conf.handle(item)"
          >
            <!-- 使用 title 插槽来自定义标题 -->
            <template #icon>
              <div class="flex items-center">
                <img class="menu-icon" :src="item.leftImg" />
              </div>
            </template>
            <template #title>
              <span>{{ item.name.indexOf('me.') > -1 ? $t(item.name) : item.name }}</span>
            </template>
          </van-cell>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { index } from './index'

const conf = index();
</script>

<style lang="less" scoped>
.head-fixed {
  position: fixed;
  top: 0;
  z-index: 99;
  width: 100%;
  max-width: 750rem;
  background-image: linear-gradient(180deg, #eb602d 0%, #ffa64f 108.78%);
  padding: 0rem 24rem;

  .head-user {
    height: 100rem;
    display: flex;
    align-items: center;

    .head-img {
      width: 64rem;
      height: 64rem;
      margin-right: 24rem;
      border-radius: 32rem;
    }

    span {
      color: rgb(255, 255, 255);
      font-size: 28rem;
      font-weight: Bold;
      letter-spacing: -0.3px;
    }
  }
}

.head {
  width: 100%;
  position: relative;
  background: linear-gradient(#eb602d 0%, #f68740 51%, rgba(255, 166, 79, 0) 100%);

  .head-bg {
    position: absolute;
    top: 0rem;
    bottom: 40rem;
    width: 100%;

    .bg-img {
      width: 100%;
      height: 100%;
    }
  }

  .setting {
    width: 88rem;
    height: 88rem;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 70rem;
    right: 40rem;
    z-index: 2;
  }

}

.menu-list {
  margin-top: -30rem;
  padding: 0 30rem;
  z-index: 2;
  position: relative;
  text-transform: capitalize;
}

.menu-item {
  background: #fff;
  border-radius: 10rem;
  overflow: hidden;
}

.menu-icon {
  width: 32rem;
  height: 32rem;
  margin-right: 42rem;
}

</style>
.