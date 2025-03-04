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
              <div :class="{ 'color-active': conf.choose[index][conf._key] === item[conf._key] }" v-if="item.lotteryTypeCode != 'ANIMALS_RUNNING'">
                {{ item[conf._label] }}
              </div>

              <div :class="{ 'color-active': conf.choose[index][conf._key] === item[conf._key] }" v-else>
                <div class="ellipsis">{{ item[conf._label]?.replace(/([A-Z])/g, ' $1').trim() }}</div>
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
  background: #3A4142;
  color: #fff;
  font-size: 24rem;
  font-family: Poppins;
  font-weight: 600;
  border: 2rem solid #444B4C;

  .ellipsis{
    white-space: nowrap; /* 防止文本换行 */
    overflow: hidden; /* 隐藏溢出的内容 */
    text-overflow: ellipsis;
    width: 140rem;
  }

  &.active {
    border: 2rem solid #1CF187;
  }
}
</style>
