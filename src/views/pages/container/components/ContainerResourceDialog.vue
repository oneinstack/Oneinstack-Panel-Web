<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { DialogType, ImageItem, RegistryItem, TemplateItem } from '../types'
import i18n from '@/lang'

const t = i18n.t as any

const props = defineProps<{
  visible: boolean
  dialogType: DialogType
  dialogTarget: any
  saving: boolean
  form: Record<string, any>
  rules: FormRules
  imageActionForm: Record<string, any>
  composeForm: Record<string, any>
  registryForm: Record<string, any>
  templateForm: Record<string, any>
  registries: RegistryItem[]
  templates: TemplateItem[]
  imageReference: (row: ImageItem) => string
  registryLabel: (row: RegistryItem) => string
  revealComposeConfig: () => void | Promise<void>
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'confirm'): void
  (event: 'import-file-change', value: Event): void
}>()

const formRef = ref<FormInstance>()

const networkModeOptions = [
  { label: 'bridge', value: 'bridge' },
  { label: 'ipvlan', value: 'ipvlan' },
  { label: 'macvlan', value: 'macvlan' },
  { label: 'overlay', value: 'overlay' }
]

const title = computed<string>(() => {
  switch (props.dialogType) {
    case 'image': return t('container.resourceDialog.titles.image')
    case 'image-import': return t('container.resourceDialog.titles.imageImport')
    case 'image-build': return t('container.resourceDialog.titles.imageBuild')
    case 'image-tag': return t('container.resourceDialog.titles.imageTag')
    case 'image-push': return t('container.resourceDialog.titles.imagePush')
    case 'network': return t('container.resourceDialog.titles.network')
    case 'volume': return t('container.resourceDialog.titles.volume')
    case 'compose-create': return t('container.resourceDialog.titles.composeCreate')
    case 'compose-edit': return t('container.resourceDialog.titles.composeEdit')
    case 'compose-template-deploy': return t('container.resourceDialog.titles.composeTemplateDeploy')
    case 'registry': return t(props.dialogTarget ? 'container.resourceDialog.titles.registryEdit' : 'container.resourceDialog.titles.registryCreate')
    case 'template': return t(props.dialogTarget ? 'container.resourceDialog.titles.templateEdit' : 'container.resourceDialog.titles.templateCreate')
    default:
      return ''
  }
})

