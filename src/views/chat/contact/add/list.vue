<template>
  <x-page noFooter>
    <template #title>
      <span class="title">{{ $t('chatRoom.add_friend') }}</span>
    </template>
    <headSearch :type="'friend'" :name="`ID/${$t('chatRoom.account')}`" />
    <div class="account">{{ $t('chatRoom.myAccount') }}: {{ csuser.selfInfo.nickname }}</div>
    <div class="list">
      <div class="list-item" v-for="(item, index) in conf.typeList" :key="index" @click="conf.goPages(item.type)">
        <img class="img" :src="item.icon" />
        <div class="info">
          <div class="info-right">
            <div class="name">{{ item.title }}</div>
            <div class="tips">{{ item.desc }}</div>
          </div>
          <van-icon name="arrow" size="30rem" color="#B8B8B8" />
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import headSearch from '../com/headSearch.vue';
import i18n from '@/lang';
import System from '@/utils/System';
import csuser from '@/modules/chat/sstore/csuser';

const conf = reactive({
  typeList: [
    {
      title: i18n.t('chatRoom.add_friend'),
      desc: `ID/${i18n.t('chatRoom.search_add')}`,
      icon: '/static/images/contact_add_search_user.png',
      type: 'friend'
    },
    {
      title: i18n.t('chatRoom.add_group'),
      desc: i18n.t('chatRoom.ask_admin'),
      icon: '/static/images/contact_add_join_group.png',
      type: 'group'
    }
  ],
  goPages(type:string) {
    console.log(csuser.selfInfo);
    
    System.router.push('/chat/add?type=' + type)
  }
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}

.account {
  text-align: center;
  font-size: 26rem;
  margin-top: 10rem;
}

.list {
  background: #fff;
  margin-top: 60rem;

  .list-item {
    display: flex;
    align-items: center;
    padding-left: 30rem;

    .img {
      width: 72rem;
      height: 72rem;
    }

    .info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2rem solid #F6F7FA;
      padding: 30rem 30rem 30rem 0rem;
      margin-left: 20rem;

      .info-right {
        font-size: 30rem;

        .tips {
          color: #999;
          font-size: 26rem;
          margin-top: 10rem;
        }
      }
    }
  }
}
</style>
