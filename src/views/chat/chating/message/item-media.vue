<template>
  <div
    @click="conf.clickItem(item)"
    class="relative media-box"
    :class="{ reverse: item.isme }"
    :style="{ height: conf.maxHeight(item) + 'px' }"
  >
    <x-img :src="conf.getImgUrl(item)" @load="$emit('load')" />
    <van-image-preview
      v-model:show="conf.image.preview.show"
      :start-position="conf.image.preview.index"
      :images="conf.image.preview.images"
      @change="conf.image.preview.onChange"
      @beforeClose="conf.image.preview.beforeClose"
      :loop="false"
    >
      <template v-slot:index></template>
      <template v-slot:cover>
        <div class="row justify-end fit-width" style="margin-bottom: 10rem; padding: 0 10rem">
          <div class="flex flex-center bottom-box" @click="conf.image.download">
            <VSIcon lib="wx" name="download_filled" size="32" :color="['#fff']" style="transform: translateY(-2rem)" />
          </div>
        </div>
        <x-navigationbar />
      </template>
    </van-image-preview>
  </div>
</template>
<script setup lang="ts">
import csmessage from '@/modules/chat/sstore/csmessage'
import { getFileType } from '@/modules/chat/utils/cUtil'
import sapp from '@/sstore/sapp'
import System from '@/utils/System'
import { MessageType } from 'openim-uniapp-polyfill'
import { reactive } from 'vue'
const props = defineProps<{
  item: any
}>()
const conf = reactive({
  /**
   * 返回事件函数id
   */
  funId: '_chat_content' + StrUtil.getId(),
  image: {
    preview: {
      show: false,
      index: 0,
      images: [] as string[],
      onChange(e: any) {},
      beforeClose() {
        delete sapp.backbtn.funMap[conf.funId]
        conf.image.preview.show = false
      }
    },
    download: async () => {
      const url = csmessage.previewImageList[conf.image.preview.index]
      const fileName = getFileType(url)
      System.loading()
      await System.download(url, Date.now() + '.' + fileName)
      System.loading(false)
    }
  },
  isVideo() {
    return props.item.contentType === MessageType.VideoMessage
  },
  getImgUrl: (item: any) => {
    const isVideo = conf.isVideo()
    if (isVideo) {
      return item.videoElem.snapshotUrl
    }
    return item.pictureElem.snapshotPicture?.url ?? item.pictureElem.sourcePath
  },
  maxHeight(item: any) {
    let imageHeight = '' as any
    const isVideo = conf.isVideo()
    if (isVideo) {
      imageHeight = item.videoElem.snapshotHeight
    }
    if (!isVideo && item.pictureElem.sourcePicture) {
      imageHeight = item.pictureElem.sourcePicture.height
    }
    if (!isVideo && item.pictureElem.snapshotPicture) {
      imageHeight = item.pictureElem.snapshotPicture.height
    }
    return (imageHeight || 0) > 120 ? 120 : imageHeight
  },
  clickItem(item: any) {
    conf.image.preview.show = true
    sapp.backbtn.funMap[conf.funId] = () => {
      conf.image.preview.show = false
    }
    const url = conf.getImgUrl(item)
    conf.image.preview.images = csmessage.previewImageList
    const _index = csmessage.previewImageList.findIndex((item: any) => item === url)
    conf.image.preview.index = _index
  }
})
</script>
<style lang="less" scoped>
.media-box {
  margin: 0 10rem;
  border-radius: 8rem;
  overflow: hidden;
  max-width: 464rem;
}

.bottom-box {
  width: 54rem;
  height: 54rem;
  border-radius: 50%;
  background-color: #adadad;
  margin-right: 40rem;
}
</style>
