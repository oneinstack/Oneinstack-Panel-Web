<template>
  <x-page headerBgColor="#fff">
    <template #right v-if="isFriend">
      <div class="flex flex-center" style="width: 86rem; height: 100%" @click="conf.toMoreInfo('setting')">
        <van-icon name="ellipsis" size="44rem" color="#666" />
      </div>
    </template>
    <div class="user-card">
      <div class="user">
        <img class="author" :src="conf.sourceUserInfo.faceURL" />
        <div class="info">
          <div class="nickname">
            <span>{{ getShowName }}</span>
            <img style="width: 26rem; height: 26rem;margin-left: 10rem;"
              :src="`/static/img/chat/sex_${conf.sourceUserInfo.gender}.svg`" v-if="conf.sourceUserInfo.gender" />
          </div>
          <div v-if="conf.sourceUserInfo.remark">nickName: {{ conf.sourceUserInfo.nickname }}</div>
          <div>Uid: {{ conf.sourceUserInfo.userID }}</div>
          <!-- <div>Area: China</div> -->
        </div>
      </div>
      <div class="edit" v-if="isFriend" @click="conf.toMoreInfo('notes')">
        <div class="title">{{ $t('chatRoom.set_note') }}</div>
        <van-icon name="arrow" size="34rem" color="#B8B8B8" />
      </div>
    </div>
    <div class="other">
      <!-- <div class="other-item">
        <img style="width: 34rem; height: 34rem;margin-right: 16rem;" src="/static/img/chat/video.svg" />
        <span>Voice or Video Call</span>
      </div> -->
      <div class="other-item" @click="conf.toAddFriend" v-if="!isFriend && !conf.disableAdd && !isSelf">
        <span>Add to Contacts</span>
      </div>
      <div class="other-item" v-else @click="conf.toDesignatedConversation">
        <img style="width: 30rem; height: 30rem;margin-right: 16rem;" src="/static/img/chat/message.svg" />
        <span>Messages</span>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { capis } from '@/modules/chat/api';
import { computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router';
import IMSDK, {
  GroupJoinSource,
  GroupMemberRole,
  SessionType,
} from "openim-uniapp-polyfill";
import csconversation from '@/modules/chat/sstore/csconversation';
import csuser from '@/modules/chat/sstore/csuser';
import cscontact from '@/modules/chat/sstore/cscontact';
import System from '@/utils/System';
import { navigateToDesignatedConversation } from '@/modules/chat/utils/cUtil';
import i18n from '@/lang';
const conf = reactive({
  isLoading: false,
  sourceID: '',
  sourceUserInfo: {} as any,
  memberInfo: null as any,
  switchLoading: false,
  showSetRole: false,
  showSetMuteMember: false,
  disableAdd: false,
  async getSourceUserInfo() {
    let info = null;
    conf.isLoading = true
    try {
      const { total, users } = await capis.businessSearchUserInfo(
        {
          keyword: conf.sourceID,
          pagination: {
            pageNumber: 1,
            showNumber: 10,
          },
        }
      );
      console.log(total);

      if (total > 0) {
        info = {
          ...users[0]
        };
        // const { data } : any = await IMSDK.asyncApi(
        //   // @ts-ignore
        //   'getUsersInfoWithCache',
        //   IMSDK.uuid(),
        //   { userIDList: [conf.sourceID] },
        // );
        // console.log('6666');
        // console.log(data);
        
        
        // const imData = data[0]?.friendInfo ?? data[0]?.publicInfo ?? {};
        // info = {
        //   ...imData,
        //   ...users[0],
        // };
        cscontact.friendList.filter((item) => {
          if (item.userID == conf.sourceID) {
            info = {
              ...users[0],
              ...item
            };
          }
        })
      }
    } catch (e) {
      info = {};
    }
    conf.isLoading = false
    conf.sourceUserInfo = {
      ...info,
    };
    console.log(conf.sourceUserInfo);

  },
  async checkCurrentMember() {
    let role;
    if (csconversation.currentMemberInGroup.groupID === conf.memberInfo.groupID) {
      role = csconversation.currentMemberInGroup.roleLevel;
    } else {
      try {
        const { data }: any = await IMSDK.asyncApi(
          IMSDK.IMMethods.GetSpecifiedGroupMembersInfo,
          IMSDK.uuid(),
          {
            groupID: conf.memberInfo.groupID,
            userIDList: [csuser.selfInfo.userID],
          },
        );
        role = data[0]?.roleLevel;
      } catch (e) { }
    }
    conf.showSetRole = role === GroupMemberRole.Owner;
    conf.showSetMuteMember =
      role === GroupMemberRole.Owner ||
      (role === GroupMemberRole.Admin &&
        conf.memberInfo.roleLevel === GroupMemberRole.Nomal);
  },
  friendInfoChangeHandler({ data }: any) {
    if (data.userID === conf.sourceUserInfo.userID) {
      conf.sourceUserInfo = {
        ...conf.sourceUserInfo,
        ...data,
      };
    }
  },
  groupMemberInfoChangeHandler({ data }: any) {
    if (
      data.userID === conf.memberInfo.userID &&
      data.groupID === conf.memberInfo.groupID
    ) {
      conf.memberInfo = {
        ...conf.memberInfo,
        ...data,
      };
    }
  },
  setIMListener() {
    IMSDK.subscribe(
      IMSDK.IMEvents.OnFriendInfoChanged,
      conf.friendInfoChangeHandler,
    );
    IMSDK.subscribe(
      IMSDK.IMEvents.OnGroupMemberInfoChanged,
      conf.groupMemberInfoChangeHandler,
    );
  },
  toAddFriend() {
    let info = { isGroup: false, sourceID: conf.sourceID, isScan: false, notNeedVerification: false, nickname: csuser.selfInfo.nickname }
    System.router.push(`/chat/add/send?info=${JSON.stringify(
      info,
    )}`)
  },
  toMoreInfo(url:any) {
    System.router.push(`/chat/userCard/${url}?isRemark=true&sourceInfo=${JSON.stringify(
      conf.sourceUserInfo,
    )}`)
  },
  toDesignatedConversation() {
    navigateToDesignatedConversation(
      conf.sourceID,
      SessionType.Single,
      conf.memberInfo !== null,
    ).catch(() => System.toast(i18n.t('chatRoom.DescriptionFailed')));
  },
})
const getShowName = computed(() => {
  if (conf.sourceUserInfo.remark) {
    return conf.sourceUserInfo.remark
  }
  return conf.sourceUserInfo.nickname
})
const isFriend = computed(() => {
  return (
    cscontact.friendList.findIndex(
      (friend) => friend.userID === conf.sourceID,
    ) !== -1
  );
})
const isSelf = computed(() => {
  return conf.sourceID === csuser.selfInfo.userID;
})
const route = useRoute()
onMounted(() => {
  const { sourceID, sourceInfo, memberInfo, disableAdd }: any = route.query
  conf.disableAdd = disableAdd ? JSON.parse(disableAdd) : false
  if (sourceID) {
    conf.sourceID = sourceID
    conf.getSourceUserInfo()
  } else {
    const info = JSON.parse(sourceInfo)
    conf.sourceID = info.userID
    conf.sourceUserInfo = {
      ...info
    }
  }
  if (memberInfo) {
    conf.memberInfo = JSON.parse(memberInfo)
    conf.checkCurrentMember()
  }
  conf.setIMListener()
})
</script>
<style lang="less" scoped>
.user-card {
  background: #fff;

  .user {
    display: flex;
    padding: 30rem 24rem 40rem;

    .author {
      width: 96rem;
      height: 96rem;
      border-radius: 4rem;
      margin-top: 9rem;
    }

    .info {
      font-size: 24rem;
      color: #666;
      margin-left: 30rem;

      .nickname {
        font-size: 32rem;
        font-weight: 500;
        color: #000;
        display: flex;
        align-items: center;
        margin-bottom: 4rem;
      }
    }
  }

  .edit {
    padding: 24rem 20rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2rem solid #F6F7FA;

    .title {
      font-size: 28rem;
      font-weight: 500;
      color: #000;
    }
  }
}

.other {
  background: #fff;
  margin-top: 16rem;

  .other-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rem;
    color: #5B6983;
    font-weight: 500;
    font-size: 28rem;

    &:not(:last-of-type) {
      border-bottom: 2rem solid #F6F7FA;
    }
  }
}
</style>
