<template>
  <x-page backIcon="cross" :fixed="false" noFooter>
    <template #title>
      <span class="title">{{ $t('chatRoom.contact') }}</span>
    </template>
    <listSearch :chooseUser="getCheckedInfo" @change="(e) => conf.keyword = e" />

    <!-- 联系人列表 -->
    <contactList :getChooseData="getChooseData" :checkedIDList="conf.checkedUserIDList"
      :disabledIDList="conf.disabledUserIDList" @updateCheck="conf.updateCheckedUser" />

    <chooseFooter :chooseUser="getCheckedInfo" @updateCheck="conf.updateCheckedUser" @confirm="conf.confirm" />
  </x-page>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import listSearch from './listSearch.vue';
import contactList from './contactList.vue';
import chooseFooter from './chooseFooter.vue';
import cscontact from '@/modules/chat/sstore/cscontact';
import { formatChooseData, toastWithCallback } from '@/modules/chat/utils/cUtil';
import IMSDK, {
  GroupStatus,
  IMMethods,
  SessionType,
  MessageStatus,
} from "openim-uniapp-polyfill";
import System from '@/utils/System';
import { ContactChooseTypes } from '@/modules/chat/constant';
import sutil from '@/sstore/sutil';
import i18n from '@/lang';

const conf = reactive({
  keyword: '',
  type: ContactChooseTypes.Card,
  groupID: '',
  checkedUserIDList: [] as any[],
  disabledUserIDList: [] as any[],
  checkedGroupIDList: [] as any[],
  originConversations: [] as any[],
  updateCheckedUser(user: any) {
    let userID = user.userID
    if (conf.checkedUserIDList.includes(userID)) {
      const idx = conf.checkedUserIDList.findIndex((item) => item === userID);
      const tmpArr = [...conf.checkedUserIDList];
      tmpArr.splice(idx, 1);
      conf.checkedUserIDList = [...tmpArr];
    } else {
      conf.checkedUserIDList = [...conf.checkedUserIDList, userID];
    }
  },
  checkDisabledUser() {
    const friendIDList = cscontact.friendList.map((friend) => friend.userID);
    IMSDK.asyncApi(
      //@ts-ignore
      "getUsersInGroup",
      IMSDK.uuid(),
      {
        groupID: conf.groupID,
        userIDList: friendIDList,
      },
    ).then(({ data }: any) => {
      if (data.length == undefined) data = [data + '']
      conf.disabledUserIDList = data
    });
  },
  confirm() {
    console.log(getCheckedInfo.value);

    if (conf.type === ContactChooseTypes.GetList) {
      cscontact.getCheckedList = getCheckedInfo.value
      sutil.pageBack()
      return;
    }
    if (conf.type === ContactChooseTypes.Invite) {
      System.loading()
      IMSDK.asyncApi(IMSDK.IMMethods.InviteUserToGroup, IMSDK.uuid(), {
        groupID: conf.groupID,
        reason: '',
        userIDList: getCheckedInfo.value.map((user:any) => user.userID)
      })
        .then(() => {
          toastWithCallback(i18n.t('chatRoom.op_success'), () => sutil.pageBack())
        })
        .catch(() => toastWithCallback(i18n.t('chatRoom.op_failed'),()=>{},"error"))
        .finally(() => { System.loading(false) })
      return
    }
  }
})
const getChooseData = computed(() => {
  if (conf.keyword) {
    return {
      indexList: ["#"],
      dataList: [
        cscontact.friendList.filter(
          (friend) =>
            friend.nickname.includes(conf.keyword) ||
            friend.remark.includes(conf.keyword),
        ),
      ],
    };
  }
  return formatChooseData(cscontact.friendList);
})
const getCheckedInfo = computed(() => {
  const tmpUserIDList = [...conf.checkedUserIDList];
  const tmpGroupIDList = [...conf.checkedGroupIDList];
  const checkedFriends = cscontact.friendList.filter((friend) => {
    const idx = tmpUserIDList.findIndex(
      (userID) => userID === friend.userID,
    );
    if (idx > -1) {
      tmpUserIDList.splice(idx, 1);
    }
    return idx > -1;
  });
  const checkedGroups = cscontact.groupList.filter((group) => {
    const idx = tmpGroupIDList.findIndex(
      (groupID) => groupID === group.groupID,
    );
    if (idx > -1) {
      tmpGroupIDList.splice(idx, 1);
    }
    return idx > -1;
  });
  const checkedConversation = conf.originConversations.filter(
    (cve) =>
      tmpUserIDList.includes(cve.userID) ||
      tmpGroupIDList.includes(cve.groupID),
  );
  return [...checkedFriends, ...checkedGroups, ...checkedConversation];
})
onMounted(() => {
  const { groupID, type, checkedUserIDList } = System.getRouterParams()
  conf.groupID = groupID
  conf.checkDisabledUser()
  conf.type = type
  conf.checkedUserIDList = checkedUserIDList
    ? JSON.parse(checkedUserIDList)
    : []
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

::v-deep .c-head-nav-bottom {
  border-bottom: none !important;
}
</style>
