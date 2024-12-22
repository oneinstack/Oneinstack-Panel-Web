<template>
  <div class="b-flex">
    <div class="flooter">
      <div class="left" @click="conf.showPopup = true">
        <div class="name">{{ $t('chatRoom.Selected') + `(${chooseUser.length})` }}<van-icon style="margin-left: 10rem;" size="26rem" name="arrow-up" color="#07c261" /></div>
        <div class="user">
          <template v-for="(item,index) in chooseUser" :key="item.userID">
            <span v-if="index!=0">、</span>{{ item.nickname }}
          </template>
          <div></div>
        </div>
      </div>
      <div class="finsh" :class="{ 'active': chooseUser.length }" @click="conf.confirm">finish</div>
    </div>
  </div>
  <div>
    <div class="f-content"></div>
  </div>

  <van-popup class="popup-bottom-center" :show="conf.showPopup" position="bottom" borderRadius='16' :round="true"
    @close="conf.closePopup">
    <div class="popup">
      <div class="title">
        <div>{{ $t('chatRoom.Selected') + `(${chooseUser.length})` }}</div>
        <div @click="conf.closePopup">{{$t('chatRoom.confirm')}}</div>
      </div>
      <div class="choose">
        <div class="item" v-for="user in chooseUser" :key="user.userID">
          <userItem :item="user" :showBodder="false" />
          <van-button style="background: #ededed;" type="success"
            plain size="small" @click="emit('updateCheck',user)">
            {{ $t('chatRoom.Remove') }}
          </van-button>
        </div>
      </div>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import userItem from '@/views/chat/contact/com/userItem.vue';

const props = defineProps({
  chooseUser: {
    default: [] as any[]
  }
})
const emit = defineEmits(['updateCheck','confirm'])
const conf = reactive({
  showPopup: false,
  closePopup() {
    conf.showPopup = false
  },
  confirm() {
    if(!props.chooseUser.length) return
    emit('confirm')
  }
})

</script>
<style lang="less" scoped>
.b-flex {
  background: #efefef;
}

.flooter {
  height: calc(120rem + env(safe-area-inset-bottom));
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0rem 30rem;

  .left {
    color: #07c261;
    font-size: 26rem;
    flex: 1;
  }

  .user {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 80%;
    display: flex;
  }
}

.finsh {
  background: #f1f1f1;
  color: #999;
  height: 55rem;
  line-height: 55rem;
  padding: 0rem 20rem;
  border-radius: 8rem;
  font-size: 26rem;
  background: #dedede;
}

.active {
  color: #fff;
  background: #07c261;
}

.popup {
  padding: 30rem 40rem;

  .title {
    display: flex;
    justify-content: space-between;
    color: #07c261;
    font-size: 28rem;
    margin-bottom: 20rem;
  }
  .choose{
    overflow-y: auto;
    height: 60vh;
    .item{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
.van-button--success {
    border: none;
}

.van-button--small {
    height: 55rem;
}
</style>
