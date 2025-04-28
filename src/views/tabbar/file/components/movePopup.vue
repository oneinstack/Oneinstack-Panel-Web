<template>
  <van-popup v-model:show="show" round position="bottom" :style="{ height: '70%' }">
    <div class="move-popup">
      <div class="header">
        <span class="title">选择目标文件夹</span>
        <van-icon name="cross" @click="show = false" />
      </div>
      
      <div class="tree-container">
        <div class="folder-list">
          <template v-for="item in treeData" :key="item.name">
            <div class="folder-item">
              <div class="folder-header" @click="handleNodeClick(item)">
                <van-icon 
                  :name="activeNames.includes(item.name) ? 'arrow-down' : 'arrow'"
                  class="arrow"
                />
                <v-s-icon name="folder" :size="28"/>
                <span class="text" :class="{ 'selected': selectedNode?.name === item.name }">
                  {{ item.name }}
                </span>
              </div>
              
              <div class="folder-children" v-show="activeNames.includes(item.name)">
                <template v-if="item.children && item.children.length">
                  <div 
                    v-for="child in item.children" 
                    :key="child.name"
                    class="folder-item"
                  >
                    <div class="folder-header" @click="handleNodeClick(child)">
                      <van-icon 
                        :name="activeNames.includes(child.name) ? 'arrow-down' : 'arrow'"
                        class="arrow"
                      />
                      <v-s-icon name="folder" :size="28"/>
                      <span class="text" :class="{ 'selected': selectedNode?.name === child.name }">
                        {{ child.name }}
                      </span>
                    </div>
                    
                    <div class="folder-children" v-show="activeNames.includes(child.name)">
                      <template v-if="child.children && child.children.length">
                        <div 
                          v-for="grandChild in child.children" 
                          :key="grandChild.name"
                          class="folder-item"
                          @click="handleNodeClick(grandChild)"
                        >
                          <div class="folder-header">
                            <van-icon 
                              :name="activeNames.includes(grandChild.name) ? 'arrow-down' : 'arrow'"
                              class="arrow"
                            />
                            <v-s-icon name="folder" :size="28"/>
                            <span class="text" :class="{ 'selected': selectedNode?.name === grandChild.name }">
                              {{ grandChild.name }}
                            </span>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="btns">
        <van-button type="danger" block @click="show = false">取消</van-button>
        <van-button type="primary" block @click="onFinish">确定</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { apis } from '@/api'

interface TreeNode {
  name: string
  isDir: boolean
  children: TreeNode[]
  parent?: TreeNode
  path: string[]
}

const emit = defineEmits(['finish'])
const route = useRoute()
const { t } = useI18n()
const show = ref(false)
const path = ref<string[]>(["/"])
const treeData = ref<TreeNode[]>([])
const selectedNode = ref<TreeNode | null>(null)
const activeNames = ref<string[]>([])

const open = (pathList: string[]) => {
  show.value = true
  path.value = pathList
  getList()
}

const getList = async () => {
  const pathStr = path.value.join('/').replace(/\/\//g, '/')
  try {
    const { data: res } = await apis.getFileList({ 
      path: pathStr,
    })
    if (!res.files) return
    
    const list = res.files
      .filter((item: any) => item.isDir)
      .map((item: any) => ({
        ...item,
        children: [],
        path: pathStr,  // 使用当前完整路径
        leaf: false,    // 添加叶子节点标识
        isDir: true     // 确保目录标识
      }))
    treeData.value = list
  } catch (error) {
    console.log(error)
  }
}

const handleNodeClick = async (node: TreeNode) => {
  selectedNode.value = node
  
  // 构建当前节点的完整路径
  let currentPath = node.path ? [...node.path] : [...path.value]
  if (!currentPath.includes(node.name)) {
    currentPath.push(node.name)
  }
  
  // 如果节点还没有加载子节点
  if (!node.children || node.children.length === 0) {
    const pathStr = currentPath.join('/').replace(/\/\//g, '/')
    try {
      const res = await apis.getFileList({ path: pathStr })
      node.children = res.data.files
        .filter((item: any) => item.isDir)
        .map((item: any) => ({
          ...item,
          children: [],
          parent: node,
          path: currentPath
        }))
    } catch (error) {
      console.log(error)
    }
  }
  
  // 更新当前路径
  path.value = currentPath
  
  // 处理展开/收起状态
  const index = activeNames.value.indexOf(node.name)
  if (index === -1) {
    activeNames.value.push(node.name)
  } else {
    activeNames.value.splice(index, 1)
  }
}

const onFinish = () => {
  if (!selectedNode.value) return
  const targetPath = path.value.join('/')
  emit('finish', targetPath)
  show.value = false
}

defineExpose({
  open
})
</script>

<style lang="less" scoped>
.move-popup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .header {
    padding: 32rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2rem solid var(--bg-color);

    .title {
      font-size: 32rem;
      font-weight: 500;
    }
  }

  .tree-container {
    flex: 1;
    overflow: auto;
    padding: 20rem;

    .folder-list {
      .folder-item {
        .folder-header {
          display: flex;
          align-items: center;
          gap: 12rem;
          padding: 12rem 0;
          cursor: pointer;

          .arrow {
            font-size: 24rem;
            color: var(--font-gray-color);
          }

          .text {
            font-size: 28rem;
            
            &.selected {
              color: var(--primary-color);
              font-weight: 500;
            }
          }
        }

        .folder-children {
          padding-left: 40rem;
        }
      }
    }
  }

  .btns {
    margin: 20rem;
    display: flex;
    justify-content: space-between;
    gap: 20rem;
    padding: 0 24rem;
  }
}
</style>
