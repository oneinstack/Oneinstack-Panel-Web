<template>
  <x-page no-header tabbar no-footer>
    <div class="memo-page">
      <x-statusbar />
      <van-nav-bar title="" >
        <template #left>
          <van-icon name="arrow-left" color="#a5a5a5" @click="router.back()"/>
        </template>
        <template #right>
          <van-icon class="icon" name="revoke" />
          <van-icon class="icon rotate" name="revoke" />
          <van-icon class="icon save" name="success" @click="save"/>
        </template>
      </van-nav-bar>
      <div class="content">
        <van-field class="title" v-model="memo.content" :placeholder="$t('home.title')" />
        <p class="date">
          {{ memo.create_time }}
          <span>{{ memo.content.length }}{{ $t('commons.unit.word') }}</span>
        </p>
        <van-field class="content" v-model="memo.content" autosize type="textarea" :placeholder="$t('home.startWrite')" />
      </div>
    </div>
  </x-page>
</template>
<script setup lang="ts">
import { apis } from '@/api'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const id = Number(router.currentRoute.value.query.id)
interface memo {
  id: number | string
  content: string
  create_time: string
}
const memo = ref<memo>({
  id: "",
  content: '',
  create_time: new Date().toLocaleDateString()
})
const getMemo = () => {
  if(!router.currentRoute.value.query.id) return
  apis.getSysRemark(id).then((res) => {
    memo.value = res.data;
  })
}
onMounted(() => {
  getMemo()
})

const save = () => {
  if(!router.currentRoute.value.query.id) {
    apis.addSysRemark({content:memo.value.content}).then((res) => {
      router.back()
    })
  } else {
    apis.updateSysRemark({...memo.value,id:id}).then((res) => {
      router.back()
    })
  }
}
</script>
<style lang="less" scoped>
.memo-page {
  display: flex;
  flex-direction: column;
  background: var(--card-bg-color);
  height: 100%;
  .content {
    flex: 1;
    padding: 0 32rem;
    .title {
      font-size: 48rem;
      padding: 0;
      margin-top: 56rem;
    }
    .date {
      font-size: 28rem;
      line-height: 24rem;
      color: var(--font-gray-color);
      margin-top: 52rem;
      span {
        margin-left: 46rem;
      }
    }
    .content {
      padding: 24rem 0;
      font-size: 28rem;
    }
  }
}
:deep(.van-nav-bar__left) {
  font-size: 40rem;
}

.icon {
  font-size: 44rem;
  color: var(--font-dark-color);
}
.rotate {
  transform: rotate(-180deg);
  color: var(--font-gray-color);
  margin-left: 38rem;
}
.save {
  margin-left: 74rem;
}
.van-cell:after {
  border-bottom: 0;
}
</style>
