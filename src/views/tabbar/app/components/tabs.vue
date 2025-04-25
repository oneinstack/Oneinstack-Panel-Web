<template>
  <div class="tabs-content">
    <van-icon class="left" size="18" name="arrow-left" @click="onScroll('left')" />
    <div class="tabs" ref="tabsRef">
      <div class="tab" :class="modelValue == item.value ? 'active' : ''" v-for="item in tabList" @click="onTab(item)">
        <p>{{ item.label }}</p>
        <van-image
          v-if="modelValue == item.value"
          class="icon"
          width="30rem"
          height="16rem"
          :src="'/static/img/application/tab-active.png'"
        />
      </div>
    </div>
    <van-icon class="right" size="18" name="arrow" @click="onScroll('right')" />
  </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const tabsRef = ref<HTMLElement>()

const tabList = reactive([
  {
    label: '全部',
    value: '',
    key: '1'
  },
  {
    label: '建站',
    value: '建站',
    key: '2'
  },
  {
    label: '数据库',
    value: '数据库',
    key: '3'
  },
  {
    label: 'Web服务器',
    value: 'Web服务器',
    key: '4'
  },
  {
    label: '运行环境',
    value: '运行环境',
    key: '5'
  },
  {
    label: '实用工具',
    value: '实用工具',
    key: '6'
  },
  {
    label: '云存储',
    value: '云存储',
    key: '7'
  },
  {
    label: 'AI/大模型',
    value: 'AI/大模型',
    key: '8'
  }
])

const onTab = (item: any) => {
  emit('update:modelValue', item.value)
  emit('change', item)
}

const onScroll = (direction: 'left' | 'right') => {
  if (!tabsRef.value) return
  const container = tabsRef.value
  const scrollStep = 200
  if (direction === 'left') {
    container.scrollLeft -= scrollStep
  } else {
    container.scrollLeft += scrollStep
  }
}
</script>
<style lang="less" scoped>
.tabs-content {
  display: flex;
  align-items: center;
  margin-top: 44rem;
  .left,
  .right {
    cursor: pointer;
    padding: 10rem;
  }
  .tabs {
    flex: 1;
    display: flex;
    background: var(--card-bg-color);
    overflow-x: scroll;
    scroll-behavior: smooth;
    &::-webkit-scrollbar {
      display: none;
    }
    .tab {
      margin-left: 40rem;
      font-size: 28rem;
      white-space: nowrap;
      text-align: center;
      cursor: pointer;
      &:first-child {
        margin-left: 0;
      }
      &.active {
        font-weight: 800;
      }
    }
  }
}
</style>
