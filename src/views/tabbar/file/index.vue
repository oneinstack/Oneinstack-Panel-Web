<template>
  <x-page no-header tabbar>
    <div class="header">
      <x-statusbar />
      <van-nav-bar v-show="!isChecked && checkedList.length < 1" title="">
        <template #left>
          <p class="left-title">文件</p>
        </template>
        <template #right>
          <div class="icon-item">
            <van-badge :content="1" color="#FF5805" @click.capture="router.push({ path: '/transfer' })">
              <van-image class="icon" width="40rem" height="40rem" :src="`/static/img/file/sort.png`" />
            </van-badge>
          </div>
          <div class="icon-item">
            <van-popover v-model:show="showMenu" placement="bottom-end">
              <div class="drop-menu">
                <div class="menu-item" v-for="menu in menuList" @click="onMenu(menu)">
                  <van-image class="icon" width="48rem" height="48rem" :src="menu.icon" />
                  <p class="menu-name">{{ menu.name }}</p>
                </div>
              </div>
              <template #reference>
                <van-badge :content="''" color="#FF5805" @click.stop="showMenu = !showMenu">
                  <van-image class="icon" width="40rem" height="40rem" :src="`/static/img/file/more.png`" />
                </van-badge>
              </template>
            </van-popover>
          </div>
        </template>
      </van-nav-bar>
      <van-nav-bar v-show="isChecked || checkedList.length > 0" :title="`已选中${checkedList.length}个文件`">
        <template #left>
          <p class="checked-left" @click="cancelChecked()">取消</p>
        </template>
        <template #right>
          <p v-if="checkedList.length != file.list.length" class="checked-right" @click="checkedAll()">全选</p>
          <p v-else class="checked-right" @click="checkedNotAll()">全不选</p>
        </template>
      </van-nav-bar>
      <div class="search">
        <input class="search_input" @focus="" placeholder="请输入文件名字" />
        <div class="search_icon">
          <van-icon name="search" size="32rem" />
        </div>
      </div>
    </div>
    <div class="content" :class="checkedList.length > 0 ? 'pdb-100' : ''">
      <div class="top">
        <p class="menu">
          {{ checkSortTypeName ? checkSortTypeName : '智能排序' }}
          <van-icon name="filter-o" @click="showSortPopup" />
        </p>
        <div>
          <van-icon name="arrow-up" />
          <span @click="goUp">上一级</span>
          当前目录：{{ file.params.pathStr == '/' ? '根目录（/）' : file.params.pathStr }}
        </div>
      </div>
      <file-card v-for="item in file.list" :item="item" :list="file.list" @click="clickFile(item)">
        <template #time="{ item }">
          <p class="update_date">上传于：{{ item.modTime }}</p>
        </template>
        <template #operation="{ item }">
          <van-checkbox v-model="item.checked" @click.stop></van-checkbox>
        </template>
      </file-card>
    </div>
    <OperationList v-show="checkedList.length > 0" @on-item="onItem" />
    <SortPopup ref="sortPopupRef" @change="changeSortType" />
    <DetailPopup ref="detailPopupRef" />
    <AddOrRenamePopup ref="addOrRenamePopupRef" @change="getList"/>
  </x-page>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { index } from './file'
