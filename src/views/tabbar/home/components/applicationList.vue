<template>
  <div class="application">
    <div class="item-title">
      <p class="name">{{ $t("home.applications") }}</p>
    </div>
    <div v-if="app.list.length > 0" class="app-list">
      <template v-for="(item, index) in app.list">
        <div v-if="index < 7" class="app_card">
          <div class="icon_box">
            <van-image width="68rem" height="68rem" :src="item.icon" />
          </div>
          <p class="name">{{ item.name }}</p>
        </div>
        <div v-else class="app_card">
          <div class="icon_box">
            <van-image width="68rem" height="68rem" :src="item.icon" />
          </div>
          <p class="name">{{ $t("home.moreApplication") }}</p>
        </div>
      </template>
    </div>
    <div class="empty" v-else>
      <van-empty :description="$t('commons.emptyApplication')" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { onMounted, reactive } from 'vue'
const app = reactive({
    parmas: {
      // installed:false,
      page: 1,
      pageSize: 10
    },
    list: [] as any[]
})
const getAppList = () => {
    apis.getSoftList(app.parmas).then((res) => {
      app.list = res.data?.data || [];
    })
}
onMounted(() => {
  getAppList();
})
</script>
<style lang="less" scoped>
.application {
  .item-title {
    margin-top: 44rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .name {
      font-size: 32rem;
      font-family: 'PingFang SC-Medium';
      font-weight: 700;
      position: relative;
      display: inline-block; // 关键：让元素宽度自适应内容

      &::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: -4rem; // 调整边框与文字间距
        width: 44rem; // 继承文字宽度
        height: 8rem;
        background: var(--primary-color);
        border-radius: 5rem;
      }
    }
    .more {
      color: var(--font-gray-color);
    }
  }
  .app-list {
    display: flex;
    flex-wrap: wrap;
    .app_card {
      margin-top: 32rem;
      margin-right: 40rem;
      text-align: center;
      .icon_box {
        width: 140rem;
        height: 140rem;
        background: var(--card-bg-color);
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .name {
        margin-top: 16rem;
      }
    }
    .app_card:nth-of-type(4n) {
      margin-right: 0;
    }
  }
}
</style>
