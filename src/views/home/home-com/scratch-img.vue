<template>
  <div class="scratch-img-box">
    <div class="scratch-img">
      <x-load-img :src="item.scratchTicketImgurl" ></x-load-img>
    </div>
    <div class="scratch-txt" :style="{ 'padding': paddingNum + 'rem' }">
      <div class="name" :style="{ 'font-size': paddingNum + 5 + 'rem' }">{{ item.scratchTicketShowname }}</div>
      <div class="price" :style="{ 'font-size': paddingNum + 10 + 'rem' }">
        {{ conf.defauleCoin }}{{ sutil.getMoneyFiexd(item.scratchTicketPrice) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import sutil from '@/sstore/sutil'
import { svalue } from '@/sstore/svalue'
import { onMounted, reactive } from 'vue'

const props = defineProps({
  item: {
    default: {} as any
  },
  paddingNum: {
    default: 18 as any
  }
})
const conf = reactive({
  defauleCoin: ''
})

const init = async () => {
  let clist = await svalue.getCoinlist()
  let citem = clist.find((item) => item.isDefault)
  conf.defauleCoin = citem.coinCode
}
onMounted(() => {
  init()
})
</script>

<style lang="less" scoped>
.scratch-img-box {
  width: 100%;
  height: 100%;
  position: relative;
  .scratch-img {
    width: 100%;
    height: 100%;
  }
  .scratch-txt {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #fefcca;
    font-size: 33rem;
    // padding: 28rem 28rem 28rem;
    font-weight: 600;
    text-shadow: 0 0 5em rgba(0, 0, 0, 0.5);
    opacity: 0.9;
    .name {
      transform: skew(-14deg);
    }
    .price {
      font-size: 38rem;
      color: #fbfbf9;
      transform: skew(-15deg);
      font-weight: 800;
      text-shadow:
        -1px -1px 0 #6b5a30,
        1px -1px 0 #6b5a30,
        -1px 1px 0 #6b5a30,
        1px 1px 0 #6b5a30;
    }
  }
}
</style>
