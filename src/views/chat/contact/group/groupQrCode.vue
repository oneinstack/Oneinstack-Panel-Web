<template>
  <x-page :bgcolor="'#fff'" :header-bg-color="'#fff'">
    <div class="content">
      <div class="header" id="groupCode">
        <img class="faceImg" :src="conf.sourceInfo.faceURL || '/static/images/contact_new_group.png'" />
        <div class="name">
          group chat: {{ conf.sourceInfo.showName }}
        </div>
        <div class="groupId" @click="conf.handleCopy">groupID: {{ conf.sourceInfo.groupID }}</div>
        <qrcode-vue :value="conf.qrLink" :size="150" />
      </div>
      <div class="save" @click="conf.exportCardAsImage">Save Picture</div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'
import System from '@/utils/System';
import { onMounted, reactive } from 'vue';
import { AddGroupQrCodePrefix } from '@/modules/chat/constant';
import i18n from '@/lang';


const conf = reactive({
  sourceInfo: {} as any,
  qrLink: '',
  getQrLink(info: any) {
    const sourceID = info.groupID ?? info.userID ?? "";
    conf.qrLink = `${AddGroupQrCodePrefix}${sourceID}`;
    console.log(conf.qrLink);
    
  },
  exportCardAsImage: async () => {
    System.loading()
    const res = await System.getImgPic({
      id: 'groupCode'
    })
    await System.download(res, Date.now() + '.png')
    System.loading(false)
  },
  //复制groupId
  handleCopy() {
    StrUtil.copyText(conf.sourceInfo.groupID)
    System.toast(i18n.t('invite.CopySuccessful'), 'success')
  },
})

onMounted(() => {
  const { groupInfo } = System.getRouterParams()
  conf.sourceInfo = JSON.parse(groupInfo)
  conf.getQrLink(conf.sourceInfo)
})
</script>
<style lang="less" scoped>
.head-title {
  font-size: 32rem;
  color: #333;
  text-align: center;
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding-top: 60rem;
}
.header{
  text-align: center;
  padding: 20rem;
  .faceImg{
    width: 120rem;
    height: 120rem;
    border-radius: 10rem;
    overflow: hidden;
  }
  .name{
    font-size: 32rem;
    margin: 20rem 30rem 30rem;
  }
  .groupId{
    font-size: 30rem;
    margin-bottom: 40rem;
    color: #5B6983;
  }
}
.save{
  color: #5B6983;
  font-size: 28rem;
}
</style>
