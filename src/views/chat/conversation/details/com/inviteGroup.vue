<template>
  <div class="move">
    <div>
      <x-statusbar />
      <div class="head-cont">
        <van-icon class="back-img" name="cross" size="36rem" @click="conf.cancle()" />
        <div class="title">{{ $t('chatRoom.contact') }}</div>
        <div style="width: 36rem;"></div>
      </div>
    </div>
    <!-- 选中、搜索框 -->
    <listSearch :chooseUser="getCheckedInfo" @change="(e: any) => conf.keyword = e" />

    <!-- 联系人列表 -->
    <div style="position: relative;flex: 1;overflow-y: auto;background: #fff;">
      <contactList :getChooseData="getChooseData" :checkedIDList="conf.checkedUserIDList"
        :disabledIDList="conf.disabledUserIDList" @updateCheck="conf.updateCheckedUser" />
    </div>

    <chooseFooter :chooseUser="getCheckedInfo" @updateCheck="conf.updateCheckedUser" @confirm="conf.confirm" />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import listSearch from './listSearch.vue';
import contactList from './contactList.vue';
import chooseFooter from './chooseFooter.vue';
import cscontact from '@/modules/chat/sstore/cscontact';
import { formatChooseData, toastWithCallback } from '@/modules/chat/utils/cUtil';
import IMSDK from "openim-uniapp-polyfill";
import System from '@/utils/System';
import { ContactChooseTypes } from '@/modules/chat/constant';
import i18n from '@/lang';

const props = defineProps({
  groupID: {
    default: ''
  },
  type: {
    default: ContactChooseTypes.Card
  }
})
const emit = defineEmits(['cancle'])
const conf = reactive({
  keyword: '',
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
  confirm() {
    if (props.type === ContactChooseTypes.GetList) {
      cscontact.getCheckedList = getCheckedInfo.value
      setTimeout(() => {
        conf.cancle(2)
      }, 200)
      return;
    }
    if (props.type === ContactChooseTypes.Invite) {
      System.loading()
      IMSDK.asyncApi(IMSDK.IMMethods.InviteUserToGroup, IMSDK.uuid(), {
        groupID: props.groupID,
        reason: '',
        userIDList: getCheckedInfo.value.map((user: any) => user.userID)
      })
        .then(() => {
          toastWithCallback(i18n.t('chatRoom.op_success'), () => setTimeout(() => {
            conf.cancle(2)
          }, 200))
        })
        .catch(() => toastWithCallback(i18n.t('chatRoom.op_failed'), () => { }, "error"))
        .finally(() => { System.loading(false) })
      return
    }
  },
  cancle(type = 1) {
    conf.checkedUserIDList = []
    conf.checkedGroupIDList = []
    emit('cancle', type)
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
  initDisabledUser()
})
const initDisabledUser = () => {
  const friendIDList = cscontact.friendList.map((friend) => friend.userID);
  IMSDK.asyncApi(
    //@ts-ignore
    "getUsersInGroup",
    IMSDK.uuid(),
    {
      groupID: props.groupID,
      userIDList: friendIDList,
    },
  ).then(({ data }: any) => {
    if (data.length == undefined) data = [data + '']
    conf.disabledUserIDList = data 
  });
}
// 暴露方法
defineExpose({
  initDisabledUser
})
</script>
<style lang="less" scoped>
.move {
  height: 100vh;
  background: #efefef;
  display: flex;
  flex-direction: column;
}

.head-cont {
  color: #000;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rem 0rem 10rem;
  font-size: 28rem;
  height: 104rem;

  .cancle {
    padding: 10rem 20rem;
    position: relative;
    z-index: 9;
  }

  .title {
    font-size: 32rem;
    color: #000;

  }

  .finsh {
    background: #f1f1f1;
    color: #999;
    height: 55rem;
    line-height: 55rem;
    padding: 0rem 20rem;
    border-radius: 8rem;
    font-size: 26rem;
    background: #dedede;
  }

  .active {
    color: #fff;
    background: #07c261;
  }
}

.input {
  height: 100%;
  flex: 1;
  padding: 5rem;
  background: #fff;
}

.choosed {
  display: flex;
  align-items: center;
  background: #fff;
  width: 100%;
  padding: 0rem 20rem;
  height: 120rem;
  border-bottom: 2rem solid #d3d3d3;

  .user {
    display: flex;
    max-width: 400rem;
    overflow-x: auto;

    .info {
      width: 80rem;
      margin-left: 20rem;
    }
  }

  ::v-deep .van-search__content {
    background: #fff;
    padding-left: 0;
  }
}

.isFocus {
  ::v-deep .van-icon-search:before {
    content: "";
  }
}

.group-content {
  background: #fff;
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(10rem + env(safe-area-inset-bottom));
}
</style>