const selectedPushRegistry = computed(() => props.registries.find(
  (item) => String(item.id) === String(props.imageActionForm.registryId ?? '')
))
const pushRegistryAuthMissing = computed(() =>
  props.dialogType === 'image-push'
  && props.imageActionForm.pushMode === 'registry'
  && selectedPushRegistry.value?.authEnabled === false
)

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
    :confirm-text="t('container.resourceDialog.confirm')"
    :loading="saving"
    :confirm-disabled="pushRegistryAuthMissing"
    :on-close="() => emit('update:visible', false)"
    :on-confirm="() => emit('confirm')"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" class="resource-dialog-form">
      <template v-if="dialogType === 'image'">
        <el-form-item :label="t('container.resourceDialog.pullMode')">
          <el-radio-group v-model="imageActionForm.pullMode">
            <el-radio value="reference">{{ t('container.resourceDialog.fullReference') }}</el-radio>
            <el-radio value="registry">{{ t('container.resourceDialog.selectRegistry') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageActionForm.pullMode === 'reference'" :label="t('container.resourceDialog.imageReference')">
          <el-input v-model.trim="imageActionForm.reference" :placeholder="t('container.resourceDialog.imageReferencePlaceholder')" />
        </el-form-item>
        <template v-else>
          <el-form-item :label="t('container.resourceDialog.registry')">
            <el-select v-model="imageActionForm.registryId" :placeholder="t('container.resourceDialog.registryPlaceholder')" filterable>
              <el-option v-for="item in registries" :key="item.id" :label="`${item.name}（${registryLabel(item)}）`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.imageName')">
            <el-input v-model.trim="imageActionForm.imageName" :placeholder="t('container.resourceDialog.imageNamePlaceholder')" />
          </el-form-item>
        </template>
      </template>

      <el-form-item v-if="dialogType === 'image-import'" :label="t('container.resourceDialog.tarFile')">
        <input class="file-picker" type="file" accept=".tar,.gz,.tgz,.xz,.zst" @change="emit('import-file-change', $event)" />
        <div class="field-help">{{ t('container.resourceDialog.tarHelp') }}</div>
      </el-form-item>

      <template v-if="['compose-create', 'compose-edit', 'compose-template-deploy'].includes(dialogType)">
        <el-form-item
          :label="t('container.resourceDialog.composeProjectName')"
          :class="{ 'readonly-field': dialogType === 'compose-edit' }"
        >
          <el-input
            v-model.trim="composeForm.name"
            :disabled="dialogType === 'compose-edit'"
            :placeholder="t('container.resourceDialog.composeProjectNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item v-if="dialogType === 'compose-template-deploy'" :label="t('container.resourceDialog.composeTemplate')">
          <el-select v-model="composeForm.templateId" :placeholder="t('container.resourceDialog.composeTemplatePlaceholder')">
            <el-option
              v-for="item in templates"
              :key="item.id || item.name"
              :label="item.name"
              :value="item.id ?? item.name"
            />
          </el-select>
          <div class="field-help">{{ composeForm.templateDescription || t('container.resourceDialog.composeTemplateHelp') }}</div>
        </el-form-item>

        <el-form-item v-if="dialogType === 'compose-create'" :label="t('container.resourceDialog.composeSource')">
          <el-radio-group v-model="composeForm.sourceMode">
            <el-radio value="yaml">{{ t('container.resourceDialog.composePasteYaml') }}</el-radio>
            <el-radio value="upload">{{ t('container.resourceDialog.composeUploadYaml') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="dialogType === 'compose-create' && composeForm.sourceMode === 'upload'"
          :label="t('container.resourceDialog.composeFile')"
        >
          <input class="file-picker" type="file" accept=".yml,.yaml" @change="emit('import-file-change', $event)" />
          <div class="field-help">
            {{
              composeForm.sourceFileName
                ? `${t('container.resourceDialog.composeUploadedFile')}${composeForm.sourceFileName}`
                : t('container.resourceDialog.composeUploadHelp')
            }}
          </div>
        </el-form-item>

        <el-form-item
          v-if="dialogType !== 'compose-template-deploy'"
          :label="t('container.resourceDialog.yaml')"
        >
          <el-alert
            v-if="dialogType === 'compose-edit' && (composeForm.containsSensitiveConfig || composeForm.contentMode === 'plaintext')"
            type="warning"
            show-icon
            :closable="false"
            :title="t('container.resourceDialog.sensitiveConfigWarning')"
          >
            <template #default>
              <div class="sensitive-config-actions">
                <span>{{ composeForm.contentMode === 'plaintext' ? t('container.resourceDialog.sensitiveConfigPlaintextActive') : t('container.resourceDialog.sensitiveConfigRedacted') }}</span>
                <el-button
                  v-if="composeForm.contentMode !== 'plaintext'"
                  link
                  type="warning"
                  @click="revealComposeConfig"
                >
                  {{ t('container.resourceDialog.revealSensitiveConfig') }}
                </el-button>
              </div>
            </template>
          </el-alert>
          <div v-if="composeForm.redactionReason" class="field-help sensitive-config-reason">
            {{ composeForm.redactionReason }}
          </div>
          <el-input
            v-model="composeForm.content"
            type="textarea"
            :rows="14"
            :placeholder="t('container.resourceDialog.composeYamlPlaceholder')"
          />
        </el-form-item>

        <el-form-item
          v-if="dialogType === 'compose-template-deploy'"
          :label="t('container.resourceDialog.yamlPreview')"
          class="readonly-field"
        >
          <el-input :model-value="composeForm.content || ''" type="textarea" :rows="12" disabled />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'image-build'">
        <el-form-item :label="t('container.resourceDialog.targetImage')">
          <el-input v-model.trim="imageActionForm.buildName" :placeholder="t('container.resourceDialog.targetImagePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.buildMode')">
          <el-radio-group v-model="imageActionForm.buildMode">
            <el-radio value="dockerfile">{{ t('container.resourceDialog.editDockerfile') }}</el-radio>
            <el-radio value="path">{{ t('container.resourceDialog.serverPath') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageActionForm.buildMode === 'dockerfile'" :label="t('container.resourceDialog.dockerfile')">
          <el-input v-model="imageActionForm.dockerfile" type="textarea" :rows="8" />
        </el-form-item>
        <template v-else>
          <el-form-item :label="t('container.resourceDialog.contextPath')">
            <el-input v-model.trim="imageActionForm.contextPath" :placeholder="t('container.resourceDialog.contextPathPlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.dockerfile')">
            <el-input v-model.trim="imageActionForm.dockerfilePath" :placeholder="t('container.resourceDialog.dockerfilePathPlaceholder')" />
          </el-form-item>
        </template>
        <el-form-item :label="t('container.resourceDialog.labels')">
          <el-input v-model="imageActionForm.labelsText" type="textarea" :rows="2" :placeholder="t('container.resourceDialog.optionalLabelsPlaceholder')" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'image-tag'">
        <el-form-item :label="t('container.resourceDialog.currentImage')" class="readonly-field">
          <el-input :model-value="dialogTarget ? imageReference(dialogTarget) : ''" disabled />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.newTag')">
          <el-input v-model.trim="imageActionForm.tagReference" :placeholder="t('container.resourceDialog.newTagPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.removeOldTag')">
          <el-switch v-model="imageActionForm.removeOther" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'image-push'">
        <el-form-item :label="t('container.resourceDialog.pushMode')">
          <el-radio-group v-model="imageActionForm.pushMode">
            <el-radio value="reference">{{ t('container.resourceDialog.fullReference') }}</el-radio>
            <el-radio value="registry">{{ t('container.resourceDialog.selectRegistry') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageActionForm.pushMode === 'reference'" :label="t('container.resourceDialog.imageReference')">
          <el-input v-model.trim="imageActionForm.pushReference" :placeholder="t('container.resourceDialog.pushReferencePlaceholder')" />
        </el-form-item>
        <template v-else>
          <el-form-item :label="t('container.resourceDialog.registry')">
            <el-select v-model="imageActionForm.registryId" :placeholder="t('container.resourceDialog.registryPlaceholder')" filterable>
              <el-option v-for="item in registries" :key="item.id" :label="`${item.name}（${registryLabel(item)}）`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-alert
            v-if="pushRegistryAuthMissing"
            class="push-registry-alert"
            type="warning"
            show-icon
            :closable="false"
            :title="t('container.resourceDialog.registryPushAuthRequired')"
          >
            <template v-if="selectedPushRegistry?.statusMessage" #default>
              {{ t('container.resourceDialog.registryStatusMessage', { message: selectedPushRegistry.statusMessage }) }}
            </template>
          </el-alert>
          <div v-else-if="selectedPushRegistry?.statusMessage" class="field-help push-registry-status">
            {{ t('container.resourceDialog.registryStatusMessage', { message: selectedPushRegistry.statusMessage }) }}
          </div>
          <el-form-item :label="t('container.resourceDialog.imageName')">
            <el-input v-model.trim="imageActionForm.pushImageName" :placeholder="t('container.resourceDialog.pushImageNamePlaceholder')" />
          </el-form-item>
        </template>
      </template>

      <template v-if="dialogType === 'network' || dialogType === 'volume'">
        <el-form-item :label="t('container.resourceDialog.name')" prop="name">
          <el-input v-model.trim="form.name" :placeholder="t('container.resourceDialog.namePlaceholder')" />
        </el-form-item>
        <el-form-item v-if="dialogType === 'network'" :label="t('container.resourceDialog.mode')">
          <el-select v-model="form.driver" :placeholder="t('container.resourceDialog.selectMode')">
            <el-option
              v-for="item in networkModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-else :label="t('container.resourceDialog.mode')">
          <el-input v-model.trim="form.driver" :placeholder="t('container.resourceDialog.modePlaceholder')" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'network'">
        <el-divider content-position="left">{{ t('container.resourceDialog.ipam') }}</el-divider>
        <el-form-item :label="t('container.resourceDialog.ipv4')">
          <el-switch v-model="form.networkIpv4" />
        </el-form-item>
        <template v-if="form.networkIpv4">
          <el-form-item :label="t('container.resourceDialog.subnet', { version: 'IPv4' })">
            <el-input v-model.trim="form.networkIpv4Subnet" :placeholder="t('container.resourceDialog.subnetPlaceholder', { version: 'IPv4', example: '172.16.10.0/24' })" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.gateway', { version: 'IPv4' })">
            <el-input v-model.trim="form.networkIpv4Gateway" :placeholder="t('container.resourceDialog.gatewayPlaceholder', { version: 'IPv4', example: '172.16.10.1' })" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.range', { version: 'IPv4' })">
            <el-input v-model.trim="form.networkIpv4IpRange" :placeholder="t('container.resourceDialog.rangePlaceholder', { version: 'IPv4', example: '172.16.10.0/25' })" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.reserved', { version: 'IPv4' })">
            <el-input v-model="form.networkIpv4AuxAddressesText" type="textarea" :rows="2" :placeholder="t('container.resourceDialog.reservedPlaceholder', { version: 'IPv4', example: 'host1=172.16.10.10' })" />
          </el-form-item>
        </template>
        <el-form-item :label="t('container.resourceDialog.ipv6')">
          <el-switch v-model="form.networkIpv6" />
        </el-form-item>
        <template v-if="form.networkIpv6">
          <el-form-item :label="t('container.resourceDialog.subnet', { version: 'IPv6' })">
            <el-input v-model.trim="form.networkIpv6Subnet" :placeholder="t('container.resourceDialog.subnetPlaceholder', { version: 'IPv6', example: '2408:400e::/48' })" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.gateway', { version: 'IPv6' })">
            <el-input v-model.trim="form.networkIpv6Gateway" :placeholder="t('container.resourceDialog.gatewayPlaceholder', { version: 'IPv6', example: '2408:400e::1' })" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.range', { version: 'IPv6' })">
            <el-input v-model.trim="form.networkIpv6IpRange" :placeholder="t('container.resourceDialog.rangePlaceholder', { version: 'IPv6', example: '2408:400e::/64' })" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.reserved', { version: 'IPv6' })">
            <el-input v-model="form.networkIpv6AuxAddressesText" type="textarea" :rows="2" :placeholder="t('container.resourceDialog.reservedPlaceholder', { version: 'IPv6', example: 'host1=2408:400e::10' })" />
          </el-form-item>
        </template>
        <el-form-item :label="t('container.resourceDialog.options')">
          <el-input v-model="form.optionsText" type="textarea" :rows="2" :placeholder="t('container.resourceDialog.optionsPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.labels')">
          <el-input v-model="form.labelsText" type="textarea" :rows="2" :placeholder="t('container.resourceDialog.optionalLabelsPlaceholder')" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'volume'">
        <el-divider content-position="left">{{ t('container.resourceDialog.storageParameters') }}</el-divider>
        <el-form-item :label="t('container.resourceDialog.nfs')">
          <el-switch v-model="form.volumeNfs" />
          <div class="field-help">{{ t('container.resourceDialog.nfsHelp') }}</div>
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.options')">
          <el-input
            v-model="form.optionsText"
            type="textarea"
            :rows="3"
            :placeholder="t('container.resourceDialog.nfsOptionsPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.labels')">
          <el-input v-model="form.labelsText" type="textarea" :rows="2" :placeholder="t('container.resourceDialog.optionalLabelsPlaceholder')" />
        </el-form-item>
      </template>

      <template v-if="dialogType === 'registry'">
        <el-form-item :label="t('container.resourceDialog.name')">
          <el-input v-model.trim="registryForm.name" :placeholder="t('container.resourceDialog.registryNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.address')">
          <el-input v-model.trim="registryForm.address" :placeholder="t('container.resourceDialog.registryAddressPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.protocol')">
          <el-select v-model="registryForm.protocol">
            <el-option label="https" value="https" />
            <el-option label="http" value="http" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.auth')">
          <el-switch v-model="registryForm.authEnabled" />
        </el-form-item>
        <template v-if="registryForm.authEnabled">
          <el-form-item :label="t('container.resourceDialog.username')">
            <el-input v-model.trim="registryForm.username" :placeholder="t('container.resourceDialog.usernamePlaceholder')" />
          </el-form-item>
          <el-form-item :label="t('container.resourceDialog.password')">
            <el-input v-model="registryForm.password" type="password" show-password :placeholder="t('container.resourceDialog.passwordPlaceholder')" />
          </el-form-item>
        </template>
      </template>

      <template v-if="dialogType === 'template'">
        <el-form-item :label="t('container.resourceDialog.name')">
          <el-input v-model.trim="templateForm.name" :placeholder="t('container.resourceDialog.templateNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.description')">
          <el-input v-model.trim="templateForm.description" :placeholder="t('container.resourceDialog.templateDescriptionPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('container.resourceDialog.yaml')">
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

  :deep(.el-divider) {
    margin: 10px 0 18px;
    border-top-color: rgba(148, 163, 184, 0.18);
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

.push-registry-alert {
  margin: -4px 0 20px 112px;
}

.push-registry-status {
  margin: -12px 0 20px 112px;
}

.sensitive-config-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sensitive-config-reason {
  color: var(--el-color-warning);
}

:deep(.readonly-field .el-input.is-disabled .el-input__wrapper) {
  // background: linear-gradient(180deg, rgba(31, 41, 55, 0.96), rgba(17, 24, 39, 0.96));
  // border: 1px solid rgba(71, 85, 105, 0.72);
  // box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.1);
  background: var(--surface-card);
    box-shadow: 0 0 0 1px var(--border-default) inset;
}

:deep(.readonly-field .el-input.is-disabled .el-input__inner) {
  color: var(--text-secondary);
  -webkit-text-fill-color: var(--text-secondary);
}

:deep(.el-divider__text) {
  color: var(--text-secondary);
  background: var(--surface-raised);
  font-weight: 700;
}

:root:root.dark .resource-dialog-form {
  :deep(.el-divider) {
    border-top-color: rgba(71, 84, 103, 0.72);
  }

  :deep(.el-divider__text) {
    color: #d1d5db;
    background: var(--surface-raised);
    box-shadow: 0 0 0 6px var(--surface-raised);
  }
}
</style>