import { useRouter } from 'vue-router'
import SortPopup from './components/sortPopup.vue'
import DetailPopup from './components/detailPopup.vue'
import OperationList from './components/operationList.vue'
import AddOrRenamePopup from './components/addOrRenamePopup.vue'
import { apis } from '@/api'
import System from '@/utils/System'
const router = useRouter()
const conf = index()
const isChecked = ref<boolean>(false)
const showMenu = ref<boolean>(false)
const checkedList = computed(() => {
  const checkedList:any = file.list.filter((item: any) => {
    return item.checked == true
  })
  return checkedList
})
const menuList = reactive([
  {
    id: 1,
    icon: 'checked',
    name: '文件多选'
  },
  {
    id: 2,
    icon: 'upload',
    name: '上传文件'
  },
  {
    id: 3,
    icon: 'new-add',
    name: '新建文件夹'
  },
  {
    id: 4,
    icon: 'delete',
    name: '回收站'
  }
])
menuList.forEach((item, index) => {
  const _icon = item.icon
  item.icon = `/static/img/file/${_icon}.png`
})
const file = reactive({
  list: [],
  params: {
    path: ['/'],
    pathStr: ''
  }
})
const getList = () => {
  file.params.pathStr = file.params.path.join('/').replace(/\/\//g, '/')
  apis.getFileList({ path: file.params.pathStr }).then((res: any) => {
    file.list = res.data?.files || []
    file.list.forEach((item: any) => {
      item.checked = false
      item.size = 72
      item.icon = `${item.isDir ? 'folder' : 'file'}`
    })
  })
}
onMounted(() => {
  getList()
})
const cancelChecked = () => {
  file.list.forEach((item: any) => {
    item.checked = false
  })
  isChecked.value = false
  showMenu.value = false
}
const checkedAll = () => {
  file.list.forEach((item: any) => {
    item.checked = true
  })
}
const checkedNotAll = () => {
  file.list.forEach((item: any) => {
    item.checked = false
  })
}

const onMenu = (menu: any) => {
  switch (menu.id) {
    case 1:
      isChecked.value = true
      showMenu.value = false
      break
    case 2:
      openAddOrRenamePopup('upload','')
      showMenu.value = false
      break
    case 3:
      openAddOrRenamePopup('add','')
      showMenu.value = false
      break
    case 4:
      break
  }
}
const downloadFile = async () => {
  checkedList.value.forEach(async (item: any) => {
    if (item.isDir) return System.toast('文件夹无法下载')
    const { data: res } = await apis.downloadFile({ path: file.params.pathStr == '/' ? file.params.pathStr + `${item.name}` : file.params.pathStr + `/${item.name}`, filename: item.name })
  })
}
const delFile = async () => {
  checkedList.value.forEach(async (item: any) => {
    const { data: res } = await apis.deleteFile({ path: file.params.pathStr + `/${item.name}` })
  })
}
const onItem = (item: any) => {
  switch (item.id) {
    case 1:
      downloadFile()
      break
    case 2:
      openAddOrRenamePopup('rename',checkedList.value[0].name)
      break
    case 3:
      delFile()
      break
    case 4:
      break
    case 5:
      openDetailPopup()
      break
  }
}

const detailPopupRef = ref()
const openDetailPopup = () => {
  fileDetail.value = checkedList.value[0]
  detailPopupRef.value.open(fileDetail.value)
}

const addOrRenamePopupRef = ref()
const openAddOrRenamePopup = (type: string,name = '') => {
  const obj = {
    pathStr: file.params.pathStr,
    name: name,
    isDir:checkedList.value[0]?.isDir || true
  }
  addOrRenamePopupRef.value.open(type,obj)
}

const sortPopupRef = ref()
const showSortPopup = () => {
  sortPopupRef.value.open()
}
const checkSortTypeName = ref<string>('')
const changeSortType = (item: any) => {
  checkSortTypeName.value = item.name
}
const fileDetail = ref({})
const clickFile = (item: any) => {
  if (item.isDir) {
    file.params.path.push(item.name)
    file.params.pathStr = file.params.path.join('/').replace(/\/\//g, '/')
    getList()
  }
}
const goUp = () => {
  // 如果已经在根目录，则直接返回
  if (file.params.path.length <= 1) return
  // 移除当前路径的最后一个目录
  file.params.path.pop()
  // 更新路径字符串
  file.params.pathStr = file.params.path.join('/').replace(/\/\//g, '/')
  // 获取新路径的文件列表
  getList()
}
</script>

<style lang="less" scoped>
:deep(.van-nav-bar__right) {
  padding-right: 8rem;
}
:deep(.van-nav-bar__left) {
  padding-left: 0;
}
:deep(.van-hairline--bottom:after) {
  border-bottom: none;
}
.header {
  padding: 0 32rem 18rem 32rem;
  background: var(--card-bg-color);
  position: fixed;
  width: 100%;
  .van-nav-bar {
    // margin-top: 118rem;
    .left-title {
      font-size: 32rem;
      color: var(--font-dark-color);
      font-weight: 700;
    }
    .checked-left,
    .checked-right {
      color: var(--primary-color);
      font-size: 28rem;
    }
  }
  .icon-item {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 32rem;
    position: relative;
  }
  .search {
    margin-top: 32rem;
    position: relative;
    input {
      background: var(--bg-color);
      height: 64rem;
      width: 100%;
      border-radius: 46rem;
      padding: 0 32rem;
    }
    .search_icon {
      position: absolute;
      right: 32rem;
      top: 16rem;
    }
  }
  .tabs {
    display: flex;
    background: var(--card-bg-color);
    margin-top: 44rem;
    overflow-x: scroll;
    .tab {
      margin-left: 40rem;
      font-size: 28rem;
      white-space: nowrap;
      text-align: center;
    }
    .tab:first-child {
      margin-left: 0;
    }

    .active {
      font-weight: 800;
    }
  }
}
.drop-menu {
  width: 272rem;
  height: 448rem;
  border-radius: 10rem;
  background: var(--card-bg-color);
  box-shadow: var(--font-dark-color) 0px 4px 15px;
  .menu-item {
    display: flex;
    align-items: center;
    height: 112rem;
    border-bottom: 2rem solid var(--bg-color);
    .icon {
      margin-left: 32rem;
    }
  }
  .menu-name {
    margin-left: 28rem;
    font-size: 24rem;
  }
}

.content {
  padding: 0 32rem;
  background: var(--bg-color);
  height: 100%;
  overflow-y: scroll;
  padding-bottom: 32rem;
  margin-top: calc(128rem + 64rem);
  .top {
    .menu {
      font-size: 28rem;
      margin-top: 32rem;
      color: var(--font-gray-color);
    }
    >div{
      margin-top: 20rem;
      font-size: 24rem;
    }
  }

  .app_status_card {
    padding: 32rem;
    background: var(--card-bg-color);
    margin-top: 20rem;
    border-radius: 12rem;
    .top {
      display: flex;
      justify-content: space-between;
      .left {
        display: flex;
        .info {
          margin-left: 28rem;
          .name {
            font-size: 32rem;
            font-weight: 700;
          }
        }
      }
    }
    .van-divider {
      margin: 0;
      margin-top: 36rem;
      margin-bottom: 28rem;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      span {
        color: var(--font-gray-color);
        border-bottom: 1px solid var(--font-gray-color);
      }
      .btns {
        display: flex;
        .btn {
          width: 108rem;
          height: 52rem;
          line-height: 52rem;
          text-align: center;
          margin-left: 32rem;
          border-radius: 12rem;
        }
        .restart {
          border: 1px solid var(--font-gray-color);
          color: var(--font-gray-color);
        }
        .stop {
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
        }
      }
    }
  }
}
.update_date {
  color: var(--font-gray-color);
}
.pdb-100 {
  padding-bottom: 100rem;
}
</style>
