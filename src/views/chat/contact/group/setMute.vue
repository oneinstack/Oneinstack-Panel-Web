<template>
  <x-page :headerBgColor="'#fff'">
    <template #title>
      <span class="title">Group mute</span>
    </template>
    <div class="edit border_b flex-b-c">
      <div class="title">All Members Mute</div>
      <van-switch v-model="conf.showMute" size="33rem" @change="conf.changeMute" active-color="#07c261"
        inactive-color="#dfdddd" />
    </div>
    <div class="tips">After all members are muted, only the group owner and administrator are allowed to speak</div>
  </x-page>
</template>
<script setup lang="ts">
import cscontact from '@/modules/chat/sstore/cscontact';
import headSearch from '../com/headSearch.vue';
import groupItem from './com/groupItem.vue';
import { onMounted, reactive } from 'vue';
import csconversation from '@/modules/chat/sstore/csconversation';
import IMSDK, {
  GroupStatus
} from "openim-uniapp-polyfill";
import System from '@/utils/System';
import i18n from '@/lang';
import sutil from '@/sstore/sutil';

const conf = reactive({
  showMute: false,
  changeMute() {
    System.loading()
    IMSDK.asyncApi(IMSDK.IMMethods.ChangeGroupMute, IMSDK.uuid(), {
      groupID: csconversation.currentConversation.groupID,
      isMute: conf.showMute
    })
      .then(({ data }: any) => {
        if(conf.showMute) {
          csconversation.currentGroup.status = 3
        } else {
          csconversation.currentGroup.status = 0
        }
        System.toast(i18n.t('chatRoom.set_success'), "success")
        setTimeout(()=> {
          sutil.pageBack()
        })
      })
      .catch((err: any) => {
        console.log(err);
        System.toast(i18n.t('chatRoom.set_failed'))
      })
      .finally(()=>System.loading(false))
  }
})
onMounted(() => {
  console.log(csconversation.currentGroup);
  conf.showMute = csconversation.currentGroup.status == GroupStatus.Muted
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
.edit {
    background: #FFF;
    padding: 24rem 24rem;
    margin-top: 40rem;
  
    .title {
      font-size: 28rem;
      font-weight: 500;
      color: #000;
    }
}
.flex-b-c {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.tips{
  color: #999;
  font-size: 26rem;
  padding: 24rem;
}
</style>
