<template>
  <div class="active-button relative" :class="[type, active ? 'active' : '']" @click="handleClick">
    <template v-if="type === 'orange'">
      <img :style="{ opacity: active ? 0 : 1 }" src="/static/img/luckybox/btn/btn-orange.png" />
      <img class="img" :class="{ active }" src="/static/img/luckybox/btn/btn-orange-active.png" />
    </template>

    <template v-if="type === 'pink'">
      <img :style="{ opacity: active ? 0 : 1 }" src="/static/img/luckybox/btn/btn-pink.png" />
      <img class="img" :class="{ active }" src="/static/img/luckybox/btn/btn-pink-active.png" />
    </template>

    <template v-if="type === 'purple'">
      <img :style="{ opacity: active ? 0 : 1 }" src="/static/img/luckybox/btn/btn-purple.png" />
      <img class="img" :class="{ active }" src="/static/img/luckybox/btn/btn-purple-active.png" />
    </template>

    <div class="text" :class="{ active }">{{ text }}</div>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: 'pink'
    },
    text: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      active: false
    }
  },

  methods: {
    handleClick() {
      this.active = true
      this.$emit('click')
      setTimeout(() => {
        this.active = false
      }, 100)
    }
  }
}
</script>

<style scoped lang="less">
.active-button {
  width: 204rem;
  height: 116rem;

  img {
    width: 100%;
    height: 100%;
  }

  .img {
    height: 106rem;
    position: absolute;
    bottom: 0;
    left: 0;
    opacity: 0;

    &.active {
      opacity: 1;
    }
  }

  .text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    font-family: PingFang SC;
    font-size: 22rem;
    font-weight: 500;
    text-align: center;
    color: #ffffff;
    letter-spacing: -0.02rem;
    line-height: 88rem;

    &.active {
      line-height: 120rem;
    }
  }
}
</style>
