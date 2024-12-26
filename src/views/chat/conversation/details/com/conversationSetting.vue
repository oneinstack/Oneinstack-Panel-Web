<template>
  <div class="m-t20">
    <!-- 消息免打扰 -->
    <!-- <div class="edit border_b flex-b-c" @click="conf.updatePinned(1)">
      <div class="title">Mute Notification</div>
      <van-switch v-model="conf.muteChecked" size="33rem" active-color="#07c261" inactive-color="#dfdddd" />
    </div> -->
    <!-- 置顶聊天 -->
    <div class="edit border_b flex-b-c" @click="conf.updatePinned(2)">
      <div class="title">Sticky on Top</div>
      <van-switch v-model="conf.isPinned" size="33rem" active-color="#07c261" inactive-color="#dfdddd" />
    </div>
  </div>
  <!-- 清空聊天记录 -->
  <div class="edit" @click="conf.cearShow = true">
    <div class="title">Clear Chat History</div>
  </div>
  <!-- 清除聊天记录确认框 -->
  <van-popup class="popup-bottom-center" :show="conf.cearShow" position="bottom" borderRadius='10' :round="true"
    @close="conf.cearShow = false">
    <div class="out-popup">
      <div class="out-line out-sure" @click="conf.clearHistory">Clear Chat History</div>
      <div style="height: 20rem; background: #f6f6f6"></div>
      <div class="out-line" @click="conf.cearShow = false">{{ $t('me.cancle') }}</div>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { onMounted, reactive } from 'vue'
import IMSDK, { MessageReceiveOptType } from 'openim-uniapp-polyfill'
import csconversation from '@/modules/chat/sstore/csconversation';
import i18n from '@/lang';
import { capis } from '@/modules/chat/api';
import csuser from '@/modules/chat/sstore/csuser';

const props = defineProps({
  chooseUser: {
    default: [] as any[]
  }
})

const conf = reactive({
  muteChecked: false,
  isPinned: false,
  cearShow: false,
  clearHistory() {
    System.loading()
    IMSDK.asyncApi(
      IMSDK.IMMethods.ClearConversationAndDeleteAllMsg,
      IMSDK.uuid(),
      csconversation.currentConversation.conversationID,
    )
      .then(() => {
        System.toast(i18n.t('chatRoom.op_success'), 'success')
        conf.cearShow = false
      })
      .catch(() => System.toast(i18n.t('chatRoom.op_failed')))
      .finally(() => (System.loading(false)));
  },
  updatePinned(type: any) {
    System.loading()
    // IMSDK.asyncApi(
    //   IMSDK.IMMethods.SetConversation,
    //   IMSDK.uuid(),
    //   {
    //     conversationID: csconversation.currentConversation.conversationID,
    //     isPinned: conf.isPinned,
    //   },
    // )
    //   .then(() => {
    //     System.toast(i18n.t('chatRoom.op_success'), 'success')
    //   })
    //   .catch((err) => {
    //     console.log(err);

    //     System.toast(i18n.t('chatRoom.op_failed'))
    //   })
    //   .finally(() => (System.loading(false)));
    let recvMsgOpt = conf.muteChecked ? 2 : 0
    capis.setConversations({
      userIDs: [csuser.selfInfo.userID],
      conversation: {
        conversationID: csconversation.currentConversation.conversationID,
        isPinned: conf.isPinned,
        conversationType: csconversation.currentConversation.conversationType,
        userID: csconversation.currentConversation.userID,
        groupID: csconversation.currentConversation.groupID,
        recvMsgOpt,
      }
    })
      .then((res) => {
        System.toast(i18n.t('chatRoom.set_success'), "success")
      })
      .catch((error) => {
        System.toast(i18n.t('chatRoom.set_failed'))
        if (type == 1) conf.muteChecked = !conf.muteChecked
        if (type == 2) conf.isPinned = !conf.isPinned
      })
      .finally(() => (System.loading(false)));
  }
})
onMounted(() => {
  conf.isPinned = csconversation.currentConversation.isPinned
  conf.muteChecked = csconversation.currentConversation.recvMsgOpt == MessageReceiveOptType.NotNotify
})
</script>
<style lang="less" scoped>
.out-popup {
  font-size: 32rem;
  background: #ffffff;

  .out-line {
    line-height: 120rem;
    border-bottom: 1rem solid #eee;
    text-align: center;
  }

  .out-tip {
    font-size: 26rem;
    color: #666;
  }

  .out-sure {
    color: #f45551;
  }
}
@import '../index.less';
</style>
