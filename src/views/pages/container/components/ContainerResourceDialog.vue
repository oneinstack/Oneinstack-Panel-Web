<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { DialogType, ImageItem, RegistryItem } from '../types'

const props = defineProps<{
  visible: boolean
  dialogType: DialogType
  dialogTarget: any
  saving: boolean
  form: Record<string, any>
  rules: FormRules
  imageActionForm: Record<string, any>
  registryForm: Record<string, any>
  templateForm: Record<string, any>
  registries: RegistryItem[]
  imageReference: (row: ImageItem) => string
  registryLabel: (row: RegistryItem) => string
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'confirm'): void
  (event: 'import-file-change', value: Event): void
}>()

const formRef = ref<FormInstance>()

const title = computed<string>(() => {
  switch (props.dialogType) {
    case 'image':
      return '拉取镜像'
    case 'image-import':
      return '导入镜像'
    case 'image-build':
      return '构建镜像'
    case 'image-tag':
      return '修改镜像标签'
    case 'image-push':
      return '推送镜像'
    case 'network':
      return '创建网络'
    case 'volume':
      return '创建存储卷'
    case 'registry':
      return props.dialogTarget ? '编辑 Registry' : '新增 Registry'
    case 'template':
      return props.dialogTarget ? '编辑编排模板' : '创建编排模板'
    default:
      return ''
  }
})

