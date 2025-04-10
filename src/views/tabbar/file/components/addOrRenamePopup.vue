<template>
  <van-popup class="file-popup" v-model:show="show" round position="bottom" :style="{ height: '692rem' }">
    <Navbar :title="typeTitle[operationType]">
      <template #left>
        <van-icon name="arrow-left" @click="close" />
      </template>
      <template #right>
        <p class="confirm" @click="handleConfirm">完成</p>
      </template>
    </Navbar>
    <div class="file-content">
      <!-- <van-image class="icon" width="174rem" height="174rem" :src="`/static/img/file/file.png`" @click="show = false" /> -->
      <v-s-icon class="icon" :size="174" name="addFolder" @click="show = false"/>
      <div v-if="operationType == 'rename' || 'add'" class="my-input">
        <input placeholder="请输入名称" />
        <van-icon class="input-icon" size="44rem" name="close" />
      </div>
      <van-uploader v-else>
        <div class="my-input">
          <input placeholder="请选择文件" />
          <van-image
            class="input-icon"
            width="44rem"
            height="44rem"
            :src="`/static/img/file/add.png`"
            @click="show = false"
          />
        </div>
      </van-uploader>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const emit = defineEmits(['change'])
const typeTitle: any = {
  'upload': '上传文件',
  'add': '新建文件夹',
  'rename': '重命名'
}
type operationTypes = 'upload' | 'add' | 'rename'
const show = ref<boolean>(false)
const operationType = ref<string>('')
const open = (type: operationTypes) => {
  show.value = true
  operationType.value = type
}
const close = () => {
  show.value = false
}
const handleConfirm = () => {
  show.value = false
  emit('change')
}
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.file-popup {
  padding: 0 32rem;
  :deep(.navbar) {
    padding: 0;
    .arrow-left {
      font-size: 40rem;
    }
    .center-title {
      flex: 1;
      text-align: center;
    }
    .confirm {
      color: var(--primary-color);
      font-weight: 300;
      font-size: 28rem;
    }
  }
  .file-content {
    padding: 40rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .icon {
      margin-top: 100rem;
    }
    .my-input {
      position: relative;
      width: 606rem;
      input {
        margin-top: 62rem;
        width: 100%;
        height: 92rem;
        border-radius: 12rem;
        background: var(--bg-color);
        padding: 32rem;
        font-size: 32rem;
        text-align: center;
      }
      .input-icon {
        position: absolute;
        right: 32rem;
        bottom: 24rem;
      }
    }
  }
}
</style>
