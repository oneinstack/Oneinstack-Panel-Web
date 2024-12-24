<template>
  <x-page headerBgColor="#fff" :showBack="false">
    <template #title>
      <div class="head-search">
        <van-icon name="arrow-left" size="38rem" color="#666666" @click="sutil.pageBack" />
        <input ref="inputRef" class="input" v-model.trim="conf.keyword" :placeholder="$t('chatRoom.search_friend')" />
        <div class="btn flex flex-center" @click="conf.searchFriend">Search</div>
      </div>
    </template>
    <div class="content" v-if="getFriend.length">
      <div class="title">{{$t('chatRoom.my_friends')}}</div>
      <template v-for="(user,index) in getFriend" :key="user">
        <userItem :item="user" :showBodder="index != getFriend.length-1" @click="conf.goPages(`/chat/userCard?sourceID=${user.userID}`)" />
      </template>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import sutil from '@/sstore/sutil';
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import IMSDK from "openim-uniapp-polyfill";
import userItem from '../com/userItem.vue';
import cscontact from '@/modules/chat/sstore/cscontact';
import System from '@/utils/System';

const inputRef = ref<any>()
const conf = reactive({
  isSearchGroup: false,
  keyword: '',
  searchResults: [] as any[],
  searchFriend() {
    return 
    const options = {
      keywordList: [conf.keyword],
      isSearchUserID: false,
      isSearchNickname: true,
      isSearchRemark: true,
    };
    IMSDK.asyncApi(IMSDK.IMMethods.SearchFriends, IMSDK.uuid(), options)
      .then((data) => {
        console.log(data);
      })
      .catch((e) => console.log(e))
  },
  goPages(url:any) {
    System.router.push(url)
  }
})

const getFriend = computed(() => {
  if (conf.keyword) {
    return cscontact.friendList.filter(
      (friend) =>
        friend.nickname.includes(conf.keyword) || friend.remark.includes(conf.keyword)
    )
  }
  return []
})

onMounted(() => {
  console.log(cscontact.friendList);
  
  // 如果是移动端，可能还需要触发输入法打开
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value.setSelectionRange(0, 0); // 如果需要将光标置于输入框开始位置

    // 调用原生软键盘
    if (window.cordova && window.cordova.plugins.Keyboard) {
      window.cordova.plugins.Keyboard.show();
    }

  })
});
</script>
<style lang="less" scoped>
.head-search {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 24rem 0 20rem;
  height: 60rem;

  .input {
    height: 100%;
    flex: 1;
    font-size: 25rem;
    border: 2rem solid #f1f1f1;
    padding: 0 20rem;
    margin-left: 10rem;
    border-radius: 5rem 0rem 0rem 5rem;
    color: #000000;
  }

  .input::placeholder {
    color: #808080;
  }

  .btn {
    background: #07c261;
    height: 100%;
    padding: 0 20rem;
    font-size: 24rem;
    border-radius: 0 5rem 5rem 0;
  }
}
.content{
  margin-top: 20rem;
  background: #FFF;
  padding: 20rem 0rem;
  .title{
    font-size: 26rem;
    color: #999;
    padding-bottom: 20rem;
    border-bottom: 2rem #F6F7FA solid;
    margin-left: 24rem;
    padding-left: 6rem;
  }
}
</style>
