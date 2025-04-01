<script setup lang="ts">
interface Item {
  name: string;
  index: number;
  dot?: boolean;
  [key: string]: any;
}

interface Props {
  list: Item[];
  activeIndex: number;
  clickActive: (item: Item) => void;
}

defineProps<Props>();
</script>

<template>
  <div class="head-tabs">
    <div class="tabs">
      <div
        v-for="item in list"
        class="item"
        :class="{ active: activeIndex === item.index }"
        @click="clickActive(item)"
      >
        <el-badge :is-dot="item.dot">{{ item.name }}</el-badge>
      </div>
    </div>

    <!-- <download-notice></download-notice> -->
  </div>
</template>

<style scoped lang="less">
.head-tabs {
  padding: 9px 16px;
  width: 100%;
  height: 64px;
  background: rgb(var(--bg-card-color));
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .tabs {
    display: flex;
    align-items: center;
    height: 46px;
    .item {
      width: 93px;
      margin-right: 6px;
      height: 100%;
      border-radius: 5px;
      padding: 14px;
      text-align: center;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--font-color-black);
      transition: background 0.3s;
      white-space: nowrap;
      &:hover {
        background: rgba(var(--primary-color), 0.1);
      }

      &.active {
        color: var(--font-color-white);
        background: var(--el-color-primary);
      }
    }
  }
}
</style>
