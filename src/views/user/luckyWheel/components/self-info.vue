<script setup lang="ts">
import { reactive } from 'vue'
import sconfig from '@/sstore/sconfig'

interface Props {
  /** 是否显示昵称 */
  name?: boolean
  /** 是否显示边框 */
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: true,
  border: true
})

const conf = reactive({
  avatarUrl: '',
  nickname: '',

  init() {
    if (!sconfig.userInfo) return
    const { userImgUrl, userNickname } = sconfig.userInfo
    conf.avatarUrl = userImgUrl
    conf.nickname = userNickname
  }
})
conf.init()
</script>

<template>
  <div class="self-info">
    <img class="avatar" :class="{ border }" :src="conf.avatarUrl" />
    <div v-if="props.name" class="nickname">{{ conf.nickname }}</div>
  </div>
</template>

<style scoped lang="less">
.self-info {
  width: 100%;
  position: absolute;
  left: 50%;
  top: -58rem;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;

  .avatar {
    width: 116rem;
    height: 116rem;
    border-radius: 50%;
    background-color: lightgray;

    &.border {
      border: 4rem solid #fff;
    }
  }

  .nickname {
    padding: 0 16rem;
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 124rem;
    height: 40rem;
    border-radius: 40rem;
    background-color: #fbdebe;
    font-size: 32rem;
    font-weight: 600;
    text-align: center;
    line-height: 40rem;
    color: #cd5e2c;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
