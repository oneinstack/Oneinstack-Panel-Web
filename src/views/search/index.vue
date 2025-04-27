<template>
  <x-page noHeader noFooter>
    <div class="search-page">
      <x-statusbar />
      <div class="search">
        <van-icon class="icon" name="search" />
        <input :placeholder="$t('home.serach')" />
        <p @click="router.back()">{{$t("commons.button.cancel")}}</p>
      </div>
      <div class="history">
        <div class="header">
            <p>{{ $t("home.history") }}</p>
            <van-image class="icon" width="40.86rem" height="40.86rem" src="/public/static/img/icon/delete.png" />
        </div>
        <div class="history-list">
            <div class="history-list-item" v-for="item in list">
                {{ item }}
            </div>
        </div>
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
const list = reactive(['OpenResty','文件夹1','文件1','OpenR','文件1','OpenR'])
const router = useRouter();
</script>
<style lang="less" scoped>
.search-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 32rem;
  background: #ffffff;
  .search{
    display: flex;
    align-items: center;
    position: relative;
    .icon{
        position: absolute;
        font-size: 32rem;
        left: 32rem;
        top: 16rem;
    }
    input{
            width: 598rem;
            height: 64rem;
            line-height: 64rem;
            border-radius: 46rem;
            background: #f7f7f7;
            font-size: 28rem;
            margin-right: 32rem;
            padding-left: 96rem;
        }
        p{
            font-size: 28rem;
            color: #393939;
        }
  }
  .history{
    margin-top: 66rem;
    .header{
        display: flex;
        justify-content: space-between;
        align-items: center;
        p{
            font-size: 36rem;
        }
    }
    .history-list{
    margin-top: 30rem;
    display: flex;
    flex-wrap: wrap;
    padding: 20rem 0;
    gap: 20rem;  /* 项间距 */
    
    &::-webkit-scrollbar {
      display: none; /* 隐藏滚动条 */
    }
    
    .history-list-item{
      flex: 0 0 auto;  /* 禁止伸缩 */
      position: relative;
      padding: 16rem 56rem 16rem 32rem;
      background: #f7f7f7;
      border-radius: 46rem;
      font-size: 28rem;
      color: #666;
      line-height: 1.5;
      
      /* 关闭按钮 */
      .close-icon {
        position: absolute;
        right: 16rem;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
        padding: 8rem;
      }
      
      /* 点击反馈效果 */
      &:active {
        background: #eee;
      }
    }
  }
  }
}
</style>
