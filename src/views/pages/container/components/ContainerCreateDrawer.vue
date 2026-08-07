<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ImageItem, NetworkItem, VolumeItem } from '../types'

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

defineExpose({
  validate: () => formRef.value?.validate(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<template>
  <custom-drawer
    :visible="visible"
    title="创建容器"
    size="760px"
    :loading="saving"
    :on-close="() => emit('update:visible', false)"
    :on-confirm="() => emit('confirm')"
  >
    <el-form ref="formRef" class="container-create-form" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="名称" prop="name">
        <el-input v-model.trim="form.name" placeholder="请输入容器名称，例如 demo-nginx" />
        <div class="field-help">容器名称，不能包含空格、斜杠和换行。</div>
      </el-form-item>
      <el-form-item label="镜像" prop="image" required>
        <div class="image-field">
          <el-checkbox v-model="form.manualImage" class="image-field__toggle">手动输入</el-checkbox>
          <el-input
            v-if="form.manualImage"
            v-model.trim="form.image"
            placeholder="请输入镜像引用，例如 nginx:1.27"
          />
          <el-select
            v-else
            v-model="form.image"
            placeholder="请选择镜像"
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
            title="当前无本地镜像，请手动输入镜像或先配置可用 Registry/镜像加速器"
          />
        </div>
        <div class="field-help">可直接选择现有镜像，也可切换为手动输入镜像引用。</div>
      </el-form-item>

      <el-divider content-position="left">网络与挂载</el-divider>
      <el-form-item label="端口映射">
        <div class="port-publish">
          <el-radio-group v-model="form.portPublishMode" class="port-mode-options">
            <el-radio value="ports">暴露端口</el-radio>
            <el-radio value="all">暴露所有</el-radio>
          </el-radio-group>
          <div v-if="form.portPublishMode === 'ports'" class="port-card">
            <div class="port-card__head">
              <span>服务器</span>
              <span>容器</span>
              <span>协议</span>
              <span></span>
            </div>
            <div v-for="(port, index) in form.ports" :key="index" class="port-card__row">
              <div class="port-field">
                <el-input v-model.trim="port.host" placeholder="请输入服务器端口，例如 80、80-88 或 ip:80" />
                <small>支持 80、80-88、ip:80 或 ip:80-88</small>
              </div>
              <div class="port-field">
                <el-input v-model.trim="port.container" placeholder="请输入容器端口，例如 80 或 80-88" />
                <small>与服务器端口数量保持一致</small>
              </div>
              <el-select v-model="port.protocol">
                <el-option label="tcp" value="tcp" />
                <el-option label="udp" value="udp" />
                <el-option label="sctp" value="sctp" />
              </el-select>
              <el-button link type="primary" @click="emit('remove-port', index)">删除</el-button>
            </div>
            <el-button class="port-add-button" @click="emit('add-port')">添加</el-button>
          </div>
          <div v-else class="port-all-fields">
            <label>
              <span>网络</span>
              <el-select
                v-model="form.networksText"
                placeholder="请选择网络"
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
              <span>IPv4</span>
              <el-input v-model.trim="form.ipv4" placeholder="请输入 IPv4 地址" />
            </label>
            <label>
              <span>IPv6</span>
              <el-input v-model.trim="form.ipv6" placeholder="请输入 IPv6 地址" />
            </label>
          </div>
        </div>
      </el-form-item>
      <el-form-item v-if="form.portPublishMode === 'ports'" label="网络">
        <el-select
          v-model="form.networksText"
          placeholder="请选择网络"
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
        <div class="field-help">要加入的 Docker 网络名称；固定 IP 需要配合对应网络。</div>
      </el-form-item>
      <el-form-item v-if="form.portPublishMode === 'ports'" label="固定 IP">
        <div class="form-inline-grid">
          <el-input v-model.trim="form.ipv4" placeholder="请输入 IPv4 地址，可选" />
          <el-input v-model.trim="form.ipv6" placeholder="请输入 IPv6 地址，可选" />
        </div>
        <div class="field-help">容器 IPv4/IPv6 地址，可选，需配合自定义网络。</div>
      </el-form-item>
      <el-form-item label="挂载">
        <div class="mount-list">
          <div v-for="(mount, index) in form.mounts" :key="index" class="mount-card">
            <div class="mount-card__top">
              <el-segmented
                v-model="mount.mode"
                :options="[
                  { label: '挂载卷', value: 'volume' },
                  { label: '本机目录', value: 'bind' }
                ]"
              />
              <el-button link type="primary" @click="emit('remove-mount', index)">删除</el-button>
            </div>
            <div class="mount-card__grid">
              <label>
                <span>{{ mount.mode === 'volume' ? '挂载卷' : '本机目录' }}</span>
                <el-select
                  v-if="mount.mode === 'volume'"
                  v-model="mount.source"
                  placeholder="请选择存储卷"
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
                  placeholder="请输入本机目录，例如 /tmp/nginx-html"
                />
              </label>
              <label>
                <span>权限</span>
                <el-select v-model="mount.permission">
                  <el-option label="读写" value="rw" />
                  <el-option label="只读" value="ro" />
                </el-select>
              </label>
              <label>
                <span>容器目录</span>
                <el-input v-model.trim="mount.target" placeholder="请输入容器目录，例如 /usr/share/nginx/html" />
              </label>
            </div>
          </div>
          <el-button class="mount-add-button" @click="emit('add-mount')">添加</el-button>
        </div>
        <div class="field-help">
          挂载卷模式会读取“存储卷”列表供选择；读写提交 `readOnly=false`，只读提交 `readOnly=true`。
        </div>
      </el-form-item>

      <el-divider content-position="left">启动参数</el-divider>
      <el-form-item label="命令">
        <el-input
          v-model="form.commandText"
          type="textarea"
          :rows="2"
          placeholder="请输入命令参数，每行一个参数，或 JSON 数组，例如 [&quot;nginx&quot;,&quot;-g&quot;,&quot;daemon off;&quot;]"
        />
        <div class="field-help">容器默认命令参数，提交为 string[]。</div>
      </el-form-item>
      <el-form-item label="EntryPoint">
        <el-input
          v-model="form.entrypointText"
          type="textarea"
          :rows="2"
          placeholder="请输入入口命令参数，每行一个参数，或 JSON 字符串数组"
        />
        <div class="field-help">容器入口命令，未填写时提交空数组。</div>
      </el-form-item>
      <el-form-item label="重启策略">
        <el-radio-group v-model="form.restart" class="restart-options">
          <el-radio value="no">不重启</el-radio>
          <el-radio value="always">一直重启</el-radio>
          <el-radio value="on-failure:5">失败后重启（默认重启 5 次）</el-radio>
          <el-radio value="unless-stopped">未手动停止则重启</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="运行选项">
        <div class="form-switches">
          <el-checkbox v-model="form.autoRemove">退出后自动删除</el-checkbox>
          <el-checkbox v-model="form.tty">TTY</el-checkbox>
          <el-checkbox v-model="form.openStdin">保持 stdin</el-checkbox>
          <el-checkbox v-model="form.privileged">特权模式</el-checkbox>
        </div>
        <div class="field-help">特权模式风险较高，建议仅管理员按需开放。</div>
      </el-form-item>

      <el-divider content-position="left">资源限制</el-divider>
      <el-form-item label="CPU 权重">
        <el-input-number
          v-model="form.cpuWeight"
          :min="10"
          :max="1000"
          :step="10"
          controls-position="right"
          placeholder="请输入 CPU 权重，默认 1000"
        />
        <div class="resource-help">CPU 权重范围为 10-1000，增大可使当前容器获得更多的 CPU 时间。</div>
      </el-form-item>
      <el-form-item label="CPU 限制">
        <el-input-number
          v-model="form.cpuLimit"
          class="resource-limit-input"
          :min="0"
          :max="256"
          :step="0.5"
          controls-position="right"
          placeholder="请输入 CPU 限制，0 表示不限制"
        />
        <span class="field-unit">核</span>
        <div class="resource-help">限制为 0 则关闭限制，最大可用值由宿主机 CPU 核数决定。</div>
      </el-form-item>
      <el-form-item label="内存限制">
        <el-input-number
          v-model="form.memoryLimitMB"
          class="resource-limit-input"
          :min="0"
          :step="128"
          controls-position="right"
          placeholder="请输入内存限制，0 表示不限制"
        />
        <span class="field-unit">MB</span>
        <div class="resource-help">限制为 0 则关闭限制，单位为 MB。</div>
      </el-form-item>

      <el-divider content-position="left">Labels 与环境变量</el-divider>
      <el-form-item label="Labels">
        <el-input
          v-model="form.labelsText"
          type="textarea"
          :rows="2"
          placeholder="请输入 Labels，每行一个 key=value，或 JSON 对象"
        />
        <div class="field-help">Docker Labels 键值对，提交为 object。</div>
      </el-form-item>
      <el-form-item label="环境变量">
        <el-input
          v-model="form.environmentText"
          type="textarea"
          :rows="2"
          placeholder="请输入环境变量，每行一个 KEY=value；敏感值不会在列表中回显"
        />
        <div class="field-help">环境变量键值对，前端不会在普通列表中回显敏感值。</div>
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

  :deep(.el-divider) {
    margin: 26px 0 20px;
  }

  :deep(.el-divider__text) {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 760;
  }

  :deep(.resource-limit-input) {
    width: calc(100% - 82px);
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
    height: 34px;
    margin-right: 0;
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

  :deep(.el-segmented) {
    --el-segmented-item-selected-bg-color: rgb(var(--primary-color));
    --el-segmented-item-selected-color: #fff;
    padding: 0;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
  }

  :deep(.el-segmented__item) {
    min-width: 88px;
    height: 34px;
    border-radius: 5px;
    font-weight: 700;
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
