<template>
  <x-page :bgcolor="'#fff'" headerBgColor="#fff" noFooter>
    <template #title>
      <span class="title">{{conf.userInfo.isGroup ? $t('chatRoom.grp_chat_verify') : $t('chatRoom.friend_verify')}}</span>
    </template>
    <div class="content">
      <div class="title">{{ `${$t('chatRoom.send')} ${conf.userInfo.isGroup ? $t('chatRoom.join_group') : $t('chatRoom.friends')} ${$t('chatRoom.apply')}` }}</div>
      <textarea class="textarea" v-model="conf.reason" maxlength="20" :placeholder="$t('chatRoom.enter_content')"></textarea>
    </div>
    <div class="btn">
      <van-button type="success" size="normal" @click="conf.sendRequest">{{ $t('chatRoom.send') }}</van-button>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import i18n from "@/lang";
import { navigateToDesignatedConversation } from "@/modules/chat/utils/cUtil";
import System from "@/utils/System";
import IMSDK, { GroupJoinSource } from "openim-uniapp-polyfill";
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router';

const conf = reactive({
  reason: '',
  userInfo: {} as any,
  sessionType: 0,
  sendRequest() {
    let func;
    if (conf.userInfo.isGroup) {
      const joinSource = conf.userInfo.isScan
        ? GroupJoinSource.QrCode
        : GroupJoinSource.Search;
      const opid = IMSDK.uuid();
      func = IMSDK.asyncApi(IMSDK.IMMethods.JoinGroup, opid, {
        groupID: conf.userInfo.sourceID,
        reqMsg: conf.reason,
        joinSource: 3,
      });
    } else {
      func = IMSDK.asyncApi(IMSDK.IMMethods.AddFriend, IMSDK.uuid(), {
        toUserID: conf.userInfo.sourceID,
        reqMsg: conf.reason,
      });
    }
    func
      .then(() => {
        System.toast(conf.userInfo.notNeedVerification ? i18n.t('chatRoom.joined_grp') : i18n.t('chatRoom.send_success'), 'success');
        setTimeout(() => {
          if (conf.userInfo.notNeedVerification) {
            navigateToDesignatedConversation(
              conf.userInfo.sourceID,
              Number(conf.sessionType),
            ).catch(() => System.toast(i18n.t('chatRoom.DescriptionFailed')));
          } else {
            System.router.push('/chat/conversation')
            // sutil.pageBack()
          }
        }, 1000);
      })
      .catch((err) => {
        console.log('55555');
        
        console.log(err);
        System.toast(i18n.t('chatRoom.send_failed'));
      });
  },
})

const route = useRoute()
onMounted(() => {
  const { info }: any = route.query
  console.log(info);

  if (info) {
    conf.userInfo = JSON.parse(info)
    conf.reason = 'I am ' + conf.userInfo.nickname
    conf.sessionType = conf.userInfo.sessionType ?? 0;
  }
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.content {
  padding: 20rem 30rem;

  .title {
    color: #999;
    font-size: 25rem;
    padding: 0 20rem;
  }

  .textarea {
    background: #f1f1f1;
    width: 100%;
    height: 200rem;
    padding: 20rem;
    border-radius: 8rem;
    margin-top: 10rem;
  }
}

.btn {
  position: fixed;
  bottom: 80rem;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;

  button {
    width: 320rem;
  }
}
</style>
