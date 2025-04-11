<template>
  <!-- <div class="file-list"> -->
  <div class="file_card">
    <div class="icon_box">
      <div class="left">
        <!-- <van-image :width="item.width || '56rem'" :height="item.height || '56rem'" :src="item.icon" /> -->
        <v-s-icon :name="props.item.icon" :size="props.item.size || 56" />
        <div class="file_info">
          <p class="file_name van-ellipsis">{{ props.item.name }}</p>
          <slot name="time" :item="props.item"></slot>
        </div>
      </div>
      <slot name="operation" :item="props.item"></slot>
    </div>
  </div>
  <!-- </div> -->
</template>
<script setup lang="ts">
interface FileListItem {
  fileType?: string
  name: string
  icon?: string
  height?: string
  width?: string
  size?: number
  checked?: boolean
}
const props = defineProps({
  item:{
    type:Object,
    default:()=>{
      return {}
    }
  }
})
</script>
<style lang="less" scoped>
.file_card {
  width: 100%;
  height: 150rem;
  background: #ffffff;
  margin-top: 32rem;
  border-radius: 12rem;
  padding: 32rem;
  .icon_box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .left {
      display: flex;
      align-items: center;
      .file_info {
        margin-left: 32rem;
        display: flex;
        flex-direction: column;
        height: 100%;
        .file_name {
          font-size: 32rem;
          font-weight: 700;
        }
        .update_date {
          font-size: 28rem;
          color: #a5a5a5;
        }
      }
    }
    .btn {
      width: 90rem;
      height: 48rem;
      border-radius: 8rem;
      border: 2rem solid #f98f18;
      color: #f98f18;
      text-align: center;
      line-height: 48rem;
    }
  }
}
</style>
