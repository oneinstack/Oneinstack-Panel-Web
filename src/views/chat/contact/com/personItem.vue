<template>
  <div class="person">
    <div :style="{ width: imgW + 'rem', height: imgW + 'rem' }" style="border-radius: 8rem;overflow: hidden;">
      <headImg class="face" :src="person.faceURL" />
    </div>
    <van-text-ellipsis v-if="showName" :content="person.nickname" />
  </div>
</template>
<script setup lang="ts">
import headImg from '../../components/headImg.vue';
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
