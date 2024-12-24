<template>
  <div class="move">
    <div>
      <x-statusbar />
      <div class="head-cont">
        <div class="cancle" @click="conf.cancle()">cancle</div>
        <div class="title">{{ type=='SetAdmin'? 'Select group members' :  $t('chatRoom.rm_grp_mem') }}</div>
        <div class="finsh" :class="{ 'active': conf.chooseUser.length }" @click="conf.finish">finish</div>
      </div>
    </div>
    <!-- 选中、搜索框 -->
    <div class="choosed" :class="{ 'isFocus': conf.isFocus || conf.chooseUser.length }">
      <div class="user" v-scroll ref="leftRefs">
        <div class="info" v-for="item in conf.chooseUser" :key="item.userID">
          <personItem :showName="false" :imgW="80" :person="item" />
        </div>
      </div>
      <van-search class="input" @focus="conf.isFocus = true" @blur="conf.isFocus = false" v-model="conf.keyword"
        :placeholder="$t('chatRoom.search')" />
    </div>
    <!-- 群成员列表 -->
    <div class="group-content">
      <van-index-bar z-index="3" :index-list="getChooseData.indexList">
      <template v-for="(item, index) in getChooseData.dataList" :key="index">
        <van-index-anchor :index="getChooseData.indexList[index]" />
        <template v-for="(user, i2) in item" :key="i2">
          <userItem
            :item="user"
            :lastItem="i2 == (item.length - 1)"
            :disabled="disabled && user.roleLevel >=50"
            :checked="conf.checkedIDList.includes(user.userID)" :checkVisible="true"
            @click="conf.updateCheckedUser(user)" v-if="user.roleLevel != GroupMemberRole.Owner" />
        </template>
      </template>
    </van-index-bar>
    </div>
  </div>
  <!-- 移除提示框 -->
  <van-dialog :show="conf.showConfirmModal" title="" show-cancel-button :confirmButtonText="$t('chatRoom.confirm')"
    :cancelButtonText="$t('chat.cancle')" @cancel="conf.showConfirmModal = false" @confirm="conf.confirmMove">
    <div style="padding: 40rem;">
      {{ `${$t('chatRoom.confirm_rm')}?` }}
    </div>
  </van-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import userItem from '@/views/chat/contact/com/userItem.vue';
import personItem from '@/views/chat/contact/com/personItem.vue';
import sutil from '@/sstore/sutil';
import { GroupMemberListTypes } from '@/modules/chat/constant';
import IMSDK, { AllowType, GroupMemberRole } from "openim-uniapp-polyfill";
import System from '@/utils/System';
import i18n from '@/lang';
import { formatChooseData } from '@/modules/chat/utils/cUtil';

const props = defineProps({
  groupMemberList: {
    default: [] as any[]
  },
  type: {
    default: null as any
  },
  disabled: {
    default: false
  }
})

const emit = defineEmits(['cancle'])
const leftRefs = ref<any>()
const conf = reactive({
  isActive: false,
  isFocus: false,
  keyword: '',
  checkedIDList: [] as any[],
  chooseUser: [] as any[],
  showConfirmModal: false,
  updateCheckedUser(user: any) {
    let userID = user.userID
    if (conf.checkedIDList.includes(userID)) {
      const idx = conf.checkedIDList.findIndex((item) => item === userID);
      const tmpArr = [...conf.checkedIDList];
      tmpArr.splice(idx, 1);
      conf.checkedIDList = [...tmpArr];
      conf.chooseUser.splice(idx, 1)
      conf.leftTop(-1)
    } else {
      conf.checkedIDList = [...conf.checkedIDList, userID];
      conf.chooseUser.push(user)
      conf.leftTop(1)
    }
  },
  leftTop(num: any) {
    if (conf.chooseUser.length < 5) return
    setTimeout(() => {
      let scrollLeft = (conf.chooseUser.length - 4) * sutil.rem2px(100) * num
      leftRefs.value?.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }, 100)
  },
  cancle(type = 1) {
    conf.chooseUser = []
    conf.checkedIDList = []
    emit('cancle', type)
  },
  finish() {
    if (conf.chooseUser.length) {
      if (props.type == 'SetAdmin') {
        let arr = conf.chooseUser
        conf.chooseUser = []
        conf.checkedIDList = []
        emit('cancle', arr)
        return
      }
      conf.showConfirmModal = true
    }
  },
  confirmMove() {
    let func: any = () => { };
    System.loading()
    if (props.type === GroupMemberListTypes.Kickout) {
      func = IMSDK.asyncApi(IMSDK.IMMethods.KickGroupMember, IMSDK.uuid(), {
        groupID: conf.chooseUser[0].groupID,
        reason: "",
        userIDList: conf.chooseUser.map((member) => member.userID),
      });
    } else {
      func = IMSDK.asyncApi(
        IMSDK.IMMethods.TransferGroupOwner,
        IMSDK.uuid(),
        {
          groupID: conf.chooseUser[0].groupID,
          newOwnerUserID: conf.chooseUser[0].userID,
        },
      );
    }
    func
      .then(() => {
        conf.showConfirmModal = false
        System.toast(i18n.t('chatRoom.op_success'), "success");
        setTimeout(() => {
          conf.cancle(2)
        }, 1000)
      })
      .catch(() => System.toast(i18n.t('chatRoom.op_failed')))
      .finally(() => (System.loading(false)));
  },
})

const isRemove = computed(() => {
  return props.type === GroupMemberListTypes.Kickout;
})

// const getChooseData = computed(() => {
//   if (conf.keyword) {
//     return props.groupMemberList.filter(
//       (friend) =>
//         friend.nickname.includes(conf.keyword)
//     )
//   }
//   return props.groupMemberList
// })
const getChooseData = computed(() => {
  if (conf.keyword) {
    return {
      indexList: ["#"],
      dataList: [
        props.groupMemberList.filter(
          (friend) =>
            friend.nickname.includes(conf.keyword)
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
