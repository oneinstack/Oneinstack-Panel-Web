<template>
  <div class="recently_chatting">
    <div class="recently_chatting_title">{{ $t('chatRoom.nowChat') }}</div>
    <div class="recently_chatting_list">
      <div v-for="item in list" :key="item[fields.id]" class="recently_chatting_list_item"
        @click="$emit('row-click', item)">
        <van-checkbox-group v-show="!isSingleSelection" v-model="checkboxValue" placement="column" checked-color="#0fc05f">
          <van-checkbox :name="item[fields.id]" activeColor="#0fc05f" @change="$emit('select', $event, item)" />
        </van-checkbox-group>
        <img class="group_chat_img" :src="item[fields.imgUrl]" alt="" srcset="" />
        <span class="group_chat_name">{{ item[fields.name] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// import { SessionType } from 'openim-uniapp-polyfill'
const props = defineProps({
  list: {
    default: [] as any[]
  },
  checkeds: {
    default: [] as any[]
  },
  isSingleSelection: {
    default: true
  },
  fields: {
    type: Object,
    default: () => ({
      id: 'id',
      imgUrl: 'imgUrl',
      name: 'name',
      type: 'type'
    })
  }
})

const checkboxValue = computed(() => {
  return props.checkeds || []
})

const isGroup = (type:any) => {
  // return type === SessionType.WorkingGroup
}
</script>

<style scoped lang="less">
.recently_chatting {
  padding: 32rem;
  background-color: #fff;
  border-radius: 8rem;

  &_title {
    font-weight: bold;
  }

  &_list {
    display: flex;
    flex-direction: column;
    padding-top: 16rem;

    &_item {
      position: relative;
      padding: 16rem 0;
      display: flex;
      align-items: center;
      // border-bottom: 1px solid #f2f2f2;

      &::after {
        content: "";
        position: absolute;
        right: 0;
        bottom: 0;
        background-color: #f2f2f2;
        width: 88%;
        height: 1rem;
      }

      .u-checkbox-group {
        margin-right: 24rem;
      }

      .group_chat_img {
        width: 72rem;
        height: 72rem;
        border-radius: 8rem;
        margin-right: 24rem;
      }
    }
  }
}
</style>