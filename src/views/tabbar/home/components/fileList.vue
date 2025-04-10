<template>
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
</template>
<script setup lang="ts">
import { reactive } from 'vue'
const fileList = reactive([
  {
    fileType: 'file',
    name: '文件1'
  },
  {
    fileType: 'folder',
    name: '文件夹1'
  },
  {
    fileType: 'file',
    name: '文件2'
  },
  {
    fileType: 'folder',
    name: '文件夹2'
  }
])
fileList.forEach((item: any, index) => {
  const _icon = item.fileType
  // item.icon = `/static/img/home/${_icon}.png`
  item.icon = `${_icon}`
})
</script>
<style lang="less" scoped>
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
        background: var(--primary-color);
        border-radius: 5rem;
      }
    }
    .more {
      color: var(--font-gray-color);
    }
  }
}
.update_date {
  font-size: 28rem;
  color: var(--font-gray-color);
}
.btn {
  width: 90rem;
  height: 48rem;
  border-radius: 8rem;
  border: 2rem solid var(--primary-color);
  color: var(--primary-color);
  text-align: center;
  line-height: 48rem;
}
</style>
