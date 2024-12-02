<script setup lang="ts">
import { Scope } from 'tools-vue3'
import { reactive, computed, watch } from 'vue'

interface ListItem {
  /** 头像 */
  imgUrl: string
  /** 昵称 */
  userName: string
  /** 金额 */
  amount: string
}

interface Props {
  /** 单位 */
  unit: string
  /** 列表 */
  list: ListItem[]
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  list: () => []
})

const timer = Scope.Timer()
const conf = reactive({
  show: false,
  radomNum: 0,
  currentIndex: 0,

  handlePlay() {
    timer.on(
      () => {
        if (conf.currentIndex < props.list.length - 1) conf.currentIndex++
        else conf.currentIndex = 0
        conf.radomNum = MathUtil.getRandomInt(5, 20)
        conf.show = true
        setTimeout(() => {
          conf.show = false
        }, 3000)
      },
      5000,
      true
    )
  }
})
const currentItem = computed<ListItem>(() => props.list[conf.currentIndex])

watch(
  () => props.list,
  (newVal) => {
    if (newVal.length > 0) conf.handlePlay()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <transition name="fade-slide-up" mode="out-in">
    <div v-show="conf.show" class="other-player-withdrawal">
      <img v-if="currentItem && currentItem.imgUrl" class="avatar" :src="currentItem.imgUrl" mode="" />
      <img v-else class="avatar" src="/static/img/default-header.png" />
      <div class="text">
        <span class="nickname">{{ currentItem && currentItem.userName }}</span>
        <span
          v-html="
            $t('luckyWheel.bringInPeople', {
              num: conf.radomNum,
              amount: `${unit}${unit.length > 3 ? ' ' : ''}${currentItem ? parseFloat(currentItem.amount) : 0}`
            })
          "
          style="display: inline"
        />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="less">
.other-player-withdrawal {
  padding: 10rem 12rem;
  width: 420rem;
  height: 88rem;
  border-radius: 100rem;
  background: linear-gradient(273.24deg, #f9fbd5 10.69%, #faebb2 95.58%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: PingFang SC;

  .avatar {
    width: 66rem;
    min-width: 66rem;
    height: 66rem;
    border-radius: 50%;
    border: 1px solid #fff;
    background-color: lightgray;
  }

  .text {
    font-size: 20rem;
    line-height: 28rem;
    text-align: center;
    color: #cd5e2c;
    font-weight: 500;

    .nickname {
      line-height: 18rem;
      padding-right: 6rem;
      display: inline-block;
      max-width: 100rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #efc900;
      font-weight: 600;
    }

    // i18n内使用了标签
    ::v-deep(.people),
    ::v-deep(.amount) {
      color: #ef1017;
      font-weight: 600;
    }
  }
}
</style>
