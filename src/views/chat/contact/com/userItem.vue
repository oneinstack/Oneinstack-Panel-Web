<template>
  <div class="anchor-item" @click="emit('click')">
    <div class="item-author">
      <img style="width: 100%; height: 100%;border-radius: 8rem;" :src="item.icon ? item.icon : '/static/img/home-banner.png'" />
      <div class="message-count flex flex-center" v-if="item.badge && item.badge > 0">
        {{ item.badge < 99 ? item.badge: '99+' }}
      </div>
    </div>
    <div class="item-name">{{ item.title || item }}</div>
    <div class="b-border" :style="{left: lastItem ? '24rem' : '116rem'}" v-if="showBodder"></div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  // 用户信息
  item: {
    default: {} as any,
  },
  //是否最后一项
  lastItem: {
    default: true
  },
  //是否显示下边框
  showBodder: {
    default: true
  }
})

const emit = defineEmits(['click'])

</script>
<style lang="less" scoped>
.anchor-item {
  display: flex;
  align-items: center;
  padding: 20rem 24rem;
  position: relative;

  .item-author {
    width: 76rem;
    height: 76rem;
    border-radius: 8rem;
    margin-right: 26rem;
    position: relative;

    .message-count {
      position: absolute;
      top: 5rem;
      right: 0;
      height: 36rem;
      background-color: #f45551;
      border-radius: 18rem;
      padding: 0 10rem;
      text-align: center;
      line-height: 36rem;
      transform: translate(50%, -50%);
      color: #fff;
    }
  }

  .item-name {
    font-size: 30rem;
    color: #333333;
    font-weight: 500;
  }
  .b-border{
    height: 2rem;
    background: #F6F7FA;
    position: absolute;
    bottom: 0;
    right: 0;
  }
}
</style>
