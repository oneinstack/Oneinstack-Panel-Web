<template>
  <x-page :bgcolor="'#fff'" :header-bg-color="'#fff'">
    <div class="head-title">
      {{ $t('chatRoom.modify_grp_name') }}
    </div>
    <div class="tips">
      {{ $t('chatRoom.after_modify') + " , " + $t('chatRoom.notify_mem') }}
    </div>
    <div class="group-name">
      <img :src="conf.sourceInfo.faceURL || '/static/images/contact_new_group.png'" />
      <van-search style="color: red;" class="input" v-model="conf.groupName" maxlength="16"
        :placeholder="$t('chatRoom.enter_content')" />
    </div>
    <div class="btn">
      <div class="finsh" @click="conf.comfirmUpdate" :class="{ 'active': conf.groupName && (conf.sourceInfo.showName != conf.groupName) }">{{ $t('chatRoom.save') }}</div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
import IMSDK from "openim-uniapp-polyfill";
import i18n from '@/lang';
import sutil from '@/sstore/sutil';


const conf = reactive({
  groupName: '',
  sourceInfo: {} as any,
  comfirmUpdate() {
    if( !conf.groupName || (conf.sourceInfo.showName == conf.groupName)) return
    System.loading()
    let func;
    func = IMSDK.asyncApi(IMSDK.IMMethods.SetGroupInfo, IMSDK.uuid(), {
      groupID: conf.sourceInfo.groupID,
      groupName: conf.groupName,
    });

    func
      .then(() => {
        System.toast(i18n.t('chatRoom.modify_succ'),"success");
        setTimeout(() => sutil.pageBack(), 250);
      })
      .catch(() => System.toast(i18n.t('chatRoom.modify_failed')))
      .finally(() => (System.loading(false)));
  },
})

onMounted(() => {
  const { groupInfo } = System.getRouterParams()
  conf.sourceInfo = JSON.parse(groupInfo)
  conf.groupName = conf.sourceInfo.showName

})
</script>
<style lang="less" scoped>
.head-title {
  font-size: 32rem;
  color: #333;
  text-align: center;
}

.tips {
  font-size: 26rem;
  text-align: center;
  padding: 20rem;
}

.group-name {
  display: flex;
  background: #fff;
  padding: 30rem 0rem;
  margin: 40rem;
  border-bottom: 1rem solid #e1e1e1;
  border-top: 1rem solid #e1e1e1;

  img {
    width: 80rem;
    height: 80rem;
  }

  .input {
    flex: 1;
  }

  ::v-deep .van-icon-search:before {
    content: "";
  }

  ::v-deep .van-search {
    padding: 0;
  }

  ::v-deep .van-search__content {
    background: #fff;
  }

  ::v-deep .van-field__control {
    font-size: 32rem;
  }
}

.btn {
  // width: 50%;
  margin-top: 120rem;
  display: flex;
  justify-content: center;

  .finsh {
    background: #f1f1f1;
    color: #999;
    height: 68rem;
    line-height: 55rem;
    border-radius: 8rem;
    font-size: 28rem;
    background: #f1f1f1;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .active {
    color: #fff;
    background: #07c261;
  }
}
</style>