defineExpose({
  validate: () => formRef.value?.validate(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<template>
  <custom-drawer
    v-if="dialogType !== 'container'"
    :visible="visible"
    :title="title"
    size="720px"
    confirm-text="确认"
    :loading="saving"
    :on-close="() => emit('update:visible', false)"
    :on-confirm="() => emit('confirm')"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" class="resource-dialog-form">
      <template v-if="dialogType === 'image'">
        <el-form-item label="拉取方式">
          <el-radio-group v-model="imageActionForm.pullMode">
            <el-radio value="reference">完整镜像引用</el-radio>
            <el-radio value="registry">选择 Registry</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageActionForm.pullMode === 'reference'" label="镜像引用">
          <el-input v-model.trim="imageActionForm.reference" placeholder="请输入镜像引用，例如 nginx:1.27" />
        </el-form-item>
        <template v-else>
          <el-form-item label="Registry">
            <el-select v-model="imageActionForm.registryId" placeholder="请选择 Registry" filterable>
              <el-option v-for="item in registries" :key="item.id" :label="`${item.name}（${registryLabel(item)}）`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="镜像名">
            <el-input v-model.trim="imageActionForm.imageName" placeholder="请输入镜像名，例如 library/nginx:1.27" />
          </el-form-item>
        </template>
      </template>

      <el-form-item v-if="dialogType === 'image-import'" label="tar 文件">
        <input class="file-picker" type="file" accept=".tar,.gz,.tgz,.xz,.zst" @change="emit('import-file-change', $event)" />
        <div class="field-help">请选择 Docker save 导出的 tar 镜像文件，字段名会按文档提交为 `file`。</div>
      </el-form-item>

      <template v-if="dialogType === 'image-build'">
        <el-form-item label="目标镜像">
          <el-input v-model.trim="imageActionForm.buildName" placeholder="请输入目标镜像，例如 demo/web:latest" />
        </el-form-item>
        <el-form-item label="构建方式">
          <el-radio-group v-model="imageActionForm.buildMode">
            <el-radio value="dockerfile">编辑 Dockerfile</el-radio>
            <el-radio value="path">服务器路径</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageActionForm.buildMode === 'dockerfile'" label="Dockerfile">
          <el-input v-model="imageActionForm.dockerfile" type="textarea" :rows="8" />
        </el-form-item>
        <template v-else>
          <el-form-item label="上下文目录">
            <el-input v-model.trim="imageActionForm.contextPath" placeholder="请输入构建上下文目录，例如 /usr/local/one/docker-build/demo" />
          </el-form-item>
          <el-form-item label="Dockerfile">
            <el-input v-model.trim="imageActionForm.dockerfilePath" placeholder="请输入 Dockerfile 路径，留空则使用 contextPath/Dockerfile" />
          </el-form-item>
        </template>
        <el-form-item label="Labels">
          <el-input v-model="imageActionForm.labelsText" type="textarea" :rows="2" placeholder="请输入 Labels，每行一个 key=value，可选" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'image-tag'">
        <el-form-item label="当前镜像">
          <el-input :model-value="dialogTarget ? imageReference(dialogTarget) : ''" disabled />
        </el-form-item>
        <el-form-item label="新标签">
          <el-input v-model.trim="imageActionForm.tagReference" placeholder="请输入新标签，例如 demo/web:stable" />
        </el-form-item>
        <el-form-item label="移除旧标签">
          <el-switch v-model="imageActionForm.removeOther" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'image-push'">
        <el-form-item label="推送方式">
          <el-radio-group v-model="imageActionForm.pushMode">
            <el-radio value="reference">完整镜像引用</el-radio>
            <el-radio value="registry">选择 Registry</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageActionForm.pushMode === 'reference'" label="镜像引用">
          <el-input v-model.trim="imageActionForm.pushReference" placeholder="请输入镜像引用，例如 docker.io/team/demo:latest" />
        </el-form-item>
        <template v-else>
          <el-form-item label="Registry">
            <el-select v-model="imageActionForm.registryId" placeholder="请选择 Registry" filterable>
              <el-option v-for="item in registries" :key="item.id" :label="`${item.name}（${registryLabel(item)}）`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="镜像名">
            <el-input v-model.trim="imageActionForm.pushImageName" placeholder="请输入镜像名，例如 team/demo:latest" />
          </el-form-item>
        </template>
      </template>

      <template v-if="dialogType === 'network' || dialogType === 'volume'">
        <el-form-item label="名称" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入名称，例如 app-network" />
        </el-form-item>
        <el-form-item label="驱动">
          <el-input v-model.trim="form.driver" :placeholder="dialogType === 'network' ? '请输入驱动，例如 bridge' : '请输入驱动，例如 local'" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'network'">
        <el-divider content-position="left">IPAM 与扩展参数</el-divider>
        <el-form-item label="IPv4">
          <el-switch v-model="form.networkIpv4" />
        </el-form-item>
        <template v-if="form.networkIpv4">
          <el-form-item label="IPv4 子网">
            <el-input v-model.trim="form.networkIpv4Subnet" placeholder="请输入 IPv4 子网，例如 172.16.10.0/24" />
          </el-form-item>
          <el-form-item label="IPv4 网关">
            <el-input v-model.trim="form.networkIpv4Gateway" placeholder="请输入 IPv4 网关，例如 172.16.10.1" />
          </el-form-item>
          <el-form-item label="IPv4 范围">
            <el-input v-model.trim="form.networkIpv4IpRange" placeholder="请输入 IPv4 范围，例如 172.16.10.0/25，可选" />
          </el-form-item>
          <el-form-item label="IPv4 保留">
            <el-input v-model="form.networkIpv4AuxAddressesText" type="textarea" :rows="2" placeholder="请输入 IPv4 保留地址，例如 host1=172.16.10.10" />
          </el-form-item>
        </template>
        <el-form-item label="IPv6">
          <el-switch v-model="form.networkIpv6" />
        </el-form-item>
        <template v-if="form.networkIpv6">
          <el-form-item label="IPv6 子网">
            <el-input v-model.trim="form.networkIpv6Subnet" placeholder="请输入 IPv6 子网，例如 2408:400e::/48" />
          </el-form-item>
          <el-form-item label="IPv6 网关">
            <el-input v-model.trim="form.networkIpv6Gateway" placeholder="请输入 IPv6 网关，例如 2408:400e::1" />
          </el-form-item>
          <el-form-item label="IPv6 范围">
            <el-input v-model.trim="form.networkIpv6IpRange" placeholder="请输入 IPv6 范围，例如 2408:400e::/64，可选" />
          </el-form-item>
          <el-form-item label="IPv6 保留">
            <el-input v-model="form.networkIpv6AuxAddressesText" type="textarea" :rows="2" placeholder="请输入 IPv6 保留地址，例如 host1=2408:400e::10" />
          </el-form-item>
        </template>
        <el-form-item label="Options">
          <el-input v-model="form.optionsText" type="textarea" :rows="2" placeholder="请输入 Options，每行一个 key=value，可选" />
        </el-form-item>
        <el-form-item label="Labels">
          <el-input v-model="form.labelsText" type="textarea" :rows="2" placeholder="请输入 Labels，每行一个 key=value，可选" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'volume'">
        <el-divider content-position="left">存储参数</el-divider>
        <el-form-item label="NFS">
          <el-switch v-model="form.volumeNfs" />
          <div class="field-help">开启后按 NFS 存储卷创建，Options 可填写 type/device/o。</div>
        </el-form-item>
        <el-form-item label="Options">
          <el-input
            v-model="form.optionsText"
            type="textarea"
            :rows="3"
            placeholder="请输入 Options，例如 type=nfs&#10;device=:/export/data&#10;o=addr=192.168.1.10,rw"
          />
        </el-form-item>
        <el-form-item label="Labels">
          <el-input v-model="form.labelsText" type="textarea" :rows="2" placeholder="请输入 Labels，每行一个 key=value，可选" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'registry'">
        <el-form-item label="名称">
          <el-input v-model.trim="registryForm.name" placeholder="请输入 Registry 名称，例如 Docker Hub" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model.trim="registryForm.address" placeholder="请输入 Registry 地址，例如 docker.io 或 registry.example.com:5000" />
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="registryForm.protocol">
            <el-option label="https" value="https" />
            <el-option label="http" value="http" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证">
          <el-switch v-model="registryForm.authEnabled" />
        </el-form-item>
        <template v-if="registryForm.authEnabled">
          <el-form-item label="用户名">
            <el-input v-model.trim="registryForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="registryForm.password" type="password" show-password placeholder="请输入密码，编辑时留空表示不替换密码" />
          </el-form-item>
        </template>
      </template>

      <template v-if="dialogType === 'template'">
        <el-form-item label="名称">
          <el-input v-model.trim="templateForm.name" placeholder="请输入模板名称，例如 nginx-compose" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model.trim="templateForm.description" placeholder="请输入模板说明，可选" />
        </el-form-item>
        <el-form-item label="YAML">
          <el-input v-model="templateForm.content" type="textarea" :rows="10" />
        </el-form-item>
      </template>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.resource-dialog-form {
  min-height: calc(100vh - 180px);

  :deep(.el-select),
  :deep(.el-input),
  :deep(.el-textarea) {
    width: 100%;
  }

  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
  }

  :deep(.el-radio) {
    height: 32px;
    margin-right: 0;
    font-weight: 700;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper) {
    border-radius: 14px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.file-picker {
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);
  color: var(--text-secondary);
}

.field-help {
  flex-basis: 100%;
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.5;
}

:deep(.el-divider__text) {
  color: var(--text-secondary);
  font-weight: 700;
}
</style>
