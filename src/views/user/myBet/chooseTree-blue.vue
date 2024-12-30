<template>
  <div>
    <div v-for="(_t, index) in conf.total">
      <template v-if="conf.options[index].length">
        <div class="title" v-if="title[index]">{{ title[index] }}</div>
        <div class="row" style="gap: 15rem">
          <div
            class="choose-item flex flex-center"
            :class="{ active: conf.choose[index][conf._key] === conf.options.allType[conf._key] }"
            @click="conf.chooseItem(index, conf.options.allType)"
          >
            <div :class="{ 'color-active': conf.choose[index][conf._key] === conf.options.allType[conf._key] }">
              {{ conf.options.allType[conf._label] }}
            </div>
          </div>
          <template v-for="item in conf.options[index]">
            <div
              class="choose-item flex flex-center"
              :class="{ active: conf.choose[index][conf._key] === item[conf._key] }"
              @click="conf.chooseItem(index, item)"
            >
              <div :class="{ 'color-active': conf.choose[index][conf._key] === item[conf._key] }">
                {{ item[conf._label] }}
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { index } from './chooseTree'

const props = defineProps({
  /** 字段 */
  field: {
    default: {
      key: 'key',
      label: 'label',
      children: 'children'
    }
  },
  /** 标题 */
  title: {
    default: [] as any[]
  }
})
const emit = defineEmits(['confirm'])

const conf = index({ emit, props })

defineExpose({
  reset: conf.reset,
  confirm: conf.confirm,
  init: conf.init,
  chooseItem: conf.chooseItem
})
</script>
<style lang="less" scoped>
.title {
  margin: 10rem 0;
  font-size: 24rem;
  color: #a9a9a9;
}
.choose-item {
  width: 160rem;
  height: 64rem;
  border-radius: 8rem;
  background-color: #f6f7fa;
  color: #646464;
  font-size: 26rem;
  &.active {
    background-color: #e6f2ff;
    color: #006fff;
  }
}

.color-active {
  background: linear-gradient(93.51deg, #006fff 5.72%, #087bff 86.61%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
