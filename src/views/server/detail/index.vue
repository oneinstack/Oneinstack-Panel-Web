<template>
  <x-page no-header tabbar no-footer>
    <x-statusbar />
    <div class="top">
      <van-nav-bar title="服务器" left-arrow @click-left="router.back()"></van-nav-bar>
      <div class="card-list">
        <div class="card-item" v-for="item in list">
          <van-image class="img" width="102rem" height="102rem" :src="item.icon" />
          <p>{{ item.num }}</p>
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>
    <div class="content">
      <Memo />
      <div class="server-info">
        <div class="cpu">
          <p class="title">cpu使用率</p>
          <p class="rate">38.7%</p>
          <div class="more" @click="goPage('cpu')">
            <van-icon class="icon" name="arrow" />
          </div>
        </div>
        <div class="ram">
          <p class="title">内存使用率</p>
          <p class="rate">18.7</p>
          <div class="more" @click="goPage('ram')">
            <van-icon class="icon" name="arrow" />
          </div>
        </div>
        <div class="disk">
          <p class="title">硬盘使用率</p>
          <p class="rate">38.7</p>
          <div class="more" @click="goPage('disk')">
            <van-icon class="icon" name="arrow" />
          </div>
        </div>
        <div class="io">
          <div class="header">
            <p class="title">流量</p>
            <div class="more" @click="goPage('flow')">
              <van-icon class="icon" name="arrow" />
            </div>
          </div>
          <div class="data-info">
            <div class="left">
              <p class="label">
                上行:
                <span>1125kb/s</span>
              </p>
              <p class="label">
                下行:
                <span>112kb/s</span>
              </p>
            </div>
            <van-divider vertical />
            <div class="right">
              <p class="label">
                总接收:
                <span>11kb/s</span>
              </p>
              <p class="label">
                总发送:
                <span>55555kb/s</span>
              </p>
            </div>
          </div>
        </div>
        <div class="io">
          <div class="header">
            <p class="title">磁盘IO</p>
            <div class="more" @click="goPage('io')">
              <van-icon class="icon" name="arrow" />
            </div>
          </div>
          <div class="data-info">
            <div class="left">
              <p class="label">
                上行:
                <span>1125kb/s</span>
              </p>
              <p class="label">
                下行:
                <span>112kb/s</span>
              </p>
            </div>
            <van-divider vertical />
            <div class="right">
              <p class="label">
                总接收:
                <span>11kb/s</span>
              </p>
              <p class="label">
                总发送:
                <span>55555kb/s</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import Memo from './components/memo.vue'
const router = useRouter()
const list = reactive([
  { icon: 'website', num: 2, name: '网站' },
  { icon: 'safety', num: 0, name: '安全风险' },
  { icon: 'data', num: 5, name: '数据' },
  { icon: '', num: 5, name: '数据' }
])
list.forEach((item) => {
  const _icon = item.icon
  item.icon = `/static/img/server/${_icon}.png`
})
const goPage = (type:string)=>{
  router.push({
    path:"/useRate",
    query:{
      type:type
    }
  })
}
</script>
<style lang="less" scoped>
.top {
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
      background: #ffffff;
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
        background: #333;
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
      }
    }
    .card-item:first-child {
      margin-left: 32rem;
    }
  }
}
.content {
  margin-top: 24rem;
  padding: 0 32rem;
  height: 100%;
  overflow-y: scroll;
  padding-bottom: 36rem;
  .server-info {
    display: flex;
    flex-wrap: wrap;
    .cpu,
    .ram,
    .disk {
      padding: 0 32rem;
      .title {
        font-size: 28rem;
        color: #393939;
        font-weight: 700;
        margin-top: 32rem;
        line-height: 24rem;
      }
      .rate {
        margin-top: 40rem;
        color: #f98f18;
        font-size: 40rem;
        line-height: 34rem;
      }
      .more {
        background: #f98f18;
        height: 32rem;
        width: 32rem;
        border-radius: 50%;
        margin-top: 40rem;
        display: flex;
        justify-content: center;
        align-items: center;
        .icon {
          color: #ffffff;
          font-size: 22rem;
        }
      }
    }
    .cpu,
    .ram {
      width: 328rem;
      height: 242rem;
      margin-top: 24rem;
    }
    .cpu {
      background: url('/static/img/server/cpu.png');
      background-size: 100%;
    }
    .ram {
      background: url('/static/img/server/ram.png');
      margin-left: 30rem;
      background-size: 100%;
    }
    .disk {
      width: 686rem;
      height: 242rem;
      margin-top: 24rem;
      background: url('/static/img/server/disk.png');
      background-size: 100%;
    }
    .io {
      height: 220rem;
      width: 686rem;
      background: url('/static/img/server/item.png');
      background-size: 100%;
      margin-top: 24rem;
      padding: 32rem;
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        line-height: 24rem;
        .title {
          font-size: 28rem;
          color: #393939;
          font-weight: 700;
        }
        .more {
          background: #f98f18;
          height: 32rem;
          line-height: 32rem;
          text-align: center;
          width: 32rem;
          border-radius: 50%;
          .icon {
            color: #ffffff;
            font-size: 22rem;
          }
        }
      }
      .data-info {
        margin-top: 44rem;
        height: 72rem;
        display: flex;
        justify-content: space-between;
        .left {
          padding-right: 64rem;
          flex: 1;
        }
        .right {
          padding-left: 64rem;
          flex: 1;
        }
        .left,
        .right {
          .label {
            font-size: 24rem;
            color: #999999;
            margin-top: 36rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            line-height: 20rem;
            span {
              font-size: 28rem;
              color: #f98f18;
            }
          }
          .label:first-child {
            margin-top: 0;
          }
        }
      }
    }
  }
}

:deep(.van-nav-bar__content) {
  height: 40rem;
}
:deep(.van-hairline--bottom:after) {
  border-bottom-width: 0;
}
:deep(.van-nav-bar__title) {
  font-size: 32rem;
  color: #ffffff;
}
:deep(.van-nav-bar .van-icon) {
  color: #ffffff;
}
</style>
