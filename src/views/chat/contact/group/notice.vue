<template>
  <div class="move">
    <div>
      <x-statusbar />
      <div class="head-cont">
        <div class="cancle" @click="conf.cancle">
          <van-icon class="back-img" name="arrow-left" color="#000" size="42rem" v-if="conf.notification" />
          <span v-else>cancel</span>
        </div>
        <div class="title">Group Notice</div>
        <div v-if="isNomal"></div>
        <div v-else-if="conf.notification && !conf.showEdit" @click="conf.changeEdit">Edit</div>
        <div class="finsh" v-else :class="{ 'active': conf.keyword != conf.notification }" @click="conf.comfirmUpdate">
          finish</div>
      </div>
    </div>

    <div class="group-content">
      <div style="flex: 1;">
        <div class="top-person" v-if="conf.notification">
          <div class="img">
            <headImg :src="conf.personInfo.faceURL" />
          </div>
          <div class="name">
            <div>{{ conf.personInfo.nickname }}</div>
            <div class="time">{{ conf.updateTime }}</div>
          </div>
        </div>
        <textarea ref="inputRef" v-model="conf.keyword" class="textarea" placeholder="input notice"
          :disabled="!conf.showEdit" style="opacity: 1 !important;"></textarea>
      </div>
      <div class="tips" v-if="isNomal">
        <div class="line"></div>
        <span>Only the group owner and administrator can edit</span>
        <div class="line"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import headImg from '../../components/headImg.vue';
import { computed, onMounted, reactive, ref } from 'vue';
import sutil from '@/sstore/sutil';
import IMSDK, { GroupMemberRole } from "openim-uniapp-polyfill";
import csconversation from '@/modules/chat/sstore/csconversation';
import { capis } from '@/modules/chat/api';
import System from '@/utils/System';
import i18n from '@/lang';
import { showDialog } from 'vant';

const inputRef = ref<any>()
const conf = reactive({
  isActive: false,
  isFocus: false,
  keyword: '',
  checkedIDList: [] as any[],
  chooseUser: [] as any[],
  showConfirmModal: false,
  personInfo: {} as any,
  updateTime: '',
  notification: '',
  showEdit: false,
  changeEdit() {
    conf.showEdit = true
    setTimeout(() => {
      inputRef.value?.focus()
    }, 100)
  },
  async getGroupMemberList() {
    const { members, total } = await capis.getGroupMemberList(
      {
        filter: 0,
        groupID: csconversation.currentGroup.groupID,
        keyword: csconversation.currentGroup.notificationUserID,
        pagination: {
          pageNumber: 1,
          showNumber: 1,
        },
      }
    );
    conf.personInfo = members[0]
  },
  cancle() {
    if (conf.keyword == conf.notification) return sutil.pageBack()
    showDialog({
      confirmButtonText: 'Editing',
      showCancelButton: true,
      cancelButtonText: 'quit',
      message: 'Exit this edit?',
    }).then(() => {
      conf.changeEdit()
    })
      .catch(() => {
        sutil.pageBack()
      })
  },
  comfirmUpdate() {
    if (conf.keyword == conf.notification) return
    const message = conf.keyword ? 'Confirm the release of group notification' : 'Confirm to clear the group notification'
    showDialog({
      confirmButtonText: i18n.t('chatRoom.confirm'),
      showCancelButton: true,
      cancelButtonText: i18n.t('chatRoom.cancel'),
      message
    }).then(() => {
      conf.updateNotify()
    })
      .catch(() => {
        // on cancel
      })
  },
  updateNotify() {
    System.loading()
    let func;
    func = IMSDK.asyncApi(IMSDK.IMMethods.SetGroupInfo, IMSDK.uuid(), {
      groupID: csconversation.currentGroup.groupID,
      notification: conf.keyword,
    });

    func
      .then(() => {
        System.toast(i18n.t('chatRoom.modify_succ'), "success");
        csconversation.currentGroup.notification = conf.keyword
        setTimeout(() => sutil.pageBack(), 250);
      })
      .catch(() => System.toast(i18n.t('chatRoom.modify_failed')))
      .finally(() => (System.loading(false)));
  }
})
const isNomal = computed(() => {
  return csconversation.currentMemberInGroup.roleLevel === GroupMemberRole.Nomal;
})
onMounted(() => {
  conf.updateTime = new Date(csconversation.currentGroup.notificationUpdateTime).Format('yyyy.MM.dd hh:mm')
  conf.keyword = csconversation.currentGroup.notification
  conf.notification = csconversation.currentGroup.notification
  if (!conf.notification) conf.changeEdit()
  conf.getGroupMemberList()
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

.group-content {
  background: #fff;
  flex: 1;
  overflow-y: auto;
  padding: 0rem 30rem;
  padding-bottom: calc(10rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;

  .top-person {
    display: flex;
    align-items: center;
    border-bottom: 2rem solid #F6F7FA;
    padding: 20rem 0rem;

    .img {
      width: 80rem;
      height: 80rem;
      border-radius: 8rem;
      overflow: hidden;
    }

    .name {
      padding-left: 20rem;
      font-size: 30rem;
      color: #000;

      .time {
        font-size: 26rem;
        color: #999;
      }
    }
  }

  .textarea {
    width: 100%;
    height: 90%;
    font-size: 28rem;
    padding: 40rem 4rem;
  }

  .tips {
    display: flex;
    align-items: center;
    justify-content: center;
    color: grey;
    font-size: 24rem;
    padding-bottom: 60rem;

    .line {
      width: 60rem;
      height: 2rem;
      background: #e1e1e1;
    }

    span {
      margin: 0 10rem;
    }
  }
}

::v-deep .disabled {
  opacity: 1 !important;
}
</style>
