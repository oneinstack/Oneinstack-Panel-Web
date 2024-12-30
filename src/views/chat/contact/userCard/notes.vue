<template>
  <x-page headerBgColor="#fff" :bgcolor="'#fff'" :showBack="false">
    <template #title>
      <div class="head-cont">
        <div class="cancle" @click.stop="sutil.pageBack()">{{ $t('chatRoom.cancel') }}</div>
        <div class="finsh" :class="{ 'active': conf.isActive }" @click="conf.saveOrCopy">{{ $t('chatRoom.finish') }}</div>
      </div>
    </template>
    <div class="head-title">
      {{ getTitle }}
    </div>
    <div class="content">
      <div class="title">{{ $t('chatRoom.notes') }}</div>
      <input class="input" v-model="conf.content" :placeholder="$t('chatRoom.enter_content')" @input="conf.input" />
    </div>
  </x-page>
</template>
<script setup lang="ts">
import IMSDK from "openim-uniapp-polyfill";
import i18n from '@/lang';
import System from '@/utils/System';
import { computed, onMounted, reactive } from 'vue'
import { useRoute } from "vue-router";
import sutil from "@/sstore/sutil";
import csuser from "@/modules/chat/sstore/csuser";
import { capis } from "@/modules/chat/api";
import cscontact from "@/modules/chat/sstore/cscontact";

const conf = reactive({
  sourceInfo: {} as any,
  content: '',
  isRemark: false,
  isSelfNickname: false,
  isActive: false,
  async saveOrCopy() {
    if (!conf.isActive) return
    if (conf.isRemark) {
      System.loading()
      capis.updateFriends({
        friendUserIDs: [conf.sourceInfo.userID],
        remark: conf.content,
        ownerUserID: csuser.selfInfo.userID,
      })
        .then((res) => {
          cscontact.friendList.filter((item) => {
            if (item.userID == conf.sourceInfo.userID) {
              item.remark = conf.content
            }
          })
          System.toast(i18n.t('chatRoom.set_success'), "success")
          setTimeout(() => sutil.pageBack(), 300);
        })
        .catch((error) => {
          System.toast(i18n.t('chatRoom.set_failed'))
        })
        .finally(() => (System.loading(false)));
    } else if (conf.isSelfNickname) {
      System.loading()
      try {
        await capis.businessInfoUpdate({
          userID: conf.sourceInfo.userID,
          nickname: conf.content,
        });
        csuser.selfInfo.nickname = conf.content
        System.toast(i18n.t('chatRoom.modify_succ'), 'success')
        setTimeout(() => sutil.pageBack, 1000);
      } catch (e) {
        console.log(e);
        System.toast(i18n.t('chatRoom.modify_failed'))
      }
      System.loading(false)
    } else {
      await StrUtil.copyText(conf.sourceInfo.userID)
      System.toast(i18n.t('invite.CopySuccessful'), 'success')
    }
  },
  input(e: any) {
    conf.isActive = true
  }
})
const getTitle = computed(() => {
  if (conf.isRemark) {
    return i18n.t('chatRoom.set_note')
  }
  if (conf.isSelfNickname) {
    return i18n.t('chatRoom.my_name')
  }
  return 'ID'
})
const getConfirmText = computed(() => {
  return conf.isRemark || conf.isSelfNickname ? i18n.t('chatRoom.save') : i18n.t('chatRoom.copy')
})
const route = useRoute()
onMounted(() => {
  const { isRemark, isSelfNickname, sourceInfo }: any = System.getRouterParams()
  if (sourceInfo) {
    conf.sourceInfo = JSON.parse(sourceInfo)
    console.log(conf.sourceInfo);
  }
  conf.isRemark = !!isRemark;
  if (conf.isRemark) {
    conf.content = conf.sourceInfo.nickname;
    cscontact.friendList.filter((item) => {
      if (item.userID == conf.sourceInfo.userID) {
        if(item.remark) conf.content = item.remark
      }
    })
  }
  conf.isSelfNickname = !!isSelfNickname;
  if (conf.isSelfNickname) {
    conf.content = conf.sourceInfo.nickname;
  }
})
</script>
<style lang="less" scoped>
.head-cont {
  color: #000;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 30rem 0rem 10rem;
  font-size: 28rem;

  .cancle {
    padding: 10rem 20rem;
    position: relative;
    z-index: 9;
  }

  .finsh {
    background: #f1f1f1;
    color: #999;
    padding: 10rem 20rem;
    border-radius: 8rem;
    font-size: 26rem;
  }

  .active {
    color: #fff;
    background: #07c261;
  }
}

.head-title {
  font-size: 32rem;
  color: #333;
  text-align: center;
  margin-top: 40rem;
}

.content {
  padding: 20rem 30rem;
  margin-top: 20rem;

  .title {
    color: #a3a4ae;
    font-size: 28rem;
    padding: 0 20rem;
  }

  .input {
    background: #f1f1f1;
    width: 100%;
    padding: 30rem;
    border-radius: 10rem;
    margin-top: 10rem;
    font-size: 30rem;
  }
}
</style>
