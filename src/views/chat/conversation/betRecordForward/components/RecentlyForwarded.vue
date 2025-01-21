<template>
  <div class="recently_forwarded">
    <div class="recently_forwarded_title">{{ $t('chatRoom.nowForword') }}</div>
    <div class="recently_forwarded_content">
      <div v-for="item in recentlyForwardedData" :key="item[fields.id]" class="recently_forwarded_item"
        @click="emit('item-click', item)">
        <van-checkbox-group v-show="!isSingleSelection" v-model="checkboxValue" placement="column" checked-color="#0fc05f">
          <van-checkbox :name="item[fields.id]" inactiveColor="#fff" activeColor="#0fc05f"
            @change="emit('select', $event, item)" />
        </van-checkbox-group>
        <img class="group_chat_img" :src="item[fields.imgUrl]" alt="" srcset="" />
        <div class="recently_forwarded_item_label u-line-2"><text>{{ item[fields.name] }}</text></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { SessionType } from 'openim-uniapp-polyfill'
import { SessionType } from 'openim-uniapp-polyfill';
import { computed } from 'vue';

const props = defineProps({
  list: {
    default: [] as any[]
  },
  checkeds: {
    default: [] as any[]
  },
  isSingleSelection: {
    type: Boolean,
    default: true,
  },
  fields: {
    type: Object,
    default: () => ({
      id: 'id',
      imgUrl: 'imgUrl',
      name: 'name',
      type: 'type',
    })
  }
})

const emit = defineEmits(['item-click','select'])

const recentlyForwardedData = computed(() => {
  return props.list.slice(0, 5)
})

const checkboxValue = computed(() => {
  return props.checkeds || []
})
const isGroup = (type:any) => {
  return type === SessionType.WorkingGroup
}
</script>

<style scoped lang="less">
.recently_forwarded {
  padding: 16rem 32rem;

  &_title {
    font-weight: bold;
  }

  &_content {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    padding: 16rem 0;
    margin-bottom: 20rem;
    gap: 32rem;

    .recently_forwarded_item {
      position: relative;
      width: 100rem;
      white-space: pre-wrap;

      .u-checkbox-group {
        position: absolute;
        top: 6%;
        right: 0;
        z-index: 1;
      }

      .group_chat_img {
        width: 100%;
        height: 100rem;
        border-radius: 8rem;
      }

      &_label {
        font-size: 20rem;
        color: #888;
        text-align: center;
      }
    }
  }
}
</style>