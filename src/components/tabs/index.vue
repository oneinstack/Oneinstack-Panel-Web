<template>
  <div class="row items-center relative tabs-box">
    <div
      class="col flex flex-center"
      style="--color1: #ff7502; --color2: #fc9b01"
      v-for="item in list"
      @click="conf.clickItem(item)"
      :class="[item.value === active ? 'text-c1' : '']"
    >
      {{ item.label }}
    </div>
    <div
      class="absolute active-line tabs-line"
      :style="{
        background: props.lineColor,
        width: props.lineWidth ? props.lineWidth + 'rem' : `calc(${conf.line.width}% - 32rem)`,
        transform: `translateX(${conf.line.x * conf.line.widthRem + conf.getLineWidth()}rem )`,
        opacity: conf.line.x < 0 ? 0 : 1
      }"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue'

const props = defineProps({
  list: { default: [] as any[] },
  active: { default: '' as any },
  /**
   * 默认为#eb602d
   */
  lineColor: { default: '#eb602d' },
  activeStyle: { default: {} },
  /**
   * 默认为自动计算
   */
  lineWidth: { default: 0 }
})
const emit = defineEmits(['update:active', 'change'])
const conf = reactive({
  line: {
    width: 0,
    widthRem: 0,
    x: 0,
    setX: (val: string | number) => {
      const index = props.list.findIndex((v: any) => v.value === val)
      conf.line.x = index
    }
  },
  init: () => {
    conf.line.width = 100 / props.list.length
    conf.line.widthRem = 750 / props.list.length
    conf.line.setX(props.active)
  },
  clickItem: (item: any) => {
    if (props.active === item.value) return
    emit('update:active', item.value)
    emit('change', item)
    conf.line.setX(item.value)
  },
  getLineWidth: () => {
    return props.lineWidth ? (conf.line.widthRem - props.lineWidth) / 2 : 16
  }
})

onMounted(() => {
  conf.init()
})
</script>
<style lang="less" scoped>
.tabs-box {
  width: 100%;
  height: 88rem;
  color: rgb(96, 98, 102);
  font-size: 24rem;
}
.tabs-line {
  bottom: 4rem;
  height: 6rem;
  border-radius: 6rem;
  transition: all 0.3s ease-in;
}
</style>
