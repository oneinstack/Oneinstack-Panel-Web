import i18n from '@/lang'
import { onBeforeMount, reactive } from 'vue'

export const index = ({ emit, props }: any) => {
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

  return conf
}
