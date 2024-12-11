<template>
  <div class="bet_record_filter">
    <!-- <u-search
      v-model="keyword"
      :showAction="false"
      :placeholder="$t('chatRoom.search')"
      bgColor="#fff"
      shape="square"
      @change="$emit('search', $event)"
    /> -->
    <van-search @search="emit('search', $event)" v-model="conf.keyword" :placeholder="$t('chatRoom.search')" />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const emit = defineEmits(['search'])
const conf = reactive({
  keyword: ''
})

</script>

<style lang="less" scoped>
.bet_record_filter {
  padding: 24rem 32rem;
}
.van-search{
  padding: 0;
}
</style>
