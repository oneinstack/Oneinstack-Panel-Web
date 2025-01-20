<template>
  <div class="redpack_container"
    :class="[mconf.item.status == 35 ? '' : 'redpack_over', mconf.item.isme ? 'message_item_self' : '']"
    @click="conf.getDetail">
    <div class="rtop" v-if="conf.show ">
      <img :src="`/static/images/redpack${mconf.item.status == 35 ? '' : '-over'}.png`" />
      <div class="column">
        <div class="content">{{ mconf.item.data }}</div>
        <div class="content-over">{{ mconf.item.status == 35 ? '' : RedPackReceiveCode[mconf.item.status]() }}</div>
      </div>
    </div>
    <div class="rline"></div>
    <div class="rdesc">{{ $t('chatRoom.wechat_rpkt') }}</div>
  </div>
  <redpackDetail v-if="conf.typeList.includes(DialogName.RedPackDetail)" @close="conf.reset" />
  <loadingCom v-if="conf.typeList.includes(DialogName.loading)" />
</template>

<script setup lang="ts">
import loadingCom from './Dialog/loadingIM.vue'
import redpackDetail from './Dialog/detail.vue'
import i18n from '@/lang';
import { RedPackReceiveCode, sim } from '@/sstore/sim'
import { DialogName, simdl } from '@/sstore/simdl'
import { Scope } from 'tools-vue3';
import { onMounted, reactive } from 'vue';

const mconf = Scope.getConf()
const event = Scope.Event()

const conf = reactive({
  typeList: [] as any[],
  show: false,
  async getDetail() {
    simdl.open({
      type: DialogName.RedPackDetail,
      data: {
        ...mconf.item
      }
    })
    setTimeout(() => {
      conf.typeList = simdl.listType
    },200)
  },
  reset() {
    conf.typeList = []
  }
})

onMounted(() => {
  simdl.clear()
  const _item = mconf.item
  const _msg = mconf.message
  _item.sendTime = _msg.sendTime
  _item.isme = _msg.isme

  if (mconf.item.id) {
    event.on('setRedPacketStatus', ({ id, status }) => {
      if (mconf.item.id === id) mconf.item.status = status
    })
    mconf.item.status = sim.getRedPacketStatus(mconf.item.id)
  }
  conf.show = true
  mconf.item = {
    ..._item,
    data: _item.data || i18n.t('chatRoom.congrats'),
    senderFaceUrl: _msg.senderFaceUrl,
    senderNickname: _msg.senderNickname
  }
})
</script>

<style lang="less" scoped>
.redpack_container {
  position: relative;
  width: 378rem;
  height: 142rem;
  border-radius: 10rem;
  background-color: #f99e3b;

  &:active {
    background-color: #e08d35;

    &::after {
      border-right: 6px solid #e08d35;
    }

    .reverse &::after {
      border-left: 6px solid #e08d35;
    }
  }

  &.redpack_over {
    background-color: #fce2c2;

    &::after {
      border-right: 6px solid #fce2c2;
    }

    .reverse &::after {
      border-left: 6px solid #fce2c2;
    }

    &:active {
      background-color: #f4dfc6;

      &::after {
        border-right: 6px solid #f4dfc6;
        border-left: 6px dashed transparent;
      }

      .reverse &::after {
        border-left: 6px solid #f4dfc6;
        border-right: 6px dashed transparent;
      }
    }
  }

  .rtop {
    display: flex;
    height: 112rem;
    align-items: center;
    padding-right: 15rem;

    img {
      min-width: 60rem;
      width: 60rem;
      height: 70rem;
      margin-left: 28rem;
      margin-right: 14rem;
    }

    .content {
      color: #fff;
      font-weight: bold;
      font-size: 26rem;
      margin-left: 8rem;

      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      overflow: hidden;
      word-break: break-all;
      line-clamp: 1;
    }

    .content-over {
      margin-top: 5rem;
      font-size: 20rem;
      margin-left: 8rem;
      color: #fff;
    }
  }

  .rline {
    height: 1rem;
    background-color: #ffffff40;
    width: 90%;
    margin: 0 auto;
    transform: translateY(-8rem);
  }

  .rdesc {
    font-size: 18rem;
    margin-left: 20rem;
    color: #fff;
  }
}

.redpack_container::after {
  content: '';
  position: absolute;
  left: -12px;
  right: unset;
  top: 6px;
  margin-top: 5px;
  border-top: 6px dashed transparent;
  border-bottom: 6px dashed transparent;
  border-left: 6px dashed transparent;
  border-right: 6px solid #f99e3b;
}

.reverse .redpack_container::after {
  left: unset;
  right: -11px;
  margin-left: 12px;
  border-left: 6px solid #f99e3b;
  border-right: 6px dashed transparent;
  border-top: 6px dashed transparent;
  border-bottom: 6px dashed transparent;
  -webkit-transform: scaleX(1);
  transform: scaleX(1);
}
</style>
