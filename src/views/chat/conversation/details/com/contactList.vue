<template>
  <van-index-bar z-index="3" :index-list="getChooseData.indexList">
    <template v-for="(item, index) in getChooseData.dataList" :key="index">
      <van-index-anchor :index="getChooseData.indexList[index]" />
      <template v-for="(user, i2) in item" :key="i2">
        <userItem
        :item="user"
        :lastItem="i2 == (item.length - 1)"
        :checked="checkedIDList.includes(user.userID)"
        :disabled="disabledIDList.includes(user.userID)"
        
        :checkVisible="true"
        @click="emit('updateCheck',user)"
      />
      </template>
    </template>
  </van-index-bar>
</template>
<script setup lang="ts">
import userItem from '@/views/chat/contact/com/userItem.vue';
const props = defineProps({
  getChooseData: {
    default: {} as any
  },
  checkedIDList: {
    default: [] as any[]
  },
  disabledIDList: {
    default: [] as any[]
  },
})
const emit = defineEmits(['updateCheck'])
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
</style>
