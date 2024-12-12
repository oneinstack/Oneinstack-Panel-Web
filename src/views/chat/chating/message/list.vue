<template>
  <div
    class="relative"
    ref="listRef"
    @scroll="conf.scroll.event"
    @wheel="conf.scroll.event"
    @mousedown="conf.scroll.mousedown"
    @mouseup="conf.scroll.mouseup"
    @touchstart="conf.scroll.mousedown"
    @touchend="conf.scroll.mouseup"
  >
    <div class="absolute column no-wrap" style="width: 100%">
      <div
        class="relative fit-width"
        :style="{ height: conf.scroll.centent.height + 'px', opacity: conf.scroll.centent.show ? '1' : '0' }"
      >
        <template v-for="(l, index) in conf.scroll.renderMaxLength">
          <div
            class="absolute fit-width"
            :id="conf.scroll.centent.map[index].id"
            :style="{
              top: conf.scroll.centent.map[index].top + 'px',
              height: conf.scroll.centent.map[index].data.height
                ? conf.scroll.centent.map[index].data.height + 'px'
                : undefined
            }"
            v-if="conf.scroll.centent.map[index].show"
          >
            <Item :item="conf.scroll.centent.map[index].data" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import sutil from '@/sstore/sutil'
import System from '@/utils/System'
import { Scope } from 'tools-vue3'
import { nextTick, onMounted, reactive, ref } from 'vue'
import Item from './item.vue'

