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
              transition: conf.scroll.centent.map[index].transition,
              top: conf.scroll.centent.map[index].top + 'px',
              height: conf.scroll.centent.map[index].data.height
                ? conf.scroll.centent.map[index].data.height + 'px'
                : undefined
            }"
            v-if="conf.scroll.centent.map[index].show"
          >
            <Item
              :info="conf.scroll.centent.map[index]"
              :item="conf.scroll.centent.map[index].data"
              :height="conf.scroll.centent.map[index].data.height"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import sutil from '@/sstore/sutil'
import { Scope } from 'tools-vue3'
import { nextTick, reactive, ref } from 'vue'
import Item from './item.vue'

const timer = Scope.Timer()
const listRef = ref()

const props = defineProps({
  /**
   * 滚动到顶部回调
   */
  scrollTop: { default: null as any }
})

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
      getHeight: () => {
        const item = conf.scroll.centent.findIndex(conf.scroll.renderMaxLength - 1)
        if (!item) return
        conf.scroll.centent.height = item.top + item.height
      },
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
       * 获取存在的数据列表
       */
      getExistArr: () => {
        return Object.keys(conf.scroll.centent.map).reduce((prev, key) => {
          if (conf.scroll.centent.map[key].dataIndex !== 9999) {
            prev.push(conf.scroll.centent.map[key])
          }
          return prev
        }, [] as any[])
      },
      /**
       * 获取未存在数据
       */
      getNoData: () => {
        return Object.keys(conf.scroll.centent.map).reduce((prev, key) => {
          if (conf.scroll.centent.map[key].dataIndex === 9999) {
            prev.push(conf.scroll.centent.map[key])
          }
          return prev
        }, [] as any[])
      },
      /**
       * 获取存在数据的索引对象
       */
      findIndex: (index: number) => {
        const key: any = Object.keys(conf.scroll.centent.map).find((key) => {
          return conf.scroll.centent.map[key].index === index
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
        if (conf.scroll.centent.loadStatus) return
        conf.scroll.centent.loadStatus = true
        
        const existArr = conf.scroll.centent.getExistArr()
        existArr.sort((a, b) => {
          return b.dataIndex - a.dataIndex
        })
        //当显示数据为顶部最后一条数据时，触发加载数据
        if (existArr[existArr.length - 1].dataIndex === 0) {
          await props.scrollTop?.()
        }
        
        const arr = [] as any[]

        const item0 = conf.scroll.centent.findIndex(0)
        if (!item0) {
          conf.scroll.centent.loadStatus = false
          return
        }

        const lazyNum = conf.scroll.centent.lazyNum * 2

        // 获取末位替换数据
        for (let i = 0; i < lazyNum; i++) {
          const findex = conf.scroll.renderMaxLength - Math.abs(i - lazyNum)
          arr.push(conf.scroll.centent.findIndex(findex))
        }

        let res = [] as any[]
        // 排序索引
        let tindex = 0
        //获取能渲染的数据
        for (let i = 0; i < lazyNum; i++) {
          const item = arr[i]
          const _dataIndex = item0.dataIndex - lazyNum + i
          if (_dataIndex >= 0) {
            item.dataIndex = _dataIndex
            item.data = conf.dataSource[_dataIndex]
            item.index = tindex
            res.push(item)
            tindex++
          }
        }

        // 更新所有数据
        if (res.length) {
          //排序保证top存在
          res = res.sort((a, b) => {
            return a.index - b.index
          })

          let lastDom = {} as any
          for (let i = 0; i < res.length; i++) {
            lastDom = await res[i].render()
          }
          conf.scroll.centent.getHeight()
          const arr = conf.scroll.centent.getSortArr()
          for (let i = 0; i < arr.length; i++) {
            const _item = arr[i]
            if (_item.dataIndex >= item0.dataIndex) {
              _item.index += res.length
              _item.updateTop()
            }
          }

          //排序进行修改top
          const arr1 = conf.scroll.centent.getSortArr()
          for (let i = 0; i < arr1.length; i++) {
            arr1[i].updateTop()
          }

          nextTick(async () => {
            //将scrollTop移动最新添加的数据位置
            const top = lastDom.top + lastDom.height + 2
            listRef.value.scrollTop = top
            timer.once(() => {
              listRef.value.scrollTop = top
              conf.scroll.centent.loadStatus = false
            }, 20)
          })
        } else {
          conf.scroll.centent.loadStatus = false
        }
      },
      /**
       * 数据加载状态，防止重复加载
       */
      loadStatus: false,
      /**
       * 加载底部数据
       */
      loadBottom: async (offset = -2) => {
        if (conf.scroll.centent.loadStatus || conf.scroll.isRunBottom) return
        conf.scroll.centent.loadStatus = true

        let existArr = conf.scroll.centent.getExistArr()
        const noDataArr = conf.scroll.centent.getNoData()
        let lastNoData = noDataArr[0]

        //获取存在数据最后一个
        existArr = existArr.sort((a, b) => {
          return a.index - b.index
        })
        let itemLast = existArr[existArr.length - 1]

        if (!itemLast) {
          conf.scroll.centent.loadStatus = false
          return
        }

        const lazyNum = conf.scroll.centent.lazyNum * 2

        let arr = [] as any[]
        let res = [] as any[]

        if (!lastNoData) {
          // 获取首位替换数据
          for (let i = 0; i < lazyNum; i++) {
            arr.push(conf.scroll.centent.findIndex(i))
          }

          //排序保证取第一位
          arr = arr.sort((a, b) => {
            return b.index - a.index
          })

          // 排序索引
          let tindex = conf.scroll.renderMaxLength - 1
          //获取能渲染的数据
          for (let i = 0; i < lazyNum; i++) {
            const item = arr[i]
            const _dataIndex = itemLast.dataIndex + lazyNum - i
            if (_dataIndex < conf.dataSource.length) {
              item.dataIndex = _dataIndex
              item.data = conf.dataSource[_dataIndex]
              item.index = tindex
              res.push(item)
              tindex--
            }
          }

          //排序保证top存在
          res = res.sort((a, b) => {
            return a.index - b.index
          })
        } else {
          //如果存在未渲染数据，说明进入此方法的是新增数据，使用一个进行渲染即可
          if (conf.dataSource[itemLast.dataIndex + 1]) {
            lastNoData.dataIndex = itemLast.dataIndex + 1
            lastNoData.data = conf.dataSource[itemLast.dataIndex + 1]
            res.push(lastNoData)
          }
        }

        // 更新所有数据
        if (res.length) {
          //更新底部数据，渲染高度
          let lastHeight = 0
          for (let i = 0; i < res.length; i++) {
            const lastDom = await res[i].render()
            lastHeight += lastDom.height
          }

          if (!lastNoData) {
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
          }
          conf.scroll.centent.getHeight()
          nextTick(async () => {
            //将scrollTop移动到最新添加的数据位置
            const top = listRef.value.scrollHeight - listRef.value.clientHeight - lastHeight + offset
            listRef.value.scrollTop = top
            timer.once(() => {
              listRef.value.scrollTop = top
              conf.scroll.centent.loadStatus = false
            }, 20)
          })
        } else {
          conf.scroll.centent.loadStatus = false
        }
      }
    },
    /**
     * 临时y滚动距离
     */
    lastY: 9999,
    /**
     * 滚动方向
     * 1: 向上，-1：向下
     */
    direction: 0,

    /**
     * 等于的次数
     */
    eqnum: 0,

    /**
     * 是否是用户滚动
     */
    isUser: false,

    /**
     * 滚动事件
     */
    event: (e: any) => {
      if (!conf.scroll.isUser) return

      const tTop = listRef.value.scrollTop
      const lastTop = conf.scroll.lastY

      if (lastTop === 9999) {
        conf.scroll.lastY = tTop
        return
      }
      conf.scroll.lastY = tTop

      //获取滚动方向
      conf.scroll.direction = tTop > lastTop ? -1 : 1
      conf.scroll.getData()
    },

    getData: () => {
      if (conf.scroll.direction === 1) {
        if (conf.scroll.lastY < 1) {
          //满足触发条件进行加载顶部数据
          conf.scroll.centent.loadTop()
        }
      } else if (conf.scroll.direction === -1) {
        if (conf.scroll.lastY > listRef.value.scrollHeight - listRef.value.clientHeight - 2) {
          //满足触发条件进行加载底部数据
          conf.scroll.centent.loadBottom()
        }
      }
    },

    /**
     * 鼠标按下
     */
    mousedown: () => {
      conf.scroll.isUser = true
      timer.un(conf.scroll.mouseupTimer)
    },
    mouseupTimer: null as any,
    mouseup: () => {
      timer.un(conf.scroll.mouseupTimer)
      conf.scroll.mouseupTimer = timer.once(() => {
        conf.scroll.isUser = false
        conf.scroll.lastY = 9999
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
          dataIndex: conf.dataSource[_dataIndex] ? _dataIndex : 9999,
          /**
           * 展示数据
           */
          data: conf.dataSource[_dataIndex],
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
              obj.top = 15
            } else {
              //其他的获取上一个对象，设置顶部距离
              const prev = obj.getPrev()
              obj.top = prev.top + prev.data.height
            }
          },
          /**
           * 是否正在重新渲染数据
           */
          isRender: false,
          /**
           * 渲染到页面-需要保证obj.data存在
           */
          render: async () => {
            //如果数据未获取到，则不渲染
            if (!obj.data) return

            obj.isRender = true
            return new Promise((res) => {
              nextTick(() => {
                obj.show = true

                const getResData = () => {
                  obj.updateTop()
                  obj.isRender = false
                  res({
                    height: obj.height,
                    top: obj.top
                  })
                }
                if (obj.data.height) {
                  obj.height = obj.data.height
                  getResData()
                } else {
                  const setHeight = () => {
                    const _dom = document.getElementById(obj.id)
                    if (_dom) {
                      obj.data.height = _dom.clientHeight

                      obj.height = obj.data.height
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

      //对index进行排序，保证存在数据的以0开始
      const _arr = [] as any[]
      for (let i = 0; i < conf.scroll.renderMaxLength; i++) {
        const obj = conf.scroll.centent.map[i]
        _arr.push(obj)
      }

      //对数据进行排序
      _arr.sort((a, b) => {
        return a.dataIndex - b.dataIndex
      })

      //在渲染数据时，需要保证index是顺序的
      let _index = 0
      for (let i = 0; i < conf.scroll.renderMaxLength; i++) {
        _arr[i].index = _index
        _index++
      }

      //渲染数据
      for (let i = 0; i < conf.scroll.renderMaxLength; i++) {
        await _arr[i].render()
      }
      conf.scroll.centent.getHeight()
      //设置滚动位置到底部
      timer.once(() => {
        conf.scroll.isUser = false
        if (conf.scroll.height > listRef.value.clientHeight) {
          listRef.value.scrollTop = listRef.value.scrollHeight - listRef.value.clientHeight
        }
        timer.once(() => {
          conf.scroll.isUser = true
          conf.scroll.centent.show = true
        }, 20)
      }, 20)
    },
    isRunBottom: false,
    /**
     * 滚动到底部
     * @param ani 是否使用动画
     */
    toBottom: async (ani = false) => {
      conf.scroll.isRunBottom = true
      const obj = {
        top: listRef.value.scrollHeight
      } as any
      if (ani || listRef.value.scrollTop > listRef.value.scrollHeight - listRef.value.clientHeight - 800)
        obj.behavior = 'smooth'
      listRef.value.scrollTo(obj)
      timer.once(() => {
        conf.scroll.isRunBottom = false
      }, 300)
    }
  }
})

defineExpose({
  toBottom: conf.scroll.toBottom,
  /**
   * 初始化显示内容
   * @param data 数据
   */
  initData: (data: any[]) => {
    conf.dataSource = [...data]
    conf.scroll.init()
  },
  /**
   * 从前面插入数据
   * @param data 数据
   */
  unshiftData: async (data: any[]) => {
    conf.dataSource.unshift(...data)
    const existArr = conf.scroll.centent.getExistArr()
    for (let i = 0; i < existArr.length; i++) {
      existArr[i].dataIndex = existArr[i].dataIndex + data.length
      existArr[i].data = conf.dataSource[existArr[i].dataIndex]
    }
  },
  /**
   * 从后面插入数据
   * @param data 数据
   */
  insertData: async (data: any) => {
    conf.dataSource.push(data)
    await conf.scroll.centent.loadBottom(0)
    if (listRef.value.scrollTop > listRef.value.scrollHeight - listRef.value.clientHeight - 800) {
      timer.once(() => {
        conf.scroll.toBottom(true)
      }, 80)
    }
  },
  /**
   * 显示最底部的数据
   */
  showLastData: () => {
    const existArr = conf.scroll.centent.getExistArr()
    existArr.sort((a, b) => {
      return a.dataIndex - b.dataIndex
    })
    const minIndex = conf.dataSource.length - existArr.length
    if (!minIndex) return
    let eIndex = existArr.length - 1
    for (let i = conf.dataSource.length - 1; i >= minIndex; i--) {
      existArr[eIndex].data = conf.dataSource[i]
      existArr[eIndex].dataIndex = i
      eIndex--
    }
  }
})
</script>
<style lang="less" scoped></style>
