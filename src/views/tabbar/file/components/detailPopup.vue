<template>
  <van-popup
    class="detail-popup"
    v-model:show="show"
    round
    position="bottom"
    :style="{ height: 'calc(100% - 384rem)' }"
  >
    <div class="navbar">
      <p>{{ $t('file.fileDetail') }}</p>
      <van-image class="icon" width="36rem" height="36rem" :src="`/static/img/file/close.png`" @click="show = false" />
    </div>
    <div class="file-top">
      <van-image class="file-type-icon" width="56rem" height="56rem" :src="`/static/img/file/file.png`" />
      <van-field v-if="isEdit" />
      <p v-else class="file-name">{{ fileInfo.name }}</p>
      <van-image class="edit-icon" width="32rem" height="32rem" :src="`/static/img/file/edit.png`" @click="isEdit = !isEdit"/>
    </div>
    <div class="detail-list">
        <div class="detail-item" v-for="item in detailArr">
            <p class="label">{{ item.label }}</p>
            <div v-if="fileInfo.isDir && item.label == '包含文件数'" class="value">
              <p>2个文件</p>
              <p>0个文件夹</p>
            </div>
            <p v-else class="value">{{ item.value }}</p>
        </div>
        <div class="file-position">
            <p class="label">{{ $t('file.filePosition') }}</p>
            <div class="value">
                <p>文件夹1>文件1</p>
                <van-icon name="arrow" />
            </div>
        </div>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const emit = defineEmits(['update:checkSortType'])
const isEdit = ref<boolean>(false)
const show = ref<boolean>(false)
const fileType = ref<string>('')
const fileInfo = ref<any>({})
const open = (obj:any) => {
  fileType.value = 'files'
  fileInfo.value = obj
  show.value = true
}
const detailArr = ref([
  {
    label: t('file.fileType'),
    value: fileInfo.value.isDir ? '文件夹' : '文件'
  },
  {
    label: t('file.uploadTime'),
    value: fileInfo.value.modTime
  },
  {
    label: t('file.fileSize'),
    value: fileInfo.value.size
  },
  {
    label: t('file.lastUpdateTime'),
    value: '2024-04-17 13:31'
  },
  {
    label: t('file.fileNum'),
    value: 'fileNum'
  }
])
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.detail-popup {
  padding: 0 32rem;
  .navbar {
    height: 108rem;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-bottom: 2rem solid #e3e3e3;
    font-size: 32rem;
    color: var(--font-dark-color);
    font-weight: 700;
    .icon {
      margin-left: 266rem;
    }
  }
  .file-top {
    display: flex;
    align-items: center;
    margin-top: 36rem;
    .file-name {
      margin-left: 36rem;
      font-size: 32rem;
    }
    .edit-icon {
      margin-left: 16rem;
    }
  }
  .detail-list{
    margin-top: 38rem;
    display: flex;
    flex-wrap: wrap;
    .detail-item{
        margin-top: 44rem;
        width: 290rem;
        border-bottom: 2rem solid #DADADA;
        padding-bottom: 32rem;
    }
    .detail-item:nth-child(even){
        margin-left: 76rem;
    }
    .detail-item,.file-position{
        margin-top: 44rem;
        .label{
            color: #9C9C9C;
        }
        .value{
            width: 100%;
            margin-top: 32rem;
            color: #393939;
            font-weight: bold;
            font-size: 28rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    }
    .file-position{
        width: 100%;
    }
  }
}
:deep(.van-cell){
  padding: 0 32rem;
}
</style>
