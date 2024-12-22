<template>
  <div class="move">
    <div>
      <x-statusbar />
      <div class="head-cont">
        <div class="cancle" @click="conf.cancle()">cancle</div>
        <div class="title">Select group master</div>
        <div class="finsh" :class="{ 'active': conf.transferInfo.userID }" @click="conf.confirm">finish</div>
      </div>
    </div>
    <!-- 选中、搜索框 -->
    <div style="margin: 20rem;">
      <van-search class="input" v-model="conf.keyword" :placeholder="$t('chatRoom.search')" />
    </div>

    <!-- 联系人列表 -->
    <div style="position: relative;flex: 1;overflow-y: auto;background: #fff;">
      <contactList :checkVisible="false" :getChooseData="getChooseData" 
        @updateCheck="conf.updateCheckedUser" :singleId="conf.transferInfo.userID" />
    </div>

    <!-- 移除提示框 -->
    <van-dialog :show="conf.showConfirmModal" title="" show-cancel-button :confirmButtonText="$t('chatRoom.confirm')"
      :cancelButtonText="$t('chat.cancle')" @cancel="conf.showConfirmModal = false" @confirm="conf.confirmMove">
      <div style="padding: 40rem;">
        {{ `${$t('chatRoom.confirm_transfer')}${conf.transferInfo.nickname}?`}}
      </div>
    </van-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import listSearch from './listSearch.vue';
import contactList from './contactList.vue';
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

const props = defineProps({
  groupID: {
    default: ''
  },
  type: {
    default: ContactChooseTypes.Card
  },
  groupMemberList: {
    default: [] as any[]
  }
})
const emit = defineEmits(['cancle'])
const conf = reactive({
  keyword: '',
  showConfirmModal: false,
  transferInfo: {} as any,
  updateCheckedUser(user: any) {
    conf.transferInfo = user
  },
  confirmMove() {
    console.log(conf.transferInfo.groupID);
    console.log(conf.transferInfo.userID);
    
      let func:any = () => {};
      System.loading()
      func = IMSDK.asyncApi(
        IMSDK.IMMethods.TransferGroupOwner,
        IMSDK.uuid(),
        {
          groupID: conf.transferInfo.groupID,
          newOwnerUserID: conf.transferInfo.userID,
        },
      );
      func
        .then(() => {
          conf.showConfirmModal = false
          System.toast(i18n.t('chatRoom.op_success'),"success");
          setTimeout(() => {
            conf.cancle(2)
          },1000)
        })
        .catch(() => System.toast(i18n.t('chatRoom.op_failed')))
        .finally(() => (System.loading(false)));
    },
  confirm() {
    if(!conf.transferInfo.userID) return
    conf.showConfirmModal = true
  },
  cancle(type = 1) {
    console.log(conf.transferInfo);
    
    emit('cancle', type)
  }
})
const getChooseData = computed(() => {
  if (conf.keyword) {
    return {
      indexList: ["#"],
      dataList: [
      props.groupMemberList.filter(
          (friend) =>
            friend.nickname.includes(conf.keyword) ||
            friend.remark.includes(conf.keyword),
        ),
      ],
    };
  }
  return formatChooseData(props.groupMemberList);
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
  border-radius: 8rem;
}

::v-deep .van-search__content {
  background: #fff;
}

.group-content {
  background: #fff;
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(10rem + env(safe-area-inset-bottom));
}
</style>
