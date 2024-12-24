<template>
  <x-page headerBgColor="#fff">
    <template #title>
      <span class="head-title">Chat Messages</span>
    </template>
    <!-- 成员列表 -->
    <groupItem :groupID="csconversation.currentConversation.groupID"
      :memberCount="csconversation.currentGroup.memberCount" :groupMemberList="conf.groupMemberList"
      @updteMember="conf.getGroupMemberList" />

    <!-- 名称 -->
    <div class="m-t20">
      <div class="edit border_b flex-b-c" @click="conf.updateGroup('updateGroupNickname')">
        <div class="title">Group Name</div>
        <div class="more flex-center">
          <span>{{ csconversation.currentConversation.showName }}</span>
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <div class="edit flex-b-c" style="margin-top: 0;" @click="conf.updateGroup('groupQrCode')">
        <div class="title">Group QR code</div>
        <div class="more flex-center">
          <img style="width: 30rem;height: 30rem;" src="/static/images/group_setting_qrcode.png" />
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
    </div>
    <div class="m-t20" v-if="isAdmin || isOwner">
      <!-- 全员禁言 -->
      <div class="edit border_b flex-b-c" @click="conf.updateGroup('setMute')">
        <div class="title">Group mute</div>
        <div class="more flex-center">
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <!-- 群主转让 -->
      <div class="edit border_b flex-b-c" @click="conf.transShow = true" v-if="isOwner">
        <div class="title">Group owner transfer</div>
        <div class="more flex-center">
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
      <!-- 群管理员 -->
      <div class="edit border_b flex-b-c" @click="conf.updateGroup('setAdmin')" v-if="isOwner">
        <div class="title">Group administrator</div>
        <div class="more flex-center">
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
    </div>
    <div class="edit flex-center" @click="() => (conf.confirmType = isOwner ? 'Dismiss' : 'Quit')">
      <div class="title" style="color: #f45551;">{{
        isOwner
          ? $t('chatRoom.dissolve_grp') : $t('chatRoom.exit_grp') }}
      </div>
    </div>
    <!-- 解散、退出群聊提示 -->
    <van-dialog :show="conf.confirmType !== null" title="" show-cancel-button
      :confirmButtonText="$t('chatRoom.confirm')" :cancelButtonText="$t('chat.cancle')"
      @cancel="conf.confirmType = null" @confirm="conf.confirmDel">
      <div style="padding: 40rem;">
        {{ getConfirmContent }}
      </div>
    </van-dialog>
    <!-- 群主转让 -->
    <van-popup class="popup-bottom-center" :show="conf.transShow" position="bottom">
      <transferGroup :groupMemberList="conf.groupMemberList" :type="conf.type" @cancle="conf.cancle" />
    </van-popup>
  </x-page>
</template>
<script setup lang="ts">
import groupItem from "./com/groupItem.vue";
import transferGroup from "./com/transferGroup.vue";
import IMSDK, {
  GroupMemberRole,
  IMMethods,
} from "openim-uniapp-polyfill";
import csconversation from '@/modules/chat/sstore/csconversation';
import { computed, onMounted, reactive, ref } from 'vue'
import i18n from '@/lang';
import System from '@/utils/System';
import { capis } from "@/modules/chat/api";
import { log } from "node:console";

const ConfirmTypes = {
  Clear: 'Clear',
  Dismiss: 'Dismiss',
  Quit: 'Quit'
}

const inviteRefs = ref<any>()
const conf = reactive({
  showConfirm: false,
  confirmType: null as any,
  groupMemberList: [] as any[],
  transShow: false,
  type: '',
  getGroupMemberList() {
    IMSDK.asyncApi(IMSDK.IMMethods.GetGroupMemberList, IMSDK.uuid(), {
      groupID: csconversation.currentConversation.groupID,
      filter: 0,
      offset: 0,
      count: 500,
    })
      .then(({ data }: any) => {
        console.log('8888');
        console.log(data);
        conf.groupMemberList = [...data];
        csconversation.groupMemberList = conf.groupMemberList
      })
      .catch((err: any) => {
        console.log(err);
        conf.reqGroupMemberList()
      });
  },
  async reqGroupMemberList() {
    const { members } = await capis.getGroupMemberList(
      {
        filter: 0,
        groupID: csconversation.currentConversation.groupID,
        keyword: "",
        pagination: {
          pageNumber: 1,
          showNumber: 500,
        },
      }
    );
    conf.groupMemberList = [...members];
    csconversation.groupMemberList = conf.groupMemberList
  },

  confirmDel() {
    let funcName: any = "";
    let sourceID = csconversation.currentConversation.groupID;
    if (conf.confirmType === ConfirmTypes.Quit) {
      funcName = IMSDK.IMMethods.QuitGroup;
    }
    if (conf.confirmType === ConfirmTypes.Dismiss) {
      funcName = IMSDK.IMMethods.DismissGroup;
    }
    IMSDK.asyncApi(funcName, IMSDK.uuid(), sourceID)
      .then(() => {
        System.toast(i18n.t('chatRoom.op_success'), "success")
        if (conf.confirmType === ConfirmTypes.Clear) {
          // this.$store.commit("message/SET_HISTORY_MESSAGE_LIST", []);
          // this.$store.commit("message/SET_PREVIEW_IMAGE_LIST", []);
        } else {
          setTimeout(
            () =>
              System.router.push('/chat/conversation'),
            250,
          );
        }
      })
      .catch(() => System.toast(i18n.t('chatRoom.op_failed')))
      .finally(() => (conf.confirmType = null));
  },
  updateGroup(url: string) {
    const { showName, groupID, faceURL } = csconversation.currentConversation
    const info = {
      showName,
      groupID,
      faceURL
    }
    System.router.push(`/chat/${url}?groupInfo=${JSON.stringify(
      info,
    )}`)
  },
  cancle(e:any) {
    conf.transShow = false
    if(e == 2) csconversation.currentMemberInGroup.roleLevel = 20
  }
})
const isOwner = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Owner;
})
const isAdmin = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Admin;
})
const getConfirmContent = computed(() => {
  if (conf.confirmType === ConfirmTypes.Quit) {
    return i18n.t('chatRoom.confirm_exit') + '?'
  }
  if (conf.confirmType === ConfirmTypes.Dismiss) {
    return i18n.t('chatRoom.confirm_dissolve') + '?'
  }
  return ''
})

onMounted(() => {
  console.log('666668.');
  console.log(csconversation.currentConversation.groupID);
  console.log(csconversation.groupMemberList);
  
  let list = csconversation.groupMemberList
  if(list.length && list[0].groupID == csconversation.currentConversation.groupID) {
    conf.groupMemberList = csconversation.groupMemberList
  }
  
  conf.getGroupMemberList()
})
</script>
<style lang="less" scoped>
@import './index.less';
</style>
