<template>
  <div class="checked-operation">
    <div class="operation-item" v-for="item in checkedOperationList" @click="onItem(item)">
      <van-image class="icon" width="56rem" height="56rem" :src="item.icon" />
      <p>{{ item.name }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const emit = defineEmits(['onItem'])
const checkedOperationList = reactive([
  {
    id: 1,
    name: t('commons.button.download'),
    icon: 'download'
  },
  {
    id: 2,
    name: t('commons.button.rename'),
    icon: 'rename'
  },
  {
    id: 3,
    name: t('commons.button.delete'),
    icon: 'delete1'
  },
  {
    id: 4,
    name: t('commons.button.remove'),
    icon: 'remove'
  },
  {
    id: 5,
    name: t('commons.button.detail'),
    icon: 'detail'
  }
])
checkedOperationList.forEach((item: any) => {
  const _icon = item.icon
  item.icon = `/static/img/file/${_icon}.png`
})
const onItem = (item: any) => {
  emit('onItem', item)
}
</script>
<style lang="less" scoped>
.checked-operation {
  position: fixed;
  bottom: 0;
  z-index: 999;
  height: 208rem;
  width: 750rem;
  background: var(--card-bg-color);
  box-shadow: var(--font-dark-color) 0 2rem 4rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rem 58rem;
  .operation-item {
    text-align: center;
  }
  p {
    font-size: 24rem;
    color: var(--font-gray-color);
    margin-top: 24rem;
    line-height: 20rem;
  }
}
</style>
