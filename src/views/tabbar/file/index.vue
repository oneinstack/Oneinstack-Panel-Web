<template>
  <x-page no-header tabbar>
    <x-statusbar />
    <div class="header">
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
            <!-- <van-badge :content="''" color="#FF5805" @click="showMenu = !showMenu">
              <van-image class="icon" width="40rem" height="40rem" :src="`/static/img/file/more.png`" />
            </van-badge> -->
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
            <!-- <div v-if="showMenu" class="drop-menu">
              <div class="menu-item" v-for="menu in menuList" @click="onMenu(menu)">
                <van-image class="icon" width="48rem" height="48rem" :src="menu.icon" />
                <p class="menu-name">{{ menu.name }}</p>
              </div>
            </div> -->
          </div>
        </template>
      </van-nav-bar>
      <van-nav-bar v-show="isChecked || checkedList.length > 0" :title="`已选中${checkedList.length}个文件`">
        <template #left>
          <p class="checked-left" @click="cancelChecked()">取消</p>
        </template>
        <template #right>
          <p v-if="checkedList.length != fileList.length" class="checked-right" @click="checkedAll()">全选</p>
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
      <p class="menu">
        {{ checkSortTypeName ? checkSortTypeName : '智能排序' }}
        <van-icon name="filter-o" @click="showSortPopup" />
      </p>
      <file-card :list="fileList">
        <template #time="{ item }">
          <p class="update_date">上传于：2024-05-18</p>
        </template>
        <template #operation="{ item }">
          <van-checkbox v-model="item.checked"></van-checkbox>
        </template>
      </file-card>
    </div>
    <OperationList v-show="checkedList.length > 0" @on-item="onItem" />
    <SortPopup ref="sortPopupRef" @change="changeSortType" />
    <DetailPopup ref="detailPopupRef" :detail="fileDetail" />
    <AddOrRenamePopup ref="addOrRenamePopupRef" />
  </x-page>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { index } from './file'
import { useRouter } from 'vue-router'
import SortPopup from './components/sortPopup.vue'
import DetailPopup from './components/detailPopup.vue'
import OperationList from './components/operationList.vue'
import AddOrRenamePopup from './components/addOrRenamePopup.vue'
const router = useRouter()
const conf = index()
const isChecked = ref<boolean>(false)
const showMenu = ref<boolean>(false)
const checkedList = computed(() => {
  const checkedList = fileList.filter((item: any) => {
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
const fileList: any = reactive([
  {
    fileType: 'file',
    name: '文件1'
  },
  {
    fileType: 'folder',
    name: '文件夹1'
  },
  {
    fileType: 'file',
    name: '文件2'
  },
  {
    fileType: 'folder',
    name: '文件夹2'
  },
  {
    fileType: 'folder',
    name: '文件夹3'
  }
])
fileList.forEach((item: any) => {
  const _icon = item.fileType
  // item.icon = `/static/img/file/${_icon}.png`
  item.icon = `${_icon}`
  item.size = 72
  // item.width = '72rem'
  // item.height = '72rem'
})
const cancelChecked = () => {
  fileList.forEach((item: any) => {
    item.checked = false
  })
  isChecked.value = false
  showMenu.value = false
}
const checkedAll = () => {
  fileList.forEach((item: any) => {
    item.checked = true
  })
}
const checkedNotAll = () => {
  fileList.forEach((item: any) => {
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
      openAddOrRenamePopup('upload')
      showMenu.value = false
      break
    case 3:
      openAddOrRenamePopup('add')
      showMenu.value = false
      break
    case 4:
      break
  }
}
const onItem = (item: any) => {
  switch (item.id) {
    case 1:
      break
    case 2:
      openAddOrRenamePopup('rename')
      break
    case 3:
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
  detailPopupRef.value.open()
}

const addOrRenamePopupRef = ref()
const openAddOrRenamePopup = (type: string) => {
  addOrRenamePopupRef.value.open(type)
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
  .van-nav-bar {
    margin-top: 118rem;
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
  .menu {
    font-size: 28rem;
    margin-top: 32rem;
    color: var(--font-gray-color);
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
.update_date{
  color: var(--font-gray-color);
}
.pdb-100 {
  padding-bottom: 100rem;
}
</style>
