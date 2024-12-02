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
import i18n from '@/lang'
import { onBeforeMount, reactive } from 'vue'

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
const conf = reactive({
  _key: '',
  _label: '',
  _children: '',

  /** 源数据map */
  sourceMap: {} as any,

  /** 总层级 */
  total: 0,
  /** 获取最大的总层级 */
  getMaxDepth(array: any) {
    let maxDepth = 0
    function findDepth(items: any, depth: number) {
      maxDepth = Math.max(maxDepth, depth)
      items.forEach((item: any) => {
        if (item.children && Array.isArray(item.children)) {
          findDepth(item.children, depth + 1)
        }
      })
    }
    findDepth(array, 1)
    return maxDepth
  },

  /** 最终选中数据结果 */
  res: {} as any,

  /** 临时选中数据结果 */
  choose: {} as any,

  /** 选项 */
  options: {} as any,

  /** 选中节点 */
  chooseItem: (index: number, item: any, allItem = conf.options.allType) => {
    conf.choose[index] = item
    if (index + 1 < conf.total) {
      for (let i = index + 1; i < conf.total; i++) {
        conf.options[i] = []
      }
      if (item[conf._children]) {
        conf.choose[index + 1] = allItem
        conf.options[index + 1] = item[conf._children]
      }
    }
  },
  /** 重置选中前的状态 */
  reset: () => {
    for (let i = 0; i < conf.total; i++) {
      if (conf.res[i]) {
        const _key = conf.res[i][conf._key]
        // 如果存在key，则选中该节点，否则选中allType
        conf.chooseItem(i, _key ? conf.sourceMap[_key] : conf.options.allType)
      }
    }
  },
  /** 确认当前的选中数据 */
  confirm: () => {
    conf.res = {
      ...conf.choose
    }
    emit('confirm', conf.res)
  },

  /** 初始化 */
  init: (data: any, chooseArr = []) => {
    //获取data的层级
    conf.total = conf.getMaxDepth(data)
    ObjectUtil.getObject(data, (key, value, obj) => {
      conf.sourceMap[obj[conf._key]] = obj
    })
    conf.options[0] = data
    if (!chooseArr.length) {
      conf.chooseItem(0, conf.options.allType)
    } else {
      for (let i = 0; i < chooseArr.length; i++) {
        conf.chooseItem(i, conf.sourceMap[chooseArr[i]])
      }
    }
    conf.confirm()
  }
})

onBeforeMount(() => {
  conf._key = props.field.key
  conf._label = props.field.label
  conf._children = props.field.children

  conf.options.allType = {
    [conf._key]: undefined,
    [conf._label]: i18n.t('yueb.All')
  }
})
defineExpose({
  reset: conf.reset,
  confirm: conf.confirm,
  init: conf.init
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
    background-color: #fff6e6;
  }
}

.color-active {
  background-image: -webkit-linear-gradient(90deg, #ff7502 0%, #fc9b01 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