const timer = Scope.Timer()
const listRef = ref()
const conf = reactive({
  /**
   * 数据源
   */
  dataSource: [] as any[],

  scroll: {
    /**
     * 总高度
     */
    height: 0,
    /**
     * 顶部配置
     */
    topbox: {
      height: 0
    },
    /**
     * 底部配置
     */
    bottombox: {
      height: 0
    },
    /**
     * 中间内容
     */
    centent: {
      show: false,
      /**
       * 显示高度
       */
      height: 0,
      /**
       * 渲染对象
       */
      map: {} as { [key: string]: any },

      /**
       * 获取排序后的数组
       */
      getSortArr: () => {
        const arr = [] as any[]
        for (let i = 0; i < conf.scroll.renderMaxLength; i++) {
          arr.push(conf.scroll.centent.map[i])
        }
        return arr.sort((a, b) => {
          return a.index - b.index
        })
      },
      /**
       * 获取索引对象
       */
      findIndex: (index: number) => {
        const key = Object.keys(conf.scroll.centent.map).findIndex((item) => {
          return conf.scroll.centent.map[item].index === index
        })
        return conf.scroll.centent.map[key]
      },
      /**
       * 触发加载数量
       */
      lazyNum: 4,
      /**
       * 加载顶部数据
       */
      loadTop: async () => {
        const arr = [] as any[]

        const item0 = conf.scroll.centent.findIndex(0)
        if (!item0) return

        const lazyNum = conf.scroll.centent.lazyNum * 2

        // 获取末位替换数据
        for (let i = 0; i < lazyNum; i++) {
          const findex = conf.scroll.renderMaxLength - Math.abs(i - lazyNum)
          arr.push(conf.scroll.centent.findIndex(findex))
        }

        const res = [] as any[]
        // 排序索引
        let tindex = 0
        //获取能渲染的数据
        for (let i = 0; i < lazyNum; i++) {
          const item = arr[i]
          const _dataIndex = item0.dataIndex - lazyNum + i
          if (_dataIndex >= 0) {
            item.dataIndex = _dataIndex
            item.index = tindex
            res.push(item)
            tindex++
          }
        }

        // 更新所有数据
        if (res.length) {
          let lastDom = {} as any
          for (let i = 0; i < res.length; i++) {
            lastDom = await res[i].rander(conf.dataSource[res[i].dataIndex])
          }

          const arr = conf.scroll.centent.getSortArr()
          for (let i = 0; i < arr.length; i++) {
            const _item = arr[i]
            if (_item.dataIndex >= item0.dataIndex) {
              _item.index += res.length
              _item.updateTop()
            }
          }

          nextTick(async () => {
            //将scrollTop移动最新添加的数据位置
            const top = lastDom.top + lastDom.height + 2
            listRef.value.scrollTop = top
            timer.once(() => {
              listRef.value.scrollTop = top
            }, 20)
          })
        }
      },

      /**
       * 加载底部数据
       */
      loadBottom: async () => {
        let arr = [] as any[]

        const itemLast = conf.scroll.centent.findIndex(conf.scroll.renderMaxLength - 1)
        if (!itemLast) return

        const lazyNum = conf.scroll.centent.lazyNum * 2

        // 获取首位替换数据
        for (let i = 0; i < lazyNum; i++) {
          arr.push(conf.scroll.centent.findIndex(i))
        }

        //排序保证取第一位
        arr = arr.sort((a, b) => {
          return b.index - a.index
        })

        let res = [] as any[]
        // 排序索引
        let tindex = conf.scroll.renderMaxLength - 1
        //获取能渲染的数据
        for (let i = 0; i < lazyNum; i++) {
          const item = arr[i]
          const _dataIndex = itemLast.dataIndex + lazyNum - i
          if (_dataIndex < conf.dataSource.length) {
            item.dataIndex = _dataIndex
            item.index = tindex
            res.push(item)
            tindex--
          }
        }

        //排序保证top存在
        res = res.sort((a, b) => {
          return a.index - b.index
        })

        // 更新所有数据
        if (res.length) {

          //更新底部数据，渲染高度
          let lastHeight = 0
          for (let i = 0; i < res.length; i++) {
            const lastDom = await res[i].rander(conf.dataSource[res[i].dataIndex])
            lastHeight += lastDom.height
          }

          //排序进行修改索引
          const arr = conf.scroll.centent.getSortArr()
          for (let i = 0; i < arr.length; i++) {
            const _item = arr[i]
            if (_item.dataIndex <= itemLast.dataIndex) {
              _item.index -= res.length
            }
          }

          //排序进行修改top
          const arr1 = conf.scroll.centent.getSortArr()
          for (let i = 0; i < arr1.length; i++) {
            arr1[i].updateTop()
          }

          nextTick(async () => {
            //将scrollTop移动到最新添加的数据位置
            const top = listRef.value.scrollHeight - listRef.value.clientHeight - lastHeight - 2
            listRef.value.scrollTop = top
            timer.once(() => {
              listRef.value.scrollTop = top
            }, 20)
          })
        }
      }
    },
    /**
     * 临时y滚动距离
     */
    lastY: 99999,
    /**
     * 滚动方向
     * 1: 向上，-1：向下
     */
    direction: 0,

    /**
     * 是否是用户滚动
     */
    isUser: false,

    /**
     * 滚动事件
     */
    event: (e: any) => {
      if (!conf.scroll.isUser) return
      if (conf.scroll.lastY === -1) {
        conf.scroll.lastY = e.target.scrollTop
        return
      }
      //获取滚动方向
      conf.scroll.direction = e.target.scrollTop > conf.scroll.lastY ? -1 : 1
      conf.scroll.lastY = e.target.scrollTop

      if (conf.scroll.direction === 1) {
        if (conf.scroll.lastY < 1) {
          //满足触发条件进行加载顶部数据
          FunUtil.throttle(conf.scroll.centent.loadTop, 100)
        }
      } else if (conf.scroll.direction === -1) {
        if (conf.scroll.lastY > listRef.value.scrollHeight - listRef.value.clientHeight - 2) {
          //满足触发条件进行加载底部数据
          FunUtil.throttle(conf.scroll.centent.loadBottom, 100)
        }
      }
    },

    mousedown: () => {
      conf.scroll.isUser = true
      timer.un(conf.scroll.mouseupTimer)
    },
    mouseupTimer:null as any,
    mouseup: () => {
      conf.scroll.lastY = -1
      conf.scroll.mouseupTimer = timer.once(() => {
        conf.scroll.isUser = false
      }, 2000)
    },
    /**
     * 渲染最大数量
     */
    renderMaxLength: 0,
    /**
     * 初始化参数
     */
    init: async () => {
      const _data = [
        {
          'isme': false,
          'isGroup': false,
          'sendnickname': 'Test',
          'face': '/static/img/home-banner.png',
          'content':
            '<img src="/static/chat/emoji/86.png" width="18rem" height="18rem" style="vertical-align: middle;transform: translateY(-3rem);"><img src="/static/chat/emoji/86.png" width="18rem" height="18rem" style="vertical-align: middle;transform: translateY(-3rem);"><img src="/static/chat/emoji/86.png" width="18rem" height="18rem" style="vertical-align: middle;transform: translateY(-3rem);">',
          'type': 'text'
        }
      ] as any

      _data[0].id = StrUtil.getId()
      _data[0].content += '-0'
      for (let i = 1; i <= 100; i++) {
        const obj = { ..._data[0] }
        obj.id = StrUtil.getId()
        obj.content += '-' + i
        _data.push(obj)
      }

      conf.dataSource = _data

      //获取最大渲染数量
      const _px = sutil.rem2px(80)
      const _listpx = listRef.value.clientHeight
      const _renderMaxLength = Math.floor(_listpx / _px) + 6
      conf.scroll.renderMaxLength = _renderMaxLength

      //初始化渲染数据
      for (let i = 0; i < _renderMaxLength; i++) {
        const _dataIndex = conf.dataSource.length - _renderMaxLength + i
        const obj = reactive({
          id: 'chat_content_' + i,

          /**
           * 当前展示的数据下标
           */
          dataIndex: _dataIndex,
          /**
           * 展示数据
           */
          data: _data[_dataIndex],
          /**
           * 距离顶部
           */
          top: i * _px,
          /**
           * 实际高度
           */
          height: _px,
          /**
           * 当前位置索引
           */
          index: i,

          /**
           * 是否显示
           */
          show: false,
          /**
           * 在已经渲染过的情况更新顶部距离
           */
          updateTop: () => {
            //如果是最上面，则设置0
            if (obj.index === 0) {
              obj.top = 0
            } else {
              //其他的获取上一个对象，设置顶部距离
              const prev = obj.getPrev()
              obj.top = prev.top + prev.data.height
            }
          },
          /**
           * 渲染到页面
           */
          rander: async (data: any) => {
            return new Promise((res) => {
              nextTick(() => {
                obj.data = data
                obj.show = true

                const getResData = () => {
                  obj.updateTop()
                  conf.scroll.centent.height = 0
                  Object.keys(conf.scroll.centent.map).forEach((item) => {
                    conf.scroll.centent.height += conf.scroll.centent.map[item].height
                  })
                  res({
                    height: obj.height,
                    top: obj.top
                  })
                }
                if (data.height) {
                  obj.height = data.height
                  getResData()
                } else {
                  const setHeight = () => {
                    const _dom = document.getElementById(obj.id)
                    if (_dom) {
                      data.height = _dom.clientHeight

                      obj.height = data.height
                      //对新数据更新总高度
                      conf.scroll.height += obj.height

                      getResData()
                    } else {
                      //如果dom不存在，则在下一帧设置高度
                      timer.once(() => {
                        setHeight()
                      }, 20)
                    }
                  }
                  setHeight()
                }
              })
            })
          },

          /**
           * 获取下一个对象
           */
          getNext: () => {
            let nextIndex = obj.index + 1
            if (nextIndex > conf.scroll.renderMaxLength - 1) nextIndex = 0
            return conf.scroll.centent.findIndex(nextIndex)
          },
          /**
           * 获取上一个对象
           */
          getPrev: () => {
            let prevIndex = obj.index - 1
            if (prevIndex < 0) prevIndex = conf.scroll.renderMaxLength - 1
            return conf.scroll.centent.findIndex(prevIndex)
          }
        })
        conf.scroll.centent.map[i] = obj
      }

      for (let i = 0; i < conf.scroll.renderMaxLength; i++) {
        const obj = conf.scroll.centent.map[i]
        await obj.rander(obj.data)
      }

      timer.once(() => {
        conf.scroll.isUser = false
        if (conf.scroll.height > listRef.value.clientHeight) {
          listRef.value.scrollTop = listRef.value.scrollHeight
        }
        timer.once(() => {
          conf.scroll.isUser = true
          conf.scroll.centent.show = true
        }, 20)
      }, 20)
    }
  }
})

defineExpose({
  /**
   * 滚动到底部
   * @param ani 是否使用动画
   */
  toBottom: (ani = false) => {
    const obj = {
      top: listRef.value.scrollHeight
    } as any
    if (ani || listRef.value.scrollTop > listRef.value.scrollHeight - listRef.value.clientHeight - 800)
      obj.behavior = 'smooth'
    listRef.value.scrollTo(obj)
  }
})

onMounted(() => {
  conf.scroll.init()
})

onMounted(() => {})
</script>
<style lang="less" scoped></style>
