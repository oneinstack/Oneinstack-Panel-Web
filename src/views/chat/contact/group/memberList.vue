<template>
  <x-page :bgcolor="'#fff'">
    <template #title>
      <span class="title">{{ `${$t('chatRoom.grp_members')} (${conf.total})` }}</span>
    </template>
    <headSearch v-if="!conf.isFocus && !conf.keyword" :customClick="true" @click="conf.changeFocus" />
   <div class="seadch-box" v-else>
    <van-search ref="inputRef" class="input" :autofocus="conf.isFocus" @blur="conf.isFocus = false" v-model="conf.keyword"
      :placeholder="$t('chatRoom.search')" />
   </div>
    <div>
      <!-- 实现滚动隐藏搜索框 -->
      <div :style="{height: conf.listHeight + 'px'}">
        <groupItem :groupID="conf.groupID" :isMore="false" :groupMemberList="filterGroupMemberList" @updteMember="conf.updteGroupMemberList" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { capis } from '@/modules/chat/api';
import { computed, onMounted, reactive, ref } from 'vue';
import headSearch from '../com/headSearch.vue';
import groupItem from '../../conversation/details/com/groupItem.vue';
import System from '@/utils/System';
import csconversation from '@/modules/chat/sstore/csconversation';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
import sutil from '@/sstore/sutil';
import StatusBarConfig from '@/utils/StatusBarConfig';

const inputRef = ref<any>()
const conf = reactive({
  groupMemberList: [] as any[],
  total: 0,
  pageNum: 1,
  pageSize: 500,
  groupID: '',
  isFocus: false,
  keyword: '',
  listHeight: 0,
  async getGroupMemberList() {
    const { members, total } = await capis.getGroupMemberList(
      {
        filter: 0,
        groupID: conf.groupID,
        keyword: "",
        pagination: {
          pageNumber: conf.pageNum,
          showNumber: conf.pageSize,
        },
      }
    );
    conf.groupMemberList = [...conf.groupMemberList,...members]
    csconversation.groupMemberList = conf.groupMemberList
    conf.total = total
    conf.moreMessage()
  },
  moreMessage() { 
    if (conf.pageSize * conf.pageNum >= conf.total) return  
    conf.pageNum++
    conf.getGroupMemberList()
  },
  updteGroupMemberList() {
    conf.groupMemberList = []
    conf.pageNum = 1
    conf.getGroupMemberList()
  },
  changeFocus() {
    conf.isFocus = true
    setTimeout(()=> {
      inputRef.value?.focus()
    },100)
  }
})

const filterGroupMemberList = computed(() => {
  if (conf.keyword) {
    return csconversation.groupMemberList.filter(
      (friend) =>
        friend.nickname.includes(conf.keyword)
    )
  }
  return csconversation.groupMemberList
})

onMounted(async () => {
  const h = sutil.rem2px(164)
  conf.listHeight = window.innerHeight - h - StatusBarConfig.statusHeight
  const { groupID } = System.getRouterParams()
  conf.groupID = groupID
  let list = csconversation.groupMemberList
  if(list.length && list[0].groupID  != groupID) {
    // conf.groupMemberList = csconversation.groupMemberList
    csconversation.groupMemberList = []
  }
  conf.getGroupMemberList()
});
// const event = Scope.Event()
// event.on(EPage.scrollBottom, () => {
//   conf.moreMessage()
// })
</script>
<style lang="less" scoped>
.title {
  font-size: 32rem;
  color: #000;
}
.seadch-box{
  background: #efefef;
  padding: 0rem 20rem 20rem;
}
.input {
  height: 68rem;
  border-radius: 4rem;
}

::v-deep .van-search__content {
  background: #fff;
  padding: 0;
}
</style>
