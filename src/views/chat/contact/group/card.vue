<template>
  <x-page headerBgColor="#fff">
    <div class="head-content">
      <img class="img" :src="conf.sourceGroupInfo.faceURL || '/static/images/contact_new_group.png'" />
      <div class="info">
        <div class="name">
          {{ conf.sourceGroupInfo.groupName }}
          <span v-if="!!conf.sourceGroupInfo.memberCount" style="margin-left: 8rem;"> ({{
            conf.sourceGroupInfo.memberCount }})</span>
        </div>
        <div class="time">
          <van-icon name="clock-o" size="28rem" />
          <span style="margin-left: 16rem;">{{ sutil.getTimeFormat(conf.sourceGroupInfo.createTime, 3) }}</span>
        </div>
      </div>
    </div>
    <div class="group-list">
      <div class="tilte" @click="conf.toMemberList">
        <div>
          {{ $t('chatRoom.grp_members') }}
          <span class="member_count">{{
            `${conf.sourceGroupInfo.memberCount}人`
            }}</span>
        </div>
        <van-icon name="arrow" size="30rem" color="#999" />
      </div>
      <div class="list">
        <div class="user-item" v-for="(item, index) in getRenderMemberList" :key="index">
          <headImg :src="item.faceURL" />
        </div>
        <div class="user-item last-item">
          ...
        </div>
      </div>
    </div>
    <div class="uid">
      {{ $t('chatRoom.grp') + ' ID' }}
      <span>{{ conf.sourceGroupInfo.groupID }}</span>
    </div>
    <div class="btn">
      <van-button type="success" @click="conf.chatingInGroup">{{ !isJoinedGroup ? $t('chatRoom.apply_grp') :
        $t('chatRoom.send_msg') }}</van-button>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import cscontact from '@/modules/chat/sstore/cscontact';
import headImg from '../../components/head.vue';
import System from '@/utils/System';
import { computed, onMounted, reactive } from 'vue';
import IMSDK, {
  GroupVerificationType,
  SessionType,
} from "openim-uniapp-polyfill";
import sutil from '@/sstore/sutil';
import { navigateToDesignatedConversation } from '@/modules/chat/utils/cUtil';
import i18n from '@/lang';
import csuser from '@/modules/chat/sstore/csuser';

const conf = reactive({
  isScan: false,
  sourceID: '',
  sourceGroupInfo: {} as any,
  groupMemberList: [] as any[],
  async getSourceGroupInfo() {
    let info = null;
    if (isJoinedGroup.value) {
      info = cscontact.groupList.find(
        (group) => group.groupID === conf.sourceID,
      );
    } else {
      try {
        const { data }: any = await IMSDK.asyncApi(
          IMSDK.IMMethods.GetSpecifiedGroupsInfo,
          IMSDK.uuid(),
          [conf.sourceID],
        );
        info = data[0] ?? {};
      } catch (e) {
        info = {};
      }
    }
    conf.sourceGroupInfo = {
      ...info,
    };

  },
  getGroupMemberList() {
    if (isJoinedGroup.value) {
      IMSDK.asyncApi(IMSDK.IMMethods.GetGroupMemberList, IMSDK.uuid(), {
        groupID: conf.sourceID,
        filter: 0,
        offset: 0,
        count: 6,
      }).then(({ data }: any) => {
        conf.groupMemberList = [...data];
      });
    }
  },
  chatingInGroup() {
    if (!isJoinedGroup) {
      return conf.joinGroup()
    }
    navigateToDesignatedConversation(
      conf.sourceID,
      SessionType.WorkingGroup,
    ).catch(() => System.toast(i18n.t('chatRoom.get_sess_failed')));
  },
  joinGroup() {
    System.router.push(`/chat/add/send?info=${JSON.stringify(
      {
        isGroup: true,
        sourceID: conf.sourceID,
        isScan: conf.isScan,
        notNeedVerification:
          conf.sourceGroupInfo.needVerification ===
          GroupVerificationType.AllNot,
        sessionType: SessionType.WorkingGroup,
        nickname: csuser.selfInfo.nickname
      }
    )}`)
  },
  toMemberList() {
    if (isJoinedGroup.value) {
      System.router.push(`/chat/groupMemberList?groupID=${conf.sourceID}`)
    }
  },
})

const isJoinedGroup = computed(() => {
  return (
    cscontact.groupList.findIndex(
      (group) => group.groupID === conf.sourceID,
    ) !== -1
  );
})
const getRenderMemberList = computed(() => {
  if (isJoinedGroup.value) {
    return conf.groupMemberList.slice(0, 6);
  }
  const memberCount = conf.sourceGroupInfo.memberCount ?? 0;
  return new Array(memberCount >= 6 ? 6 : memberCount)
    .fill(1)
    .map((item, idx) => ({
      userID: idx,
      faceURL: '',
    }));
})
onMounted(() => {
  const { sourceID, sourceInfo, isScan } = System.getRouterParams()
  conf.isScan = !!isScan;
  if (sourceID) {
    conf.sourceID = sourceID;
    conf.getSourceGroupInfo();
  } else {
    const info = JSON.parse(sourceInfo);
    conf.sourceID = info.groupID;
    conf.sourceGroupInfo = {
      ...info,
    };
  }
  conf.getGroupMemberList();
})
</script>
<style lang="less" scoped>
.head-content {
  background: #fff;
  padding: 30rem;
  display: flex;
  align-items: center;

  .img {
    width: 100rem;
    height: 100rem;
  }

  .info {
    font-size: 28rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding: 4rem 20rem;

    .time {
      color: #999;
    }
  }
}

.group-list {
  background: #fff;
  padding: 30rem;
  margin-top: 20rem;

  .tilte {
    font-size: 30rem;
    display: flex;
    align-items: center;
    justify-content: space-between;

    span {
      color: #999;
      margin-left: 10rem;
    }
  }

  .list {
    display: flex;
    width: 100%;
    margin-top: 20rem;

    .user-item {
      width: 12%;
      height: 80rem;
      border-radius: 8rem;
      overflow: hidden;
      margin-right: 2.5%;
    }

    .last-item {
      background: #07c261;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 0;
      font-size: 32rem;
      color: #fff;
      padding-bottom: 16rem;
    }
  }
}

.uid {
  margin-top: 20rem;
  padding: 30rem;
  background: #fff;
  font-size: 30rem;

  span {
    margin-left: 10rem;
    color: #999;
  }
}

.btn {
  // width: 50%;
  margin-top: 120rem;
  display: flex;
  justify-content: center;

  button {
    width: 80%;
  }
}
</style>
