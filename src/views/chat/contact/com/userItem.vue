<template>
  <div class="anchor-item" @click="conf.changeUser">
    <!-- 禁止选择 -->
    <div class="item-disabled" v-show="disabled"></div>
    <!-- 选择 -->
    <div class="check" :class="{ 'active': checked || disabled }" v-if="checkVisible">
      <van-icon name="success" color="#fff" size="25rem" />
    </div>
    <!-- 个人信息 -->
    <div class="user-info">
      <div class="item-author">
        <div style="width: 100%; height: 100%;border-radius: 8rem;overflow: hidden;">
          <headImg class="face" :src="item.faceURL" />
        </div>
        <div class="message-count flex flex-center" v-if="item.badge && item.badge > 0">
          {{ item.badge < 99 ? item.badge : '99+' }}
        </div>
      </div>
      <div class="item-name">{{ item.nickname || item.title }}</div>
      <div style="flex: 1;text-align: right;padding-right: 20rem;" v-if="single">
        <van-icon color="#07c261" size="30rem" name="success" />
      </div>
      <div class="b-border" :style="{ left: lastItem ? '24rem' : '116rem' }" v-if="showBodder"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import headImg from '../../components/headImg.vue';

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
  },
  //是否选中
  checked: {
    default: false
  },
  //是否禁止选择
  disabled: {
    default: false
  },
  // 是否显示选择功能
  checkVisible: {
    default: false
  },
  // 选择单个
  single: {
    default: false
  }
})

const emit = defineEmits(['click'])

const conf = reactive({
  changeUser() {
    if (props.disabled) return
    emit('click')
  }
})

</script>
<style lang="less" scoped>
.anchor-item {
  display: flex;
  align-items: center;
  padding-left: 24rem;
  position: relative;

  .check {
    border-radius: 50%;
    width: 36rem;
    height: 36rem;
    border: 2rem solid #999;
    margin-right: 24rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 4rem;

    &.active {
      background: #07c261;
      border-color: #07c261;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    position: relative;
    padding: 20rem 0rem;
    width: 100%;
  }

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
      height: 34rem;
      background-color: #f45551;
      border-radius: 18rem;
      padding: 0 16rem;
      text-align: center;
      line-height: 34rem;
      transform: translate(50%, -50%);
      color: #fff;
      font-size: 24rem;
    }
  }

  .item-name {
    font-size: 30rem;
    color: #333333;
    font-weight: 500;
  }

  .b-border {
    height: 2rem;
    background: #F6F7FA;
    position: absolute;
    bottom: 0;
    right: 0;
  }
}

.item-disabled {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #fff;
  backdrop-filter: blur(20px);
  opacity: 0.5;
}
</style>
