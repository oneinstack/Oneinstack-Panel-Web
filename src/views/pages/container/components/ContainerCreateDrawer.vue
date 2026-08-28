<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ImageItem, NetworkItem, VolumeItem } from '../types'
import i18n from '@/lang'

const t = i18n.t

const props = defineProps<{
  visible: boolean
  saving: boolean
  form: Record<string, any>
  rules: FormRules
  images: ImageItem[]
  networks: NetworkItem[]
  volumes: VolumeItem[]
  imageReference: (row: ImageItem) => string
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
  (event: 'confirm'): void
  (event: 'add-port'): void
  (event: 'remove-port', index: number): void
  (event: 'add-mount'): void
  (event: 'remove-mount', index: number): void
}>()

const formRef = ref<FormInstance>()

watch(
  () => props.form.manualImage,
  () => {
    props.form.image = ''
    formRef.value?.clearValidate?.(['image'])
  },
)

watch(
  () => props.form.autoRemove,
  (enabled) => {
    if (enabled) props.form.restart = 'no'
  }
)

defineExpose({
  validate: () => formRef.value?.validate(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<template>
  <custom-drawer
    :visible="visible"
    :title="t('container.create.title')"
    size="760px"
    :loading="saving"
    :on-close="() => emit('update:visible', false)"
    :on-confirm="() => emit('confirm')"
  >
    <el-form ref="formRef" class="container-create-form" :model="form" :rules="rules" label-width="96px">
      <el-form-item :label="t('container.create.name')" prop="name">
        <el-input v-model.trim="form.name" :placeholder="t('container.create.namePlaceholder')" />
        <div class="field-help">{{ t('container.create.nameHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.image')" prop="image" required>
        <div class="image-field">
          <el-checkbox v-model="form.manualImage" class="image-field__toggle">{{ t('container.create.manualInput') }}</el-checkbox>
          <el-input
            v-if="form.manualImage"
            v-model.trim="form.image"
            :placeholder="t('container.create.imagePlaceholder')"
          />
          <el-select
            v-else
            v-model="form.image"
            :placeholder="t('container.create.selectImage')"
            filterable
            clearable
            :disabled="!images.length"
          >
            <el-option
              v-for="item in images"
              :key="item.ID"
              :label="imageReference(item)"
              :value="imageReference(item)"
            />
          </el-select>
          <el-alert
            v-if="!form.manualImage && !images.length"
            class="image-empty-alert"
            type="warning"
            :closable="false"
            show-icon
            :title="t('container.create.noLocalImage')"
          />
        </div>
        <div class="field-help">{{ t('container.create.imageHelp') }}</div>
      </el-form-item>

      <div class="section-divider">
        <span>{{ t('container.create.networkMounts') }}</span>
      </div>
      <el-form-item :label="t('container.create.portMapping')">
        <div class="port-publish">
          <el-radio-group v-model="form.portPublishMode" class="port-mode-options">
            <el-radio value="ports">{{ t('container.create.exposePorts') }}</el-radio>
            <el-radio value="all">{{ t('container.create.exposeAll') }}</el-radio>
          </el-radio-group>
          <div v-if="form.portPublishMode === 'ports'" class="port-card">
            <div class="port-card__head">
              <span>{{ t('container.create.host') }}</span>
              <span>{{ t('container.create.container') }}</span>
              <span>{{ t('container.create.protocol') }}</span>
              <span></span>
            </div>
            <div v-for="(port, index) in form.ports" :key="index" class="port-card__row">
              <div class="port-field">
                <el-input v-model.trim="port.host" :placeholder="t('container.create.hostPortPlaceholder')" />
                <small>{{ t('container.create.hostPortHelp') }}</small>
              </div>
              <div class="port-field">
                <el-input v-model.trim="port.container" :placeholder="t('container.create.containerPortPlaceholder')" />
                <small>{{ t('container.create.containerPortHelp') }}</small>
              </div>
              <el-select v-model="port.protocol">
                <el-option label="tcp" value="tcp" />
                <el-option label="udp" value="udp" />
                <el-option label="sctp" value="sctp" />
              </el-select>
              <el-button link type="primary" @click="emit('remove-port', index)">{{ t('common.delete') }}</el-button>
            </div>
            <el-button class="port-add-button" @click="emit('add-port')">{{ t('common.add') }}</el-button>
          </div>
          <div v-else class="port-all-fields">
            <label>
              <span>{{ t('container.create.network') }}</span>
              <el-select
                v-model="form.networksText"
                :placeholder="t('container.create.selectNetwork')"
                filterable
                clearable
              >
                <el-option
                  v-for="network in networks"
                  :key="network.ID"
                  :label="network.Name"
                  :value="network.Name"
                />
              </el-select>
            </label>
            <label>
              <span>{{ t('container.create.ipv4') }}</span>
              <el-input v-model.trim="form.ipv4" :placeholder="t('container.create.ipv4Placeholder')" />
            </label>
            <label>
              <span>{{ t('container.create.ipv6') }}</span>
              <el-input v-model.trim="form.ipv6" :placeholder="t('container.create.ipv6Placeholder')" />
            </label>
          </div>
        </div>
      </el-form-item>
      <el-form-item v-if="form.portPublishMode === 'ports'" :label="t('container.create.network')">
        <el-select
          v-model="form.networksText"
          :placeholder="t('container.create.selectNetwork')"
          filterable
          clearable
        >
          <el-option
            v-for="network in networks"
            :key="network.ID"
            :label="network.Name"
            :value="network.Name"
          />
        </el-select>
        <div class="field-help">{{ t('container.create.networkHelp') }}</div>
      </el-form-item>
      <el-form-item v-if="form.portPublishMode === 'ports'" :label="t('container.create.fixedIp')">
        <div class="form-inline-grid">
          <el-input v-model.trim="form.ipv4" :placeholder="t('container.create.optionalIpv4')" />
          <el-input v-model.trim="form.ipv6" :placeholder="t('container.create.optionalIpv6')" />
        </div>
        <div class="field-help">{{ t('container.create.fixedIpHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.mounts')">
        <div class="mount-list">
          <div v-for="(mount, index) in form.mounts" :key="index" class="mount-card">
            <div class="mount-card__top">
              <el-radio-group v-model="mount.mode" class="mount-mode-options">
                <el-radio value="volume">{{ t('container.create.volumeMount') }}</el-radio>
                <el-radio value="bind">{{ t('container.create.bindMount') }}</el-radio>
              </el-radio-group>
              <el-button link type="primary" @click="emit('remove-mount', index)">{{ t('common.delete') }}</el-button>
            </div>
            <div class="mount-card__grid">
              <label>
                <span>{{ mount.mode === 'volume' ? t('container.create.volumeMount') : t('container.create.bindMount') }}</span>
                <el-select
                  v-if="mount.mode === 'volume'"
                  v-model="mount.source"
                  :placeholder="t('container.create.selectVolume')"
                  filterable
                  clearable
                >
                  <el-option
                    v-for="volume in volumes"
                    :key="volume.Name"
                    :label="volume.Name"
                    :value="volume.Name"
                  />
                </el-select>
                <el-input
                  v-else
                  v-model.trim="mount.source"
                  :placeholder="t('container.create.bindPlaceholder')"
                />
              </label>
              <label>
                <span>{{ t('container.create.permission') }}</span>
                <el-select v-model="mount.permission">
                  <el-option :label="t('container.create.readWrite')" value="rw" />
                  <el-option :label="t('container.create.readOnly')" value="ro" />
                </el-select>
              </label>
              <label>
                <span>{{ t('container.create.containerPath') }}</span>
                <el-input v-model.trim="mount.target" :placeholder="t('container.create.containerPathPlaceholder')" />
              </label>
            </div>
          </div>
          <el-button class="mount-add-button" @click="emit('add-mount')">{{ t('common.add') }}</el-button>
        </div>
        <div class="field-help">
          {{ t('container.create.mountHelp') }}
        </div>
      </el-form-item>

      <div class="section-divider">
        <span>{{ t('container.create.startupParameters') }}</span>
      </div>
      <el-form-item :label="t('container.create.command')">
        <el-input
          v-model="form.commandText"
          type="textarea"
          :rows="2"
          :placeholder="t('container.create.commandPlaceholder')"
        />
        <div class="field-help">{{ t('container.create.commandHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.entrypoint')">
        <el-input
          v-model="form.entrypointText"
          type="textarea"
          :rows="2"
          :placeholder="t('container.create.entrypointPlaceholder')"
        />
        <div class="field-help">{{ t('container.create.entrypointHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.restartPolicy')">
        <el-radio-group v-model="form.restart" class="restart-options" :disabled="form.autoRemove">
          <el-radio value="no">{{ t('container.create.restartNever') }}</el-radio>
          <el-radio value="always">{{ t('container.create.restartAlways') }}</el-radio>
          <el-radio value="on-failure:5">{{ t('container.create.restartOnFailure') }}</el-radio>
          <el-radio value="unless-stopped">{{ t('container.create.restartUnlessStopped') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="t('container.create.runtimeOptions')">
        <div class="form-switches">
          <el-checkbox v-model="form.autoRemove">{{ t('container.create.autoRemove') }}</el-checkbox>
          <el-checkbox v-model="form.tty">{{ t('container.create.tty') }}</el-checkbox>
          <el-checkbox v-model="form.openStdin">{{ t('container.create.keepStdin') }}</el-checkbox>
          <el-checkbox v-model="form.privileged">{{ t('container.create.privileged') }}</el-checkbox>
        </div>
        <div class="field-help">
          {{ form.autoRemove ? t('container.create.autoRemoveHelp') : t('container.create.privilegedHelp') }}
        </div>
      </el-form-item>

      <div class="section-divider">
        <span>{{ t('container.resourceLimits') }}</span>
      </div>
      <el-form-item :label="t('container.create.cpuWeight')">
        <el-input-number
          v-model="form.cpuWeight"
          :min="10"
          :max="1000"
          :step="10"
          controls-position="right"
          :placeholder="t('container.create.cpuWeightPlaceholder')"
        />
        <div class="resource-help">{{ t('container.create.cpuWeightHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.cpuLimit')">
        <el-input-number
          v-model="form.cpuLimit"
          class="resource-limit-input"
          :min="0"
          :max="256"
          :step="0.5"
          controls-position="right"
          :placeholder="t('container.create.cpuLimitPlaceholder')"
        />
        <span class="field-unit">{{ t('container.create.cpuUnit') }}</span>
        <div class="resource-help">{{ t('container.create.cpuLimitHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.memoryLimit')">
        <el-input-number
          v-model="form.memoryLimitMB"
          class="resource-limit-input"
          :min="0"
          :step="128"
          controls-position="right"
          :placeholder="t('container.create.memoryLimitPlaceholder')"
        />
        <span class="field-unit">MB</span>
        <div class="resource-help">{{ t('container.create.memoryLimitHelp') }}</div>
      </el-form-item>

      <div class="section-divider">
        <span>{{ t('container.create.labelsEnvironment') }}</span>
      </div>
      <el-form-item :label="t('container.create.labels')">
        <el-input
          v-model="form.labelsText"
          type="textarea"
          :rows="2"
          :placeholder="t('container.create.labelsPlaceholder')"
        />
        <div class="field-help">{{ t('container.create.labelsHelp') }}</div>
      </el-form-item>
      <el-form-item :label="t('container.create.environment')">
        <el-input
          v-model="form.environmentText"
          type="textarea"
          :rows="2"
          :placeholder="t('container.create.environmentPlaceholder')"
        />
        <div class="field-help">{{ t('container.create.environmentHelp') }}</div>
      </el-form-item>
    </el-form>
  </custom-drawer>
</template>

<style scoped lang="less">
.container-create-form {
  max-width: 640px;
  margin: 0 auto;

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    align-items: center;
    min-height: 44px;
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  :deep(.el-input),
  :deep(.el-textarea),
  :deep(.el-select),
  :deep(.el-input-number) {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 44px;
    border-radius: 8px;
  }

  :deep(.el-textarea__inner) {
    min-height: 78px;
    border-radius: 8px;
    line-height: 1.55;
    resize: vertical;
  }

  :deep(.resource-limit-input) {
    width: calc(100% - 82px);
  }
}

.section-divider {
  position: relative;
  display: flex;
  align-items: center;
  margin: 28px 0 22px;
  min-height: 28px;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: color-mix(in srgb, var(--border-subtle) 84%, transparent);
    transform: translateY(-50%);
  }

  > span {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    padding: 0 14px 0 0;
    background: var(--surface-page);
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 760;
    line-height: 1.35;
  }
}

.field-unit {
  width: 70px;
  height: 44px;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-page) 78%, var(--surface-card));
  color: var(--text-tertiary);
  font-weight: 700;
}

.field-help,
.resource-help {
  flex-basis: 100%;
  margin-top: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.5;
}

.image-field {
  width: 100%;
  display: grid;
  gap: 10px;

  &__toggle {
    width: fit-content;
    margin: 0;
  }

  :deep(.image-field__toggle.el-checkbox) {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    user-select: none;
  }

  :deep(.image-field__toggle .el-checkbox__input) {
    flex: 0 0 auto;
    margin: 0;
  }

  :deep(.image-field__toggle .el-checkbox__label) {
    display: inline-flex;
    align-items: center;
    padding-left: 0;
    white-space: normal;
    color: var(--text-primary);
  }
}

.image-empty-alert {
  margin-top: 2px;
}

.form-inline-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.form-switches {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  width: 100%;

  :deep(.el-checkbox) {
    min-width: 0;
    min-height: 42px;
    margin-right: 0;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    user-select: none;
  }

  :deep(.el-checkbox__input) {
    flex: 0 0 auto;
    margin: 0;
  }

  :deep(.el-checkbox__label) {
    flex: 1;
    display: inline-flex;
    align-items: center;
    min-width: 0;
    padding-left: 0;
    white-space: normal;
    color: var(--text-primary);
  }
}

.restart-options,
.port-mode-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 34px;

  :deep(.el-radio) {
    height: 32px;
    margin-right: 0;
    color: var(--text-secondary);
    font-size: 15px;
    font-weight: 720;
  }

  :deep(.el-radio.is-checked) {
    color: var(--el-color-primary);
  }

  :deep(.el-radio__label) {
    padding-left: 10px;
  }
}

.port-publish {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.port-card {
  padding: 24px 20px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.port-card__head,
.port-card__row {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) 116px 64px;
  gap: 14px;
  align-items: start;
}

.port-card__head {
  padding: 0 0 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 760;
}

.port-card__row {
  padding: 12px 0;

  &:nth-child(odd) {
    background: color-mix(in srgb, var(--surface-page) 62%, transparent);
  }
}

.port-field {
  display: grid;
  gap: 6px;
  min-width: 0;

  small {
    color: var(--text-tertiary);
    font-size: 12px;
    line-height: 1.4;
    white-space: normal;
  }
}

.port-add-button {
  margin-top: 8px;
}

.port-all-fields {
  display: grid;
  gap: 18px;
  width: 100%;

  label {
    display: grid;
    gap: 8px;

    > span {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 720;
    }
  }
}

.mount-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.mount-card {
  padding: 18px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--surface-card);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.mount-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.mount-mode-options {
  display: inline-flex;
  align-items: center;
  gap: 12px 24px;

  :deep(.el-radio) {
    height: 32px;
    margin-right: 0;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 700;
  }

  :deep(.el-radio.is-checked) {
    color: var(--el-color-primary);
  }

  :deep(.el-radio__label) {
    padding-left: 10px;
  }
}

.mount-card__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(130px, 0.8fr) minmax(0, 1.5fr);
  gap: 12px;

  label {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    > span {
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 700;
    }
  }
}

.mount-add-button {
  align-self: flex-start;
}

@media (max-width: 1180px) {
  .port-card__head,
  .port-card__row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 108px 60px;
  }
}

@media (max-width: 980px) {
  .form-inline-grid,
  .form-switches {
    grid-template-columns: 1fr;
  }

  .port-card__head {
    display: none;
  }

  .port-card__row,
  .mount-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
