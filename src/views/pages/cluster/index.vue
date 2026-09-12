<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Key, Delete, DataAnalysis } from '@element-plus/icons-vue'
import { Api } from '@/api/modules'

interface Node {
  id: number; name: string; endpoint: string; group?: string; tags?: string; enabled: boolean; status: string
  hostname?: string; panelVersion?: string; architecture?: string; lastSeenAt?: string
  cpuPercent?: number; memoryPercent?: number; diskPercent?: number; networkReceiveBps?: number
}
interface Metric { id: number; capturedAt: string; cpuPercent: number; memoryPercent: number; diskPercent: number }

const nodes = ref<Node[]>([])
const loading = ref(false)
const formVisible = ref(false)
const formRef = ref<FormInstance>()
const saving = ref(false)
const tokenVisible = ref(false)
const generatedToken = ref('')
const metricsVisible = ref(false)
const metricsLoading = ref(false)
const metrics = ref<Metric[]>([])
const tasks = ref<any[]>([])
const selectedNode = ref<Node | null>(null)
const editingId = ref<number | null>(null)
const dispatching = ref(false)
const dispatch = reactive({ websiteId: 0, strategy: 'least_load', nodeIds: [] as number[], tags: '', includeContent: false })
const form = reactive({ name: '', endpoint: '', group: '', tags: '', enabled: true })
let timer: number | undefined

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  endpoint: [{ required: true, message: '请输入节点地址', trigger: 'blur' }]
}))

const load = async () => {
  loading.value = true
  try { const { data } = await Api.listClusterNodes(); nodes.value = data?.items || [] } finally { loading.value = false }
}
const openCreate = () => { editingId.value = null; Object.assign(form, { name: '', endpoint: '', group: '', tags: '', enabled: true }); formVisible.value = true }
const openEdit = (node: Node | Record<string, any>) => { const item = node as Node; editingId.value = item.id; Object.assign(form, { name: item.name, endpoint: item.endpoint, group: item.group || '', tags: item.tags || '', enabled: item.enabled }); formVisible.value = true }
const save = async () => {
  if (!(await formRef.value?.validate())) return
  saving.value = true
  try {
    const result = editingId.value ? await Api.updateClusterNode(editingId.value, form) : await Api.createClusterNode(form)
    if (!editingId.value && result.data?.token) { generatedToken.value = result.data.token; tokenVisible.value = true }
    ElMessage.success(editingId.value ? '节点已更新' : '节点已创建'); formVisible.value = false; await load()
  } finally { saving.value = false }
}
const rotate = async (node: Node | Record<string, any>) => {
  node = node as Node
  await ElMessageBox.confirm(`轮换后节点“${node.name}”的旧令牌将立即失效，是否继续？`, '轮换令牌', { type: 'warning' })
  const { data } = await Api.rotateClusterNodeToken(node.id); generatedToken.value = data?.token || ''; tokenVisible.value = true; await load()
}
const remove = async (node: Node | Record<string, any>) => {
  node = node as Node
  await ElMessageBox.confirm(`确定移除节点“${node.name}”？`, '移除节点', { type: 'warning' })
  await Api.deleteClusterNode(node.id); ElMessage.success('节点已移除'); await load()
}
const showMetrics = async (node: Node | Record<string, any>) => {
  const item = node as Node
  selectedNode.value = item; metricsVisible.value = true; metricsLoading.value = true
  try { const { data } = await Api.getClusterNodeMetrics(item.id); metrics.value = data?.items || []; const taskResult = await Api.listClusterTasks(item.id); tasks.value = taskResult.data?.items || [] } finally { metricsLoading.value = false }
}
const dispatchWebsite = async () => {
  if (!dispatch.websiteId) { ElMessage.warning('请输入网站 ID'); return }
  dispatching.value = true
  try {
    const result = await Api.dispatchWebsiteToCluster({ websiteId: dispatch.websiteId, strategy: dispatch.strategy, nodeIds: dispatch.nodeIds, tags: dispatch.tags.split(',').map((item) => item.trim()).filter(Boolean), includeContent: dispatch.includeContent, idempotencyKey: `website-${dispatch.websiteId}-${Date.now()}` })
    ElMessage.success(`已创建 ${result.data?.tasks?.length || 0} 个下发任务`)
  } finally { dispatching.value = false }
}
const statusType = (status: string) => status === 'online' ? 'success' : status === 'pending' ? 'warning' : 'info'
const formatTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'
const copyToken = async () => { await navigator.clipboard?.writeText(generatedToken.value); ElMessage.success('已复制') }
onMounted(() => { void load(); timer = window.setInterval(load, 30000) })
onUnmounted(() => { if (timer) window.clearInterval(timer) })
</script>

