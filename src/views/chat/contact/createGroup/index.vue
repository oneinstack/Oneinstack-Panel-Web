<template>
  <x-page>
    <template #title>
      <span class="title">发起群聊</span>
    </template>
    <div class="group-name">
      <img :src="conf.groupFaceUrl || '/static/images/contact_new_group.png'" />
      <input v-model="conf.groupName" :placeholder="$t('chatRoom.grp_fsname')" />
    </div>
    <div class="user-list" @click="conf.toChooseMember">
      <div class="title">
        <span>{{$t('chatRoom.grp_members')}}</span>
        <span>{{ `${conf.checkedMemberList.length} ${$t('chatRoom.people')}` }}</span>
      </div>
      <div class="list">
        <template v-for="item in conf.checkedMemberList" :key="item.userID">
          <div class="info">
            <personItem :person="item" />
          </div>
        </template>
      </div>
    </div>
    <div class="btn">
      <van-button type="success" @click="conf.complateCreate">{{ $t('chatRoom.create_comp') }}</van-button>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { ContactChooseTypes } from '@/modules/chat/constant';
import personItem from '../com/personItem.vue';
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
import cscontact from '@/modules/chat/sstore/cscontact';
import IMSDK, {
  GroupType,
  IMMethods,
  SessionType,
} from "openim-uniapp-polyfill";
import { navigateToDesignatedConversation, toastWithCallback } from '@/modules/chat/utils/cUtil';
import { apis } from '@/api';
import i18n from '@/lang';


const conf = reactive({
  groupName: '',
  checkedMemberList: [] as any[],
  createLoading: false,
  groupFaceUrl: '',
  toChooseMember() {
    console.log('888');

    const checkedIDList = conf.checkedMemberList.map(
      (member) => member.userID,
    );
    System.router.push(`/chat/contactChoose?type=${ContactChooseTypes.GetList
      }&checkedUserIDList=${JSON.stringify(checkedIDList)}`)
  },
  complateCreate() {
    System.loading()
    const options = {
      adminUserIDs: [],
      memberUserIDs: conf.checkedMemberList.map((member) => member.userID),
      groupInfo: {
        groupType: GroupType.WorkingGroup,
        groupName: conf.groupName,
        faceURL: conf.groupFaceUrl,
      },
    };
    IMSDK.asyncApi(IMSDK.IMMethods.CreateGroup, IMSDK.uuid(), options)
      .then(({ data }:any) => {
        toastWithCallback(i18n.t('chatRoom.create_succ'), () =>
          navigateToDesignatedConversation(
            data.groupID,
            SessionType.WorkingGroup,
            true,
          ),
        );
      })
      .finally(() => (System.loading(false)));
  },
  //选择图片上传
  async handleSelectPhoto(file: any) {
    if (file.content.startsWith('data:image')) {
      System.loading()
      const res = await apis.upload({
        file: file.file,
        final: (_, res) => {
          System.loading(false)
        }
      })
      conf.groupFaceUrl = res.data.link
    }
  },
})

onMounted(() => {
  const { sourceInfo } = System.getRouterParams()
  if (sourceInfo) {
    conf.checkedMemberList.push(JSON.parse(sourceInfo))
  }
  if (cscontact.getCheckedList.length) {
    conf.checkedMemberList = cscontact.getCheckedList
  }

})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.group-name {
  display: flex;
  background: #fff;
  padding: 30rem;
  margin-top: 20rem;

  img {
    width: 80rem;
    height: 80rem;
  }

  input {
    flex: 1;
    margin-left: 20rem;
    font-size: 30rem;
  }
}

.user-list {
  background: #fff;
  padding: 30rem 30rem 10rem;
  margin-top: 40rem;

  .title {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 32rem;
  }

  .list {
    display: flex;
    flex-wrap: wrap;
    margin-top: 20rem;

    .info {
      width: 15%;
      margin-right: 6.25%;
      margin-bottom: 20rem;

      &:nth-child(5n + 5) {
        margin-right: 0rem;
      }
    }

    img {
      width: 96rem;
      height: 96rem;
      border-radius: 8rem;
    }
  }
}
.btn{
  // width: 50%;
  margin-top: 120rem;
  display: flex;
  justify-content: center;
  button{
    width: 80%;
  }
}
</style>
