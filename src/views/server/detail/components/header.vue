<template>
  <div class="top">
    <x-statusbar />
    <van-nav-bar :title="$t('home.server')" left-arrow @click-left="router.back()"></van-nav-bar>
    <div class="card-list">
      <div class="card-item" v-for="item in list">
        <van-image class="img" width="102rem" height="102rem" :src="item.icon" />
        <p :class="item.className">{{ item.num }}</p>
        <span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { apis } from '@/api'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
const list = reactive([
  { icon: 'website', num: 0, name: t('home.website'), className: 'website' },
  { icon: 'safety', num: 0, name: t('home.safety'), className: 'safety' },
  { icon: 'data', num: 0, name: t('home.data'), className: 'data' }
])
list.forEach((item: any) => {
  const _icon = item.icon
  item.icon = `/static/img/server/${_icon}.png`
})
//获取网站数量
const getWebsiteCount = () => {
  apis.getWebsiteCount().then((res: any) => {
    list[0].num = res.data || 0
  })
}
//获取数据库数量
const getDatabaseCount = () => {
  apis.getDatabaseCount().then((res: any) => {
    list[2].num = res.data || 0
  })
}
onMounted(() => {
  getWebsiteCount()
  getDatabaseCount()
})
</script>
<style scoped lang="less">
:deep(.van-nav-bar__content) {
  height: auto;
}
.top {
  position: fixed;
  top: 0;
  height: calc(434rem - 100rem);
  width: 750rem;
  background: url('/static/img/server/detail-top-bg.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  .van-nav-bar {
    background: transparent;
    // margin-top: 128rem;
    // line-height: 108rem;
    padding: 44rem 0;
  }
  .card-list {
    display: flex;
    overflow-x: auto;
    flex-wrap: nowrap;
    height: 338rem;
    width: 100%;
    margin-top: 24rem;
    .card-item {
      flex-shrink: 0;
      height: 338rem;
      width: 246rem;
      border-radius: 36rem;
      background: var(--card-bg-color);
      margin-left: 24rem;
      text-align: center;
      position: relative;
      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 20rem;
        transform: translateX(-50%);
        width: 44rem;
        height: 4rem;
      }
      &:nth-child(1)::after {
        background: #00d881;
      }
      &:nth-child(2)::after {
        background: #154afc;
      }
      &:nth-child(3)::after {
        background: #ea00cb;
      }
      .img {
        margin-top: 40rem;
      }
      p {
        margin-top: 32rem;
        font-size: 60rem;
      }
      span {
        margin-top: 32rem;
        color: var(--font-gray-color);
      }
    }
    .card-item:first-child {
      margin-left: 32rem;
    }
  }
}
.website {
  color: #00d881;
}
.safety {
  color: #154afc;
}
.data {
  color: #ea00cb;
}
</style>
