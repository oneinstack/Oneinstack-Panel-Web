<template>
  <x-page no-header tabbar>
    <div class="header head-fixed">
      <x-statusbar />
      <UserInfo />
      <Search />
    </div>
    <!-- <div class="header">
      <UserInfo />
      <Search />
    </div> -->
    <div class="content">
      <div class="server_status">
        <div class="item-title">
          <p class="name">{{$t('home.serverStatus')}}</p>
          <p class="more" @click="goDetail()">
            更多
            <span><van-icon name="arrow" /></span>
          </p>
        </div>
        <serverStatus />
      </div>
      <div class="application">
        <div class="item-title">
          <p class="name">应用程序</p>
        </div>
        <div class="app-list">
          <template v-for="(item, index) in appList">
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
              <p class="name">更多应用</p>
            </div>
          </template>
        </div>
      </div>
      <div class="file">
        <div class="item-title">
          <p class="name">最近文件</p>
        </div>
        <file-card :list="fileList">
          <template #time="{ item }">
            <p class="update_date">修改时间：2024-05-18</p>
          </template>
          <template #operation="{ item }">
            <div class="btn">查看</div>
          </template>
        </file-card>
      </div>
    </div>
  </x-page>
</template>
<script lang="ts" setup>
import { reactive } from 'vue'
import { index } from './home'
import { useRouter } from 'vue-router'
import UserInfo from './components/userInfo.vue';
import Search from './components/search.vue';
import serverStatus from "./components/serverStatus.vue"
const router = useRouter();
const conf = index()
const serverNameClass: any = {
  0: 'green',
  1: 'yellow',
  2: 'blue'
}
const goDetail = ()=>{
  router.push({
    path:"/serverDetail"
  })
}
const appList = reactive([
  {
    icon: 'cpu',
    name: 'OpenResty'
  },
  {
    icon: 'ram',
    name: 'MySQL'
  },
  {
    icon: 'disk',
    name: 'Halo'
  },
  {
    icon: 'cpu',
    name: 'OpenResty'
  },
  {
    icon: 'ram',
    name: 'MySQL'
  },
  {
    icon: 'disk',
    name: 'Halo'
  },
  {
    icon: 'ram',
    name: 'MySQL'
  },
  {
    icon: 'disk',
    name: 'Halo'
  }
])
const fileList = reactive([
  {
    fileType: 'file',
    name: '文件1'
  },
  {
    fileType: 'files',
    name: '文件夹1'
  },
  {
    fileType: 'file',
    name: '文件2'
  },
  {
    fileType: 'files',
    name: '文件夹2'
  }
])
fileList.forEach((item:any, index) => {
  const _icon = item.fileType
  item.icon = `/static/img/home/${_icon}.png`
})

</script>

<style lang="less" scoped>
.header {
  position: fixed;
  top: 0;
  height: 432rem;
  width: 100%;
  background: url('/static/img/home/home.png');
  background-size: 100% 100%;
  padding: 0 36rem;
}
.content {
  height: calc(100% - 432rem);
  background: #f7f7f7;
  border-radius: 32rem;
  margin-top: -24rem;
  padding: 0 32rem 68rem 32rem;
  margin-top: 432rem;
  overflow: scroll;
  .server_status,
  .application,
  .file {
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
          background: orange;
          border-radius: 5rem;
        }
      }
      .more {
        color: #9c9c9c;
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
          background: #ffffff;
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
}
.update_date {
  font-size: 28rem;
  color: #a5a5a5;
}
.btn {
  width: 90rem;
  height: 48rem;
  border-radius: 8rem;
  border: 2rem solid #f98f18;
  color: #f98f18;
  text-align: center;
  line-height: 48rem;
}
.green {
  color: #10b68a;
}
.yellow {
  color: #f98f18;
}
.blue {
  color: #1795db;
}
</style>
