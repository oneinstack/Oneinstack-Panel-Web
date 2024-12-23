<template>
  <x-page :showBack="false" noFooter>
    <template #title>
      <div class="head-search">
        <van-search ref="inputRef" class="input" autofocus v-model="conf.keyword" :placeholder="getPlaceholder" />
        <div class="btn flex flex-center" @click="sutil.pageBack">Cancel</div>
      </div>
    </template>
    <div class="content" v-if="!conf.empty">
      <div class="title" v-if="conf.keyword" @click="conf.startSearch">
        <div class="search-icon">
          <van-icon size="36rem" name="search" color="#fff" />
        </div>
        <span>{{ $t('chatRoom.search') }}:</span>
        <span style="color: #07c261;">{{ conf.keyword }}</span>
      </div>
    </div>
    <div class="no-user" v-else>
      {{ $t('chatRoom.no_search_res') }}
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import IMSDK from "openim-uniapp-polyfill";
import sutil from '@/sstore/sutil';
import i18n from '@/lang';
import System from '@/utils/System';
import cscontact from '@/modules/chat/sstore/cscontact';
import { capis } from '@/modules/chat/api';

const inputRef = ref<any>()
const conf = reactive({
  isSearchGroup: false,
  keyword: '',
  empty: false,
  async startSearch() {
    if (!conf.keyword) return;
    System.loading()
    try {
      if (conf.isSearchGroup) {
        let info = cscontact.groupList.find(
          (item) => item.groupID === this.keyword,
        );
        if (!info) {
          const { data } : any = await IMSDK.asyncApi(
            IMSDK.IMMethods.GetSpecifiedGroupsInfo,
            IMSDK.uuid(),
            [this.keyword],
          );
          info = data[0];
        }
        if (info) {
          System.router.push(`/chat/groupCard?sourceInfo=${JSON.stringify(
            info,
          )}`)
        } else {
          this.empty = true;
        }
      } else {
        let info = cscontact.friendList.find(
          (item) => item.userID === this.keyword,
        );
        if (!info) {
          const { total, users } = await capis.businessSearchUserInfo(
            {
              keyword: conf.keyword,
              pagination: {
                pageNumber: 1,
                showNumber: 10,
              },
            }
          );
          if (total > 0) {
            const { data } :any = await IMSDK.asyncApi(
              IMSDK.IMMethods.GetUsersInfo,
              IMSDK.uuid(),
              [users[0].userID],
            );
            const imData = data[0];

            info = {
              ...imData,
              ...users[0],
            };
          }
        }
        if (info) {
          System.router.push(`/chat/userCard?sourceInfo=${JSON.stringify(
              info,
            )}`)
        } else {
          conf.empty = true;
        }
      }
    } catch (e) {
      //TODO handle the exception
    }
    System.loading(false)
  },
})

const getPlaceholder = computed(() => {
  return conf.isSearchGroup ? i18n.t('chatRoom.enter_grp') + " ID " : i18n.t('chatRoom.search') + " ID " + i18n.t('chatRoom.or_phone_add');
})
onMounted(() => {
  const { type } = System.getRouterParams()
  if(type) conf.isSearchGroup = type == 'group'
  nextTick(() => {
    inputRef.value?.focus()
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
    padding: 0;
    background: #fff;
  }

  .btn {
    height: 100%;
    font-size: 26rem;
    padding-left: 10rem;
    color: #a3a4ae;
  }
}

.content {
  background: #FFF;
  height: 100%;

  .search-icon {
    background: #07c261;
    width: 60rem;
    height: 60rem;
    border-radius: 8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 4rem;
    margin-right: 12rem;
  }

  .title {
    font-size: 26rem;
    color: #000;
    padding: 20rem 24rem;
    border-bottom: 2rem #F6F7FA solid;
    display: flex;
    align-items: center;
  }
}

.no-user {
  background: #FFF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rem 20rem;
  color: #999;
  font-size: 26rem;
}

::v-deep .van-search__content {
  background: #fff;
}
</style>
