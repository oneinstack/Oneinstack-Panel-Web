<template>
  <div>
    <headSearch :customClick="true" @click="conf.isFocus = true" v-if="!chooseUser.length && !conf.isFocus" />
    <div class="list" v-else>
      <div class="user" v-scroll ref="leftRefs">
        <div class="info" v-for="item in chooseUser" :key="item.userID">
          <personItem :showName="false" :imgW="86" :person="item" />
        </div>
      </div>
      <van-search class="input" :autofocus="conf.isFocus" @blur="conf.isFocus = false" v-model="conf.value"
        @update:model-value="conf.changeInput" :placeholder="$t('chatRoom.search')" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import headSearch from '../com/headSearch.vue';
import personItem from '../com/personItem.vue';
import sutil from '@/sstore/sutil';
const props = defineProps({
  chooseUser: {
    default: [] as any[]
  }
})
const emit = defineEmits(['change'])
const leftRefs = ref<any>()
const conf = reactive({
  value: '',
  isFocus: false,
  changeInput(e: any) {
    emit('change', e)
  },
  leftTop() {
    if (props.chooseUser.length < 5) return
    let scrollLeft = (props.chooseUser.length - 4) * sutil.rem2px(110)

    leftRefs.value?.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
  }
})
watch(
  () => props.chooseUser,
  (val: any) => {
    setTimeout(() => {
      conf.leftTop()
    }, 100)
  },
  { deep: true }
)
</script>
<style lang="less" scoped>
.list {
  display: flex;
  align-items: center;
  background: #fff;
  width: 716rem;
  margin: 0 auto;
  padding: 20rem 0rem;
  border-radius: 4rem;
  margin-bottom: 20rem;

  .user {
    display: flex;
    max-width: 440rem;
    overflow-x: auto;

    .info {
      width: 90rem;
      margin-left: 20rem;
    }
  }

  ::v-deep .van-search__content {
    background: #fff;
    padding-left: 0;
  }

  ::v-deep .van-icon-search:before {
    content: "";
  }
}

.input {
  height: 100%;
  flex: 1;
  padding: 5rem;
  background: #fff;
}
</style>
