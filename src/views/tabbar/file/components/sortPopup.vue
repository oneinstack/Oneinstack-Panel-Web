<template>
  <van-popup class="sort-popup" v-model:show="show" round position="bottom" :style="{ height: '480rem' }">
    <div class="navbar">
      <p>{{ $t("file.sort") }}</p>
      <van-image class="icon" width="36rem" height="36rem" :src="`/static/img/file/close.png`" @click="show = false" />
    </div>
    <div class="sort-list">
      <div class="sort-item" v-for="item in list" @click="onSort(item)">
        <van-image
          v-if="item.id == checkSortType"
          class="icon"
          width="28rem"
          height="28rem"
          :src="`/static/img/file/checked-icon.png`"
        />
        <span :class="item.id == checkSortType ? 'active' : ''">{{ item.name }}</span>
      </div>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const emit = defineEmits(['change'])
const checkSortType = ref(1)
const show = ref<boolean>(false)
const list = reactive([
  {
    id: 1,
    name: t('file.sortTime')
  },
  {
    id: 2,
    name: t('file.sortOpen')
  },
  {
    id: 3,
    name: t('file.sortName')
  },
  {
    id: 4,
    name: t('file.sortSize')
  }
])
const onSort = (item: any) => {
  checkSortType.value = item.id
  emit('change', item)
  show.value = false
}
const open = () => {
  show.value = true
}
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.sort-popup {
  padding: 0 32rem;
  .navbar {
    height: 108rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-bottom: 2rem solid var(--border-color);
    font-size: 32rem;
    color: var(--font-black-color);
    font-weight: 700;
    .icon {
      margin-left: 266rem;
    }
  }
  .sort-list {
    .sort-item {
      margin-top: 52rem;
      line-height: 24rem;
      font-size: 24rem;
      color: var(--font-gray-color);
      span {
        margin-left: 44rem;
      }
      .active {
        color: var(--primary-color);
        margin-left: 16rem;
      }
    }
    .sort-item:first-child {
      margin-top: 40rem;
    }
  }
}
</style>
