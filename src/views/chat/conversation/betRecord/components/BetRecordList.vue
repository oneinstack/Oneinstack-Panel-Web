<template>
  <bet-record-list-item v-for="item in listItems" :data="item" :key="item.id" :selectMode="selectMode"
    @click-share="conf.hanldeOpenPopup" @select-share="conf.handleSelectShare" />

  <span class="no_more_data">{{ $t('user.noMore') }}</span>

  <van-popup :show="conf.popupVisible" position="bottom" @close="conf.onPopupClose">
    <div class="share_container">
      <div class="share_header">
        <div class="flex items-center" @click="conf.popupVisible = false">
          <img class="back_icon" style="width: 16.8rem; height: 28rem" src="/static/images/common_left_arrow.png" alt=""
            srcset="" />
          <span class="u-nav-title">{{ $t('home.Close') }}</span>
        </div>

        <div>
          <div class="right_action">
            <van-button size="small" @click="conf.handleConfirmShare">{{ actionText }}</van-button>
          </div>
        </div>
      </div>

      <div class="share_list">
        <van-checkbox-group v-model="conf.allSelect" placement="column" checked-color="#0fc05f">
          <van-checkbox class="select_all" activeColor="#0fc05f" name="all" 
            @change="conf.onCheckAll">{{ $t('chatRoom.SelectAll') }}</van-checkbox>
        </van-checkbox-group>

        <van-checkbox-group v-model="conf.checkGroupChat" placement="column" checked-color="#0fc05f" @change="conf.onCheckboxChange">
          <van-row v-for="item in list" :key="item.id" class="group_chart_list" @click="conf.handleClickRowSelect(item.id)">
            <div class="flex col-3 items-center">
              <van-checkbox :name="item.id" activeColor="#0fc05f" style="display: inline-block" />
              <img class="group_chat_img" :src="item.imgUrl" alt="" srcset="" />
            </div>
            <van-col>
              <span style="margin-left: 12rem; font-size: 32rem">{{ item.chatName }}</span>
              <span v-if="item.id === currentGroupChatId" style="margin-left: 12rem; color: #0fc05f">{{
                $t('chatRoom.CurrentSession') }}</span>
            </van-col>
          </van-row>
        </van-checkbox-group>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import betRecordListItem from './BetRecordListItem.vue'
import { Scope } from 'tools-vue3';
import System from '@/utils/System';
import i18n from '@/lang';

const props = defineProps({
  selectMode: {
    default: false
  },
  currentGroupChatId: {
    default: '' as any
  },
  list: {
    default: [] as any[]
  },
  listItems: {
    default: [] as any[]
  }
})

const mconf = Scope.getConf()
const emit = defineEmits(['confirm','select-share'])
const conf = reactive({
  popupVisible: false, // 是否显示弹窗
  selectBetRecord: [] as any[], // 选择的投注记录
  checkGroupChat: [] as any[], // 选择的群聊
  allSelect: [] as any[],
  singleShareId: undefined, // 单个分享的id
  hanldeOpenPopup(selected:any) {
    conf.singleShareId = selected
    conf.popupVisible = true
  },

  onPopupClose() {
    conf.checkGroupChat = []
    conf.allSelect = []
    conf.popupVisible = false
  },

  handleConfirmShare() {
    let selectBetRecord:any = conf.singleShareId ? [conf.singleShareId] : conf.selectBetRecord
    if (!conf.checkGroupChat.length) {
      System.toast(i18n.t('chatRoom.ChooseOneTip'))
      return
    }
    selectBetRecord = selectBetRecord.map((id:any) => {
      return props.listItems.find((v:any) => v.id === id)
    })
    emit('confirm', {
      betList: selectBetRecord,
      chatList: conf.checkGroupChat
    })
    conf.onPopupClose()
  },

  handleSelectShare(isSelect:any, checkValue:any) {
    if (!isSelect && conf.selectBetRecord.includes(checkValue)) {
      conf.selectBetRecord = conf.selectBetRecord.filter((item) => item !== checkValue)
    } else conf.selectBetRecord.push(checkValue)
    emit('select-share', conf.selectBetRecord)
  },

  handleClickRowSelect(checkValue:any) {
    if (conf.checkGroupChat.includes(checkValue)) {
      conf.checkGroupChat = conf.checkGroupChat.filter((item) => item !== checkValue)
    } else conf.checkGroupChat.push(checkValue)
    conf.onCheckboxChange(conf.checkGroupChat)
  },

  onCheckboxChange(n:any) {
    if (n.length === props.list.length) conf.allSelect = ['all']
    else conf.allSelect = []
  },

  onCheckAll(isSelect:any) {
    if (isSelect) conf.checkGroupChat = props.list.map((item) => item.id)
    else conf.checkGroupChat = []
  }
})

const actionText = computed(() => {
  const len = conf.checkGroupChat.length
  return len ? i18n.t('chatRoom.Complete') + `(${len})` : i18n.t('chatRoom.Complete')
})

</script>

<style lang="less" scoped>
.no_more_data {
  display: inline-block;
  margin: 32rem auto;
  font-size: 24rem;
  color: #aaa;
}

.share_container {
  .share_header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rem;
    background-color: #ededed;

    .u-nav-title {
      font-size: 32rem;
      color: #333;
      margin-left: 16rem;
      font-weight: 500;
    }

    .right_action>button {
      background: #0fc05f;
      color: #fff;
      font-size: 24rem;
      border-radius: 4rem;
    }
  }

  .share_list {
    max-height: 70vh;
    padding: 24rem;
    overflow-y: scroll;

    .group_chart_list {
      margin: 24rem 0;
    }

    .u-row {
      margin-bottom: 24rem;

      &:last-child {
        margin-bottom: 48rem;
      }

      .group_chat_img {
        margin: 0 12rem;
        width: 72rem;
        height: 72rem;
        border-radius: 4rem;
      }
    }
  }
}
</style>
