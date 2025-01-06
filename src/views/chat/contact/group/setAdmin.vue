<template>
  <x-page :bgcolor="'#fff'" :header-bg-color="'#fff'">
    <div class="head-title">{{$t('chatRoom.groupAdministrator')}}</div>
    <div class="tips">
      <div class="item">
        <div class="left-q"><div></div></div>
        <div>{{$t('chatRoom.administratorTips1')}}</div>
      </div>
      <div class="item">
        <div class="left-q"><div></div></div>
        <div>{{$t('chatRoom.administratorTips2')}}</div>
      </div>
    </div>
    <div class="group-admin">
      <div class="admin-item" v-for="item in getAdminList" :key="item.userID">
        <div class="img">
          <headImg :src="item.faceURL" />
        </div>
        <div class="nickname">{{ item.nickname }}</div>
        <div class="move" @click="conf.changeItem(item)">{{$t('chatRoom.remove')}}</div>
      </div>
      <div class="admin-item add" @click="conf.selectShow = true">
        <div class="img">
          <van-icon size="36rem" name="add-o" />
        </div>
        <div class="nickname">{{$t('chatRoom.addMembers')}}</div>
      </div>
    </div>
    <!-- 选择用户 -->
    <van-popup class="popup-bottom-center" :show="conf.selectShow" position="bottom">
      <moveGroup :type="'SetAdmin'" :disabled="true" :groupMemberList="csconversation.groupMemberList"
        @cancle="conf.updteMember" />
    </van-popup>
    <!-- 移除管理员确认框 -->
    <van-popup class="popup-bottom-center" :show="conf.moveShow" position="bottom" borderRadius='10' :round="true"
      @close="conf.moveShow = false">
      <div class="out-popup">
        <div class="out-line out-tip">{{$t('chatRoom.removeAdministrator')}} {{ conf.selectAdmin.nickname }}</div>
        <div class="out-line out-sure" @click="conf.moveAdmin">{{$t('chatRoom.administrativeRights')}}</div>
        <div style="height: 20rem; background: #f6f6f6"></div>
        <div class="out-line" @click="conf.moveShow = false">{{ $t('me.cancle') }}</div>
      </div>
    </van-popup>
  </x-page>
</template>
<script setup lang="ts">
import moveGroup from '../../conversation/details/com/moveGroup.vue';
import headImg from '../../components/headImg.vue';
import System from '@/utils/System';
import { computed, onMounted, reactive } from 'vue';
import IMSDK, {
  GroupMemberRole,
} from "openim-uniapp-polyfill";
import i18n from '@/lang';;
import csconversation from '@/modules/chat/sstore/csconversation';


const conf = reactive({
  sourceInfo: {} as any,
  selectShow: false,
  adminList: [] as any[],
  moveShow: false,
  selectAdmin: {} as any,
  changeItem(item: any) {
    conf.selectAdmin = item
    conf.moveShow = true
  },
  updteMember(e: any) {
    conf.selectShow = false
    console.log(e);
    if (e != 1) {
      conf.updteAdmain(e,1)
    }
  },
  moveAdmin() {
    conf.updteAdmain([conf.selectAdmin],2)
  },
  updteAdmain(e:any,type = 1) { // type 1添加 2移除
    let userIdArr = [] as any[]
    const promiseArray = e.map(async ({
      userID
    }: any) => {
      userIdArr.push(userID)
      await IMSDK.asyncApi(IMSDK.IMMethods.SetGroupMemberInfo, IMSDK.uuid(), {
        groupID: conf.sourceInfo.groupID,
        userID: userID,
        roleLevel: type==1 ? GroupMemberRole.Admin : GroupMemberRole.Nomal,
      })
    })

    Promise.all(promiseArray)
      .then(() => {
        System.toast(i18n.t('chatRoom.op_success'), "success");
        csconversation.groupMemberList.forEach((item) => {
          console.log(item.userID);
          if(userIdArr.includes(item.userID)) item.roleLevel = type==1 ? GroupMemberRole.Admin : GroupMemberRole.Nomal
        })
      })
      .catch((e) => {
        System.toast(i18n.t('chatRoom.op_failed'))
      })
      .finally(()=> conf.moveShow = false)
  }
})
const getAdminList = computed(() => {
  const list = csconversation.groupMemberList.filter(item => {
    return item.roleLevel == GroupMemberRole.Admin
  })
  return [...list,...conf.adminList]
})
onMounted(() => {
  const { groupInfo } = System.getRouterParams()
  conf.sourceInfo = JSON.parse(groupInfo)
})
</script>
<style lang="less" scoped>
.head-title {
  font-size: 32rem;
  color: #000;
  text-align: center;
}

.tips {
  font-size: 26rem;
  padding: 20rem 40rem;
  color: #333;

  .item {
    display: flex;
    margin-bottom: 20rem;

    .left-q {
      margin-right: 16rem;
      margin-top: 15rem;
      div{
        width: 8rem;
        height: 8rem;
        border-radius: 50%;
        background: #000;
      }
    }
  }
}

.group-admin {
  margin: 40rem;
  border-top: 1rem solid #e1e1e1;

  .admin-item {
    display: flex;
    align-items: center;
    padding: 20rem 40rem;
    border-bottom: 1rem solid #e1e1e1;
  }

  .img {
    width: 72rem;
    height: 72rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8rem;
    overflow: hidden;
  }

  .nickname {
    font-size: 30rem;
    margin-left: 30rem;
  }

  .move {
    flex: 1;
    text-align: right;
    color: #5B6983;
    font-size: 28rem;
  }

  .add {
    background: #efefef;
  }

}

.out-popup {
  font-size: 32rem;
  background: #ffffff;

  .out-line {
    line-height: 120rem;
    border-bottom: 1rem solid #eee;
    text-align: center;
  }

  .out-tip {
    font-size: 26rem;
    color: #666;
  }

  .out-sure {
    color: #f45551;
  }
}
</style>
