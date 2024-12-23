<template>
  <div class="user">
    <div class="user-list">
      <template v-for="item in getGroupMemberList" :key="item.userID">
        <div class="info" @click="conf.goPages(`/chat/userCard?sourceID=${item.userID}`)">
          <personItem :person="item" />
        </div>
      </template>
      <!-- <img src="/static/img/chat/setting_add.svg" @click="conf.goPages(`/chat/contactChoose?type=${ContactChooseTypes.Invite}&groupID=${groupID}`)" /> -->
      <img src="/static/img/chat/setting_add.svg" @click="conf.change('invite')" />
      <img v-if="isAdmin || isOwner" :style="{ 'margin-left': groupMemberList.length % 5 == 4 ? 0 : '6.25%' }"
        src="/static/img/chat/minus.png" @click="conf.change('move')" />
    </div>
    <div class="more flex-center" @click="conf.goPages('/chat/groupMemberList?groupID='+groupID)"
      v-if="isMore && showMore">
      <span>View more group members</span>
      <van-icon name="arrow" size="30rem" color="#B8B8B8" />
    </div>
  </div>
  <!-- 移除群成员 -->
  <van-popup class="popup-bottom-center" :show="conf.selectShow" position="bottom">
    <moveGroup :groupMemberList="groupMemberList" :type="conf.type" @cancle="conf.updteMember" />
  </van-popup>
  <!-- 邀请群成员 -->
  <van-popup class="popup-bottom-center" :show="conf.inviteShow" position="bottom">
    <inviteGroup ref="inviteRefs" :type="conf.type"
      :groupID="groupID" @cancle="conf.updteMember" />
  </van-popup>
</template>
<script setup lang="ts">
import personItem from '@/views/chat/contact/com/personItem.vue';
import System from '@/utils/System';
import { computed, reactive, ref } from 'vue';
import { GroupMemberRole } from 'openim-uniapp-polyfill';
import csconversation from '@/modules/chat/sstore/csconversation';
import { ContactChooseTypes, GroupMemberListTypes } from '@/modules/chat/constant';
import moveGroup from './moveGroup.vue';
import inviteGroup from './inviteGroup.vue';

const props = defineProps({
  groupID: {
    default: ''
  },
  memberCount: {
    default: 0
  },
  groupMemberList: {
    default: [] as any[]
  },
  isMore: {
    default: true
  }
})
const emit = defineEmits(['updteMember'])

const isOwner = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Owner;
})
const isAdmin = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Admin;
})

const showMore = computed(() => {
  if(isAdmin.value || isOwner.value) return props.groupMemberList.length > 18
  return props.groupMemberList.length > 19
})

const getGroupMemberList = computed(() => {
  if(!props.isMore) return props.groupMemberList
  if(isAdmin.value || isOwner.value) return props.groupMemberList.slice(0,18)
  console.log('5555');
  
  return props.groupMemberList.slice(0,19)
})

const inviteRefs = ref<any>()
const conf = reactive({
  type: '',
  inviteShow: false,
  selectShow: false,
  change(e:any) {
    if(e == 'invite') {
      inviteRefs.value?.initDisabledUser()
      conf.type = ContactChooseTypes.Invite
      conf.inviteShow = true
      return
    }
    conf.type = GroupMemberListTypes.Kickout
    conf.selectShow = true
  },
  updteMember(e:any) {
    conf.selectShow = false
    conf.inviteShow = false
    if (e == 2) emit('updteMember',e)
  },
  goPages(url: any) {
    System.router.push(url)
  }
})
</script>
<style lang="less" scoped>
.user {
  background: #fff;
  padding: 20rem 30rem 30rem;

  .user-list {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 20rem;

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
      margin-bottom: 20rem;
    }
  }
}

@import '../index.less';
</style>
