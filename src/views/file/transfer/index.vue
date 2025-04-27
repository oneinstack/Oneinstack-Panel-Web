<template>
  <x-page noHeader noFooter>
    <x-statusbar />
    <Navbar :title="$t('file.transfer')">
      <template #right>
        <van-icon class="setting" name="setting-o" @click="router.push('/transferSetting')"/>
      </template>
    </Navbar>
    <div class="content">
      <div class="tabs">
        <div class="tab" v-for="item in list" :class="item.id == activeTab ? 'active' : ''" @click="activeTab = item.id">{{ item.title }}</div>
      </div>
      <file-card v-if="fileList.length > 0" v-for="file in fileList" :item="file">
        <template #time="{ item }">
          <p class="update_date">{{ $t("file.uploadAt") }}    2024-05-18</p>
        </template>
        <template #operation="{ item }">
            <div class="btn">{{ $t("commons.button.waitting") }}</div>
        </template>
      </file-card>
      <div v-else class="not-data">
        <van-image class="" width="266rem" height="284rem" src="/public/static/img/file/not-data.png" />
        <p>{{$t("file.downloadRecord")}}</p>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t } = useI18n();
const router = useRouter();
const activeTab = ref('1');
const list = reactive([
  {
    id: '1',
    title: t('commons.button.download')
  },
  {
    id: '2',
    title: t('commons.button.upload')
  }
])
const fileList: any = reactive([
  {
    fileType: 'file',
    name: '文件1'
  },
  {
    fileType: 'files',
    name: '文件夹1'
  },
  {
    fileType: 'file',
    name: '文件2'
  },
  {
    fileType: 'files',
    name: '文件夹2'
  }
])
fileList.forEach((item: any) => {
  item.icon = 'file'
  item.size = 72
})
</script>
<style lang="less" scoped>
.content {
  height: 100%;
  padding: 32rem;
  .tabs {
    display: flex;
    padding: 14rem 28rem;
    background: var(--card-bg-color);
    border-radius: 12rem;
    align-items: center;
    justify-content: space-between;
    .tab {
      
      height: 68rem;
      width: 286rem;
      line-height: 68rem;
      text-align: center;
      border-radius: 12rem;
      font-size: 32rem;
      font-weight: 700;
      position: relative;
    }
    .tab:not(:last-child)::after {
      content: '';
      position: absolute;
      right: -28rem;
      top: 50%;
      transform: translateY(-50%);
      width: 2rem;
      height: 32rem;
      background: var(--bg-color);
    }
    .active{
        background: var(--bg-color);
    }
  }
}
.btn{
    width: 108rem;
    height: 52rem;
    line-height: 52rem;
    border-radius: 26rem;
    color: var(--primary-color);
    text-align: center;
    border: 2rem solid var(--primary-color);
}
.setting {
  font-size: 32rem;
  color: var(--font-gray-color);
}
.not-data{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    p{
        color: var(--font-gray-color);
        font-size: 32rem;
        margin-top: 40rem;
    }
}
.update_date{
    color: var(--font-gray-color);
}
</style>
