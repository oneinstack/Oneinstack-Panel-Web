<template>
  <div class="person">
    <img :style="{width: imgW+'rem',height: imgW+'rem'}" :src="person.faceURL" />
    <van-text-ellipsis v-if="showName" :content="person.nickname" />
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  person: {
    default: {} as any
  },
  showName: {
    default: true
  },
  imgW: {
    default: 96
  }
})
</script>
<style lang="less" scoped>
.person {
  width: 100%;
  color: #999;
  font-size: 22rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  img {
    border-radius: 8rem;
  }
}
</style>
