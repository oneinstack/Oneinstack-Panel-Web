<template>
  <van-popup class="sort-popup" v-model:show="show" round position="bottom" :style="{ height: '480rem' }">
    <div class="navbar">
      <p>排序</p>
      <van-image class="icon" width="36rem" height="36rem" :src="`/static/img/file/close.png`" @click="show = false" />
    </div>
    <div class="sort-list">
      <div class="sort-item" v-for="item in list" @click="onSort(item)">
        <van-image
          v-if="item.id == checkSortType"
          class="icon"
          width="28rem"
          height="28rem"
          :src="`/static/img/file/checked-icon.png`"
        />
        <span :class="item.id == checkSortType ? 'active' : ''">{{ item.name }}</span>
      </div>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
const emit = defineEmits(['change'])
const checkSortType = ref(1)
const show = ref<boolean>(false)
const list = reactive([
  {
    id: 1,
    name: '按时间修改'
  },
  {
    id: 2,
    name: '按打开时间'
  },
  {
    id: 3,
    name: '按文件名'
  },
  {
    id: 4,
    name: '按文件大小'
  }
])
const onSort = (item: any) => {
  checkSortType.value = item.id
  emit('change', item)
  show.value = false
}
const open = () => {
  show.value = true
}
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.sort-popup {
  padding: 0 32rem;
  .navbar {
    height: 108rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-bottom: 2rem solid #e3e3e3;
    font-size: 32rem;
    color: #000000;
    font-weight: 700;
    .icon {
      margin-left: 266rem;
    }
  }
  .sort-list {
    .sort-item {
      margin-top: 52rem;
      line-height: 24rem;
      font-size: 24rem;
      color: #5d5d5d;
      span {
        margin-left: 44rem;
      }
      .active {
        color: #f98f18;
        margin-left: 16rem;
      }
    }
    .sort-item:first-child {
      margin-top: 40rem;
    }
  }
}
</style>
