<template>
  <x-page headerBgColor="#fff">
    <template #title>
      <span class="head-title">{{ $t('chatRoom.friend_set') }}</span>
    </template>

    <div class="edit flex-b-c" @click="conf.toMark">
      <div class="title">{{ $t('chatRoom.set_note') }}</div>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>

    <!-- 开关 -->
    <div class="m-t20">
      <div class="edit border_b flex-b-c">
        <div class="title">{{ $t('chatRoom.add_to_bl') }}</div>
        <van-switch v-model="isBlacked" :loading="conf.blackLoading" size="33rem" @change="conf.change"
          active-color="#07c261" inactive-color="#dfdddd" />
      </div>
    </div>

    <div class="edit flex-center" @click="conf.showConfirm = true">
      <div class="title" style="color: #f45551;">{{ $t('chatRoom.remove_friend') }}
      </div>
    </div>
    <van-dialog :show="conf.showConfirm" title="" show-cancel-button :confirmButtonText="$t('chatRoom.confirm')"
      :cancelButtonText="$t('chat.cancle')" @cancel="conf.showConfirm = false" @confirm="conf.confirmRemove">
      <div style="padding: 40rem;">{{ `${$t('chatRoom.confirm_remove')} ${conf.sourceInfo.nickname}
        ${$t('chatRoom.frd_rel')}` }}</div>
    </van-dialog>
  </x-page>
</template>
<script setup lang="ts">
import IMSDK from "openim-uniapp-polyfill";
import i18n from '@/lang';
import System from '@/utils/System';
import { computed, onMounted, reactive } from 'vue'
import { useRoute } from "vue-router";
import cscontact from "@/modules/chat/sstore/cscontact";
import sutil from "@/sstore/sutil";
const conf = reactive({
  showConfirm: false,
  sourceInfo: {} as any,
  blackLoading: false,
  change(isBlack: any) {
    console.log(isBlack);
    conf.blackLoading = true;
    const funcName = isBlack
      ? IMSDK.IMMethods.AddBlack
      : IMSDK.IMMethods.RemoveBlack;
    IMSDK.asyncApi(funcName, IMSDK.uuid(), conf.sourceInfo.userID)
      .catch((err: any) => System.toast(i18n.t('chatRoom.op_failed')))
      .finally(() => (conf.blackLoading = false));
  },
  confirmRemove() {
    IMSDK.asyncApi(
      IMSDK.IMMethods.DeleteFriend,
      IMSDK.uuid(),
      conf.sourceInfo.userID,
    )
      .then(() => {
        System.toast(i18n.t('chatRoom.op_success'), 'success')
        console.log('666');
        
        setTimeout(() => sutil.pageBack(), 1000);
      })
      .catch(() => System.toast(i18n.t('chatRoom.op_failed')))
      .finally(() => (conf.showConfirm = false));
  },
  toMark() {
    System.router.push(`/chat/userCard/notes?isRemark=true&sourceInfo=${JSON.stringify(
      conf.sourceInfo,
    )}`)
  },
})
const isBlacked = computed(() => {
  return (
    cscontact.blackList.findIndex(
      (black) => black.userID === conf.sourceInfo.userID,
    ) !== -1
  );
})
const route = useRoute()
onMounted(() => {
  const { sourceInfo }: any = route.query
  if (sourceInfo) {
    conf.sourceInfo = JSON.parse(sourceInfo)
    console.log(conf.sourceInfo);

  }
})
</script>
<style lang="less" scoped>
.head-title {
  font-size: 30rem;
  color: #000;
}

.flex-b-c {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit {
  background: #FFF;
  padding: 24rem 24rem;
  margin-top: 20rem;

  .title {
    font-size: 28rem;
    font-weight: 500;
    color: #000;
  }
}

.border_b {
  border-bottom: 2rem solid #F6F7FA;
  margin-top: 0rem;
}

.m-t20 {
  margin-top: 20rem;
}
</style>
