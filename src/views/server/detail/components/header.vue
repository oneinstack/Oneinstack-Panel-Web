<template>
  <div class="top">
    <x-statusbar />
    <van-nav-bar title="服务器" left-arrow @click-left="router.back()"></van-nav-bar>
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
import { useRouter } from 'vue-router'
const router = useRouter()
const list = reactive([
  { icon: 'website', num: 0, name: '网站', className: 'website' },
  { icon: 'safety', num: 0, name: '安全风险', className: 'safety' },
  { icon: 'data', num: 0, name: '数据', className: 'data' }
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
.top {
  position: fixed;
  top: 0;
  height: calc(434rem + 132rem);
  width: 100%;
  background: url('/static/img/server/detail-top-bg.png');
  background-repeat: no-repeat;
  background-size: 100%;
  .van-nav-bar {
    background: transparent;
    margin-top: 128rem;
    line-height: 40rem;
  }
  .card-list {
    display: flex;
    overflow-x: auto;
    flex-wrap: nowrap;
    height: 338rem;
    width: 100%;
    margin-top: 60rem;
    .card-item {
      flex-shrink: 0;
      height: 338rem;
      width: 246rem;
      border-radius: 36rem;
      background: var(--card-bg-color);
      margin-left: 24rem;
      text-align: center;
      position: relative; // 关键定位
      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 20rem; // 距离底部20rem
        transform: translateX(-50%);
        width: 44rem; // 严格匹配2个中文字符
        height: 4rem; // 边框粗细
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
