<template>
  <div class="order-box">
    <div class="modified-time">{{ $t('invite.LastModified') }}: {{ time }}</div>
    <div class="content">
      <div
        v-for="item in sliceData"
        :key="item.label"
        class="data-item"
        @click="item.link && $emit('click-link', item)"
      >
        <div class="label" :class="{ link: item.link }">{{ item.label }}</div>
        <div class="value">{{ item.value }}</div>
      </div>
      <div v-show="!isExpand" class="more" @click="$emit('expand')">
        <van-icon name="arrow-down" color="#575D67" size="32rem" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isExpand: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => Array.from({ length: 12 })
    },
    time: {
      type: String,
      default: ''
    }
  },

  computed: {
    sliceData() {
      return this.isExpand ? this.data : this.data.slice(0, 9)
    }
  }
}
</script>

<style scoped lang="less">
.order-box {
  padding: 18rem 20rem;
  width: 100%;
  height: 620rem;
  font-family: PingFang SC;

  .modified-time {
    font-size: 20rem;
    color: #c5c5c5;
  }

  .content {
    padding: 40rem 0;
    display: flex;
    flex-flow: row wrap;
    gap: 32rem 20rem;
    position: relative;

    .more {
      background: linear-gradient(to top, #fff 55%, transparent 100%);
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 142rem;
      display: flex;
      justify-content: center;
      padding-top: 64rem;
    }

    .data-item {
      width: 30%;
      height: 108rem;
      text-align: center;
      display: flex;
      flex-flow: column nowrap;
      justify-content: space-between;
      word-break: break-word;

      .label {
        font-size: 21rem;
        font-weight: 500;
        height: 28rem;
        line-height: 28rem;
        color: #666666;
        display: flex;
        align-items: center;
        justify-content: center;

        &.link {
          color: #fd2f3d;
        }
      }

      .value {
        font-size: 32rem;
        font-weight: 500;
        line-height: 44.8rem;
        letter-spacing: 0.045em;
        color: #fc9b01;
      }
    }
  }
}
</style>
