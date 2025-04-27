<template>
  <van-popup class="file-popup" v-model:show="show" round position="bottom" :style="{ height: '692rem' }">
    <Navbar :title="typeTitle[operationType]">
      <template #left>
        <van-icon name="arrow-left" @click="close" />
      </template>
      <template #right>
        <p class="confirm" @click="handleConfirm">{{ $t('commons.button.finish') }}</p>
      </template>
    </Navbar>
    <div class="file-content">
      <v-s-icon class="icon" :size="174" name="addFolder" @click="show = false" />
      <div v-if="operationType == 'rename' || operationType == 'add'" class="my-input">
        <input v-model="fileInfo.name" :placeholder="t('commons.placeholder.name')" />
        <van-icon class="input-icon" size="44rem" name="close" />
      </div>
      <van-uploader
        v-else
        multiple
        :after-read="afterRead"
        :before-read="beforeRead"
        :max-size="100 * 1024 * 1024"
        @oversize="onOversize"
        accept="*"
      >
        <div class="my-input">
          <input v-model="fileInfo.name" :placeholder="t('commons.placeholder.selectFile')" />
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
import { apis } from '@/api'
import System from '@/utils/System'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
const emit = defineEmits(['change'])
const typeTitle: any = {
  'upload': t('commons.button.uploadFile'),
  'add': t('commons.button.createFolder'),
  'rename': t('commons.button.rename')
}
type operationTypes = 'upload' | 'add' | 'rename'
const show = ref<boolean>(false)
const operationType = ref<string>('')
const open = (type: operationTypes, obj: any) => {
  show.value = true
  operationType.value = type
  fileInfo.value = obj
}
const close = () => {
  show.value = false
}
const beforeRead = (file: any) => {
  // 可以在这里添加文件类型验证
  return true
}

const afterRead = async (file: any) => {
  // 处理单个文件上传
  if (!Array.isArray(file)) {
    if (file.file) {
      fileInfo.value.name = file.file.name
      const params = {
        file: file.file,
        path: fileInfo.value.pathStr
      }
      try {
        const res = await apis.uploadFile(params, () => {})
        if (res.code == 0) {
          System.toast(t('commons.button.uploadSuccess'), 'success')
          emit('change')
          show.value = false
        } else {
          System.toast(res.msg || t('commons.button.uploadFail'))
        }
      } catch (error) {
        System.toast(t('commons.button.uploadFail'))
      }
    }
  }
}

const onOversize = () => {
  System.toast('文件大小不能超过100MB')
}

const handleConfirm = () => {
  show.value = false
  switch (operationType.value) {
    case 'upload':
      break
    case 'add':
      apis.createFile({
        path:
          fileInfo.value.pathStr == '/'
            ? fileInfo.value.pathStr + fileInfo.value.name
            : fileInfo.value.pathStr + '/' + fileInfo.value.name,
        type: fileInfo.value.isDir ? 'dir' : 'file'
      })
      break
    case 'rename':
      apis.createFile({
        path:
          fileInfo.value.pathStr === '/'
            ? fileInfo.value.pathStr + fileInfo.value.name
            : fileInfo.value.pathStr + '/' + fileInfo.value.name,
        type: fileInfo.value.isDir ? 'dir' : 'file'
      })
      break
  }
  emit('change')
}
const fileInfo = ref({
  name: '',
  file: null,
  isDir: '',
  pathStr: ''
})
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