<template>
  <div class="cluster-page">
    <div class="page-header"><div><h1>多节点管理</h1><p>管理独立部署的 OneinStack Panel 节点，并查看实时资源状态。</p></div><div class="actions"><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button><el-button type="primary" :icon="Plus" @click="openCreate">添加节点</el-button></div></div>
    <el-card shadow="never"><el-table v-loading="loading" :data="nodes" row-key="id" empty-text="暂无管理节点">
      <el-table-column label="节点" min-width="220"><template #default="scope"><div class="node-name">{{ scope.row.name }} <el-tag size="small" :type="statusType(scope.row.status)">{{ scope.row.status }}</el-tag></div><div class="muted">{{ scope.row.endpoint }}</div></template></el-table-column>
      <el-table-column label="分组 / 标签" min-width="150"><template #default="scope"><div>{{ scope.row.group || '-' }}</div><div class="muted">{{ scope.row.tags || '无标签' }}</div></template></el-table-column>
      <el-table-column label="资源" min-width="220"><template #default="scope"><div class="resource">CPU {{ (scope.row.cpuPercent || 0).toFixed(1) }}% · 内存 {{ (scope.row.memoryPercent || 0).toFixed(1) }}%</div><el-progress :percentage="Math.min(100, Math.round(scope.row.cpuPercent || 0))" :show-text="false" :stroke-width="5" /></template></el-table-column>
      <el-table-column label="最后上报" width="180"><template #default="scope">{{ formatTime(scope.row.lastSeenAt) }}</template></el-table-column>
      <el-table-column label="操作" width="250" fixed="right"><template #default="scope"><el-button link type="primary" :icon="DataAnalysis" @click="showMetrics(scope.row)">指标/任务</el-button><el-button link @click="openEdit(scope.row)">编辑</el-button><el-button link @click="rotate(scope.row)"><el-icon><Key /></el-icon>令牌</el-button><el-button link type="danger" @click="remove(scope.row)"><el-icon><Delete /></el-icon></el-button></template></el-table-column>
    </el-table></el-card>
    <el-card class="dispatch-card" shadow="never"><template #header><div class="card-title">网站配置下发</div></template><el-form inline><el-form-item label="网站 ID"><el-input-number v-model="dispatch.websiteId" :min="1" /></el-form-item><el-form-item label="策略"><el-select v-model="dispatch.strategy" style="width:150px"><el-option label="最低负载" value="least_load" /><el-option label="指定节点" value="fixed" /><el-option label="按标签" value="tag" /></el-select></el-form-item><el-form-item v-if="dispatch.strategy === 'fixed'" label="节点"><el-select v-model="dispatch.nodeIds" multiple collapse-tags style="width:240px"><el-option v-for="node in nodes" :key="node.id" :label="node.name" :value="node.id" /></el-select></el-form-item><el-form-item v-if="dispatch.strategy === 'tag'" label="标签"><el-input v-model="dispatch.tags" placeholder="cn-east,prod" /></el-form-item><el-form-item label="内容"><el-checkbox v-model="dispatch.includeContent">同步网站文件（≤64 MiB）</el-checkbox></el-form-item><el-button type="primary" :loading="dispatching" @click="dispatchWebsite">创建下发任务</el-button></el-form></el-card>
    <el-dialog v-model="formVisible" :title="editingId ? '编辑节点' : '添加节点'" width="520px"><el-form ref="formRef" :model="form" :rules="rules" label-width="90px"><el-form-item label="节点名称" prop="name"><el-input v-model="form.name" /></el-form-item><el-form-item label="Panel 地址" prop="endpoint"><el-input v-model="form.endpoint" placeholder="https://node.example.com" /></el-form-item><el-form-item label="分组"><el-input v-model="form.group" /></el-form-item><el-form-item label="标签"><el-input v-model="form.tags" placeholder="例如 cn-east,prod" /></el-form-item><el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item></el-form><template #footer><el-button @click="formVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template></el-dialog>
    <el-dialog v-model="tokenVisible" title="节点令牌" width="560px"><el-alert title="令牌只在本次操作中显示，请立即复制并配置到被管理 Panel。" type="warning" :closable="false" /><el-input class="token-input" :model-value="generatedToken" readonly><template #append><el-button @click="copyToken">复制</el-button></template></el-input></el-dialog>
    <el-drawer v-model="metricsVisible" :title="selectedNode ? `${selectedNode.name} 指标与任务` : '节点详情'" size="680px"><el-skeleton v-if="metricsLoading" :rows="6" animated /><template v-else><el-descriptions :column="2" border><el-descriptions-item label="主机名">{{ selectedNode?.hostname || '-' }}</el-descriptions-item><el-descriptions-item label="Panel 版本">{{ selectedNode?.panelVersion || '-' }}</el-descriptions-item><el-descriptions-item label="CPU">{{ (selectedNode?.cpuPercent || 0).toFixed(1) }}%</el-descriptions-item><el-descriptions-item label="内存">{{ (selectedNode?.memoryPercent || 0).toFixed(1) }}%</el-descriptions-item></el-descriptions><h3>最近指标</h3><el-table :data="metrics" size="small"><el-table-column prop="capturedAt" label="时间" /><el-table-column label="CPU"><template #default="s">{{ s.row.cpuPercent.toFixed(1) }}%</template></el-table-column><el-table-column label="内存"><template #default="s">{{ s.row.memoryPercent.toFixed(1) }}%</template></el-table-column><el-table-column label="磁盘"><template #default="s">{{ s.row.diskPercent.toFixed(1) }}%</template></el-table-column></el-table><h3>任务记录</h3><el-table :data="tasks" size="small"><el-table-column prop="id" label="ID" width="70" /><el-table-column prop="type" label="类型" /><el-table-column prop="status" label="状态" /><el-table-column prop="attempts" label="尝试次数" width="90" /></el-table></template></el-drawer>
  </div>
</template>

<style scoped lang="less">
.cluster-page { padding: 24px; min-height: 100%; background: var(--el-bg-color-page); }.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }h1 { margin:0 0 8px; font-size:24px; }.page-header p { margin:0; color:var(--el-text-color-secondary); }.actions { display:flex; gap:10px; }.node-name { display:flex; align-items:center; gap:8px; font-weight:600; }.muted { margin-top:4px; color:var(--el-text-color-secondary); font-size:12px; }.resource { font-size:12px; margin-bottom:6px; }.token-input { margin-top:18px; }.dispatch-card { margin-top: 16px; }.card-title { font-weight: 600; }.cluster-page h3 { margin:24px 0 12px; font-size:15px; }
</style>
