<template>
  <van-popup v-model:show="show" round position="bottom">
    <van-cascader
      v-model="cascaderValue"
      title="选择目标文件夹"
      :options="options"
      @close="show = false"
      @finish="onFinish"
      @change="onChange"
    >
      <template #option="{ option }">
        <div class="option">
          <v-s-icon name="folder" :size="28"/>
          <span class="text">{{ option.value }}</span>
        </div>
      </template>
    </van-cascader>
    <div class="btns">
      <van-button type="danger" block @click="show = false">取消</van-button>
      <van-button type="primary" block @click="onFinish">确定</van-button>
    </div>
  </van-popup>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { apis } from '@/api'
const route = useRoute()
const { t } = useI18n()
const show = ref(false)
const cascaderValue = ref()
const options = ref<any>([])
const open = (pathList: string[]) => {
  show.value = true
  path.value = pathList
  getList()
}
const path = ref<string[]>([])
const onFinish = (value: any) => {
  console.log(value)
}
const getList = async () => {
  const pathStr = path.value.join('/').replace(/\/\//g, '/')
  try {
    const res = await apis.getFileList({ path: pathStr })
    const list = res.data.files.filter((item: any) => {
      item.text = item.name
      item.value = item.name
      return item.isDir
    })
    options.value = list
  } catch (error) {
    console.log(error)
  }
}
const onChange = (value: any) => {
    console.log(cascaderValue.value);
    
  path.value.push(cascaderValue.value)
  getList()
}
defineExpose({
  open
})
</script>
<style lang="less" scoped>
.option {
  .text {
    margin-left: 24rem;
  }
}
.btns {
  margin: 20rem 0;
  display: flex;
  justify-content: space-between;
  gap: 20rem;
  padding: 0 24rem;
}
</style>
