<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

import { Api } from "@/api/modules";
import { useConfigStore } from "@/stores/modules/config";
import i18n from "@/lang";

const sconfig = useConfigStore()

interface BackupInfo {
  id: string;
  fileName: string;
  createdAt: string;
  panelVersion: string;
  size: number;
  sha256: string;
  fileCount: number;
  includesCertificates: boolean;
  imported: boolean;
}

interface RestoreStatus {
  state: string;
  backupId?: string;
  message?: string;
  rollbackAttempted: boolean;
  rollbackSucceeded: boolean;
  startedAt?: string;
  updatedAt: string;
  finishedAt?: string;
}

type DialogMode = "create" | "import" | "restore";

const backups = ref<BackupInfo[]>([]);
const status = ref<RestoreStatus>({
  state: "idle",
  rollbackAttempted: false,
  rollbackSucceeded: false,
  updatedAt: "",
});
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const selectedBackup = ref<BackupInfo>();
const importFile = ref<File>();
let reconnectTimer: number | undefined;

const t = (key: string, fallback: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params);
  return value && value !== key ? value : fallback;
};

const form = reactive({
  passphrase: "",
  confirmPassphrase: "",
  confirmation: "",
  includeCertificates: true,
});

const stateNames = computed<Record<string, string>>(() => ({
  idle: t("setting.backup.states.idle", "No restore executed"),
  validating: t("setting.backup.states.validating", "Restore precheck"),
  stopping: t("setting.backup.states.stopping", "Stopping services"),
  restoring: t("setting.backup.states.restoring", "Restoring data"),
  health_checking: t("setting.backup.states.healthChecking", "Health checking"),
  succeeded: t("setting.backup.states.succeeded", "Restore succeeded"),
  failed: t("setting.backup.states.failed", "Restore failed"),
  rolled_back: t(
    "setting.backup.states.rolledBack",
    "Automatically rolled back",
  ),
  rollback_failed: t("setting.backup.states.rollbackFailed", "Rollback failed"),
}));

const activeStates = ["validating", "stopping", "restoring", "health_checking"];
const restoreRunning = computed(() =>
  activeStates.includes(status.value.state),
);
const statusType = computed(() => {
  if (status.value.state === "succeeded") return "success";
  if (status.value.state === "rolled_back") return "warning";
  if (
    status.value.state === "failed" ||
    status.value.state === "rollback_failed"
  )
    return "danger";
  return "info";
});
const dialogTitle = computed(() => {
  if (dialogMode.value === "import")
    return t("setting.backup.importEncryptedBackup", "Import encrypted backup");
  if (dialogMode.value === "restore")
    return t(
      "setting.backup.restoreBackupTitle",
      "Restore backup · {version}",
      {
        version:
          selectedBackup.value?.panelVersion ||
          t("setting.backup.unknownVersion", "Unknown version"),
      },
    );
  return t("setting.backup.createPanelBackup", "Create Panel backup");
});

const formatBytes = (value: number) => {
  if (!value) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const loadData = async (quiet = false) => {
  if (!quiet) loading.value = true;
  try {
    const [backupResponse, statusResponse] = await Promise.all([
      Api.getPanelBackups(),
      Api.getPanelRestoreStatus(),
    ]);
    backups.value = backupResponse.data?.backups || [];
    status.value = statusResponse.data || status.value;
  } finally {
    if (!quiet) loading.value = false;
  }
};

const resetDialog = () => {
  form.passphrase = "";
  form.confirmPassphrase = "";
  form.confirmation = "";
  form.includeCertificates = true;
  importFile.value = undefined;
  selectedBackup.value = undefined;
};

const openDialog = (mode: DialogMode, backup?: BackupInfo) => {
  resetDialog();
  dialogMode.value = mode;
  selectedBackup.value = backup;
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  resetDialog();
};

const dialogConfirmText = computed(() => {
  if (dialogMode.value === "restore")
    return t("setting.backup.precheckAndRestore", "Precheck and restore");
  if (dialogMode.value === "import")
    return t("setting.backup.verifyAndImport", "Verify and import");
  return t("setting.backup.createBackup", "Create backup");
});

const selectImportFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  importFile.value = input.files?.[0];
};

const validatePassphrase = () => {
  const length = new TextEncoder().encode(form.passphrase).length;
  if (length < 12 || length > 256) {
    ElMessage.warning(
      t(
        "setting.backup.passphraseLengthWarning",
        "Backup password must contain 12-256 bytes",
      ),
    );
    return false;
  }
  return true;
};

const importBackup = async () => {
  if (!importFile.value) {
    ElMessage.warning(
      t("setting.backup.selectOnebakFile", "Select a .onebak backup file"),
    );
    return;
  }
  if (!importFile.value.name.toLowerCase().endsWith(".onebak")) {
    ElMessage.warning(
      t(
        "setting.backup.onlyOnebakSupported",
        "Only .onebak backup files are supported",
      ),
    );
    return;
  }
  const payload = new FormData();
  payload.append("passphrase", form.passphrase);
  payload.append("backup", importFile.value);
  await Api.importPanelBackup(payload);
};

const submitDialog = async () => {
  if (!validatePassphrase() || submitting.value) return;
  if (
    dialogMode.value === "create" &&
    form.passphrase !== form.confirmPassphrase
  ) {
    ElMessage.warning(
      t(
        "setting.backup.passphraseMismatch",
        "The two backup passwords do not match",
      ),
    );
    return;
  }
  if (dialogMode.value === "restore" && form.confirmation !== "RESTORE PANEL") {
    ElMessage.warning(
      t(
        "setting.backup.confirmationRequired",
        "Confirmation text must be RESTORE PANEL",
      ),
    );
    return;
  }

  submitting.value = true;
  try {
    if (dialogMode.value === "create") {
      await Api.createPanelBackup({
        passphrase: form.passphrase,
        includeCertificates: form.includeCertificates,
      });
      ElMessage.success(
        t("setting.backup.createSuccess", "Encrypted backup created"),
      );
    } else if (dialogMode.value === "import") {
      await importBackup();
      ElMessage.success(
        t(
          "setting.backup.importSuccess",
          "Backup imported and integrity verified",
        ),
      );
    } else if (selectedBackup.value) {
      await Api.preflightPanelBackup(selectedBackup.value.id, {
        passphrase: form.passphrase,
      });
      await Api.restorePanelBackup(selectedBackup.value.id, {
        passphrase: form.passphrase,
        confirm: form.confirmation,
      });
      ElMessage.success(
        t(
          "setting.backup.restoreStarted",
          "Restore task started. The panel will be briefly offline.",
        ),
      );
      beginReconnectPolling();
    }
    dialogVisible.value = false;
    resetDialog();
    if (dialogMode.value !== "restore") await loadData(true);
  } catch (error: any) {
    // ElMessage.error(
    //   error?.message || t("common.operationFailed", "Operation failed"),
    // );
  } finally {
    submitting.value = false;
  }
};

const downloadBackup = async (backup: BackupInfo) => {
  await Api.downloadPanelBackup(backup.id, backup.fileName);
};

const deleteBackup = async (backup: BackupInfo) => {
  try {
    await ElMessageBox.confirm(
      t(
        "setting.backup.deleteConfirmMessage",
        "{fileName} will be permanently deleted. If there is no other copy, it cannot be restored.",
        { fileName: backup.fileName },
      ),
      t("setting.backup.deleteBackup", "Delete backup"),
      {
        type: "warning",
        confirmButtonText: t(
          "setting.backup.permanentlyDelete",
          "Permanently delete",
        ),
        cancelButtonText: t("common.cancel", "Cancel"),
      },
    );
    await Api.deletePanelBackup(backup.id);
    ElMessage.success(t("setting.backup.deleteSuccess", "Backup deleted"));
    await loadData(true);
  } catch (error) {
    if (error !== "cancel" && error !== "close")
      ElMessage.error(
        t("setting.backup.deleteFailed", "Failed to delete backup"),
      );
  }
};

const beginReconnectPolling = () => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  const poll = async () => {
    try {
      const { data } = await Api.getPanelRestoreStatus({
        silentError: true,
        ignoreUnauthorizedLogout: true,
      });
      status.value = data;
      if (!activeStates.includes(status.value.state)) {
        ElMessage.success(
          status.value.state === "succeeded"
            ? t(
                "setting.backup.restoreCompleted",
                "Panel data restore completed",
              )
            : status.value.message ||
                t("setting.backup.restoreTaskEnded", "Restore task ended"),
        );
        await loadData(true);
        return;
      }
    } catch (error: any) {
      if (error?.status === 401) {
        ElMessage.warning(
          t(
            "setting.backup.sessionLostAfterRestore",
            "The restored database did not retain the current session. Sign in again to view the restore result.",
          ),
        );
        sconfig.logout(true);
        return;
      }
      // 恢复期间主服务可能短暂不可用，继续静默重连。
    }
    reconnectTimer = window.setTimeout(poll, 2500);
  };
  reconnectTimer = window.setTimeout(poll, 3000);
};

onMounted(() => {
  loadData().then(() => {
    if (restoreRunning.value) beginReconnectPolling();
  });
});

onBeforeUnmount(() => {
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
});
</script>

<template>
  <section class="backup-card" v-loading="loading">
    <div class="backup-card__header">
      <div>
        <div class="backup-card__title">{{ $t("setting.backup.title") }}</div>
        <div class="backup-card__subtitle">
          {{ $t("setting.backup.description") }}
        </div>
      </div>
      <div class="backup-card__actions">
        <el-tag size="small" type="warning">{{
          $t("setting.backup.mediumRisk")
        }}</el-tag>
        <el-button
          type="warning"
          plain
          :disabled="restoreRunning"
          @click="openDialog('import')"
          >{{ $t("setting.backup.importBackup") }}</el-button
        >
        <el-button
          type="warning"
          :disabled="restoreRunning"
          @click="openDialog('create')"
        >
          {{ $t("setting.backup.createBackup") }}
        </el-button>
      </div>
    </div>

    <div class="restore-status" :class="`is-${statusType}`">
      <div>
        <span class="restore-status__label">{{
          $t("setting.backup.latestRestoreStatus")
        }}</span>
        <strong>{{ stateNames[status.state] || status.state }}</strong>
        <small v-if="status.message">{{ status.message }}</small>
      </div>
      <el-tag :type="statusType">{{
        restoreRunning
          ? $t("setting.backup.taskRunning")
          : $t("setting.backup.noRestoreTask")
      }}</el-tag>
    </div>

    <div v-if="backups.length" class="backup-list">
      <article v-for="backup in backups" :key="backup.id" class="backup-item">
        <div class="backup-item__main">
          <div class="backup-item__icon">B</div>
          <div class="backup-item__identity">
            <div class="backup-item__name">
              {{ backup.fileName }}
              <el-tag v-if="backup.imported" size="small" type="info">{{
                $t("setting.backup.imported")
              }}</el-tag>
              <el-tag
                v-if="backup.includesCertificates"
                size="small"
                type="success"
                >{{ $t("setting.backup.includesCertificates") }}</el-tag
              >
            </div>
            <div class="backup-item__meta">
              Panel {{ backup.panelVersion }} · {{ formatBytes(backup.size) }} ·
              {{
                $t("setting.backup.fileCount", { count: backup.fileCount })
              }}
              · {{ formatDate(backup.createdAt) }}
            </div>
            <div class="backup-item__digest">SHA-256 {{ backup.sha256 }}</div>
          </div>
        </div>
        <div class="backup-item__actions">
          <el-button link @click="downloadBackup(backup)">{{
            $t("common.download")
          }}</el-button>
          <el-button
            link
            type="primary"
            :disabled="restoreRunning"
            @click="openDialog('restore', backup)"
          >
            {{ $t("setting.backup.restore") }}
          </el-button>
          <el-button
            link
            type="danger"
            :disabled="restoreRunning"
            @click="deleteBackup(backup)"
          >
            {{ $t("common.delete") }}
          </el-button>
        </div>
      </article>
    </div>
    <el-empty
      v-else
      :description="$t('setting.backup.empty')"
      :image-size="86"
    />

    <custom-drawer
      :visible="dialogVisible"
      :title="dialogTitle"
      size="560px"
      :confirm-text="dialogConfirmText"
      :loading="submitting"
      destroy-on-close
      :on-close="closeDialog"
      :on-confirm="submitDialog"
    >
      <el-alert
        v-if="dialogMode === 'restore'"
        :title="$t('setting.backup.restoreRiskTip')"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else-if="dialogMode === 'create'"
        :title="$t('setting.backup.createRiskTip')"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else
        :title="$t('setting.backup.importRiskTip')"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form class="backup-form" label-position="top">
        <el-form-item
          v-if="dialogMode === 'import'"
          :label="$t('setting.backup.backupFile')"
        >
          <input
            class="file-input"
            type="file"
            accept=".onebak"
            @change="selectImportFile"
          />
        </el-form-item>
        <el-form-item :label="$t('setting.backup.backupPassphrase')">
          <el-input
            v-model="form.passphrase"
            type="password"
            show-password
            autocomplete="off"
            :placeholder="$t('setting.backup.passphrasePlaceholder')"
          />
        </el-form-item>
        <el-form-item
          v-if="dialogMode === 'create'"
          :label="$t('setting.backup.confirmPassphrase')"
        >
          <el-input
            v-model="form.confirmPassphrase"
            type="password"
            show-password
            autocomplete="off"
            :placeholder="$t('setting.backup.confirmPassphrasePlaceholder')"
          />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'create'">
          <el-checkbox v-model="form.includeCertificates">{{
            $t("setting.backup.includeCertificateDirectory")
          }}</el-checkbox>
        </el-form-item>
        <el-form-item
          v-if="dialogMode === 'restore'"
          :label="$t('setting.backup.operationConfirm')"
        >
          <el-input
            v-model="form.confirmation"
            autocomplete="off"
            :placeholder="$t('setting.backup.operationConfirmPlaceholder')"
          />
        </el-form-item>
      </el-form>
    </custom-drawer>
  </section>
</template>

<style scoped lang="less">
.backup-card {
  padding-top: 28px;
  margin-top: 28px;
  border-top: 1px solid var(--border-subtle);
}

.backup-card__header,
.backup-card__actions,
.backup-item,
.backup-item__main,
.backup-item__actions,
.restore-status {
  display: flex;
  align-items: center;
}

.backup-card__header,
.backup-item,
.restore-status {
  justify-content: space-between;
}

.backup-card__header {
  gap: 20px;
}

.backup-card__actions,
.backup-item__actions {
  gap: 8px;
  flex-shrink: 0;
}

.backup-card__title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 650;
}

.backup-card__subtitle {
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.restore-status {
  gap: 16px;
  padding: 15px 18px;
  margin: 20px 0 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-subtle);

  span,
  strong,
  small {
    display: block;
  }

  strong {
    margin-top: 4px;
    color: var(--text-primary);
    font-size: 14px;
  }

  small {
    margin-top: 4px;
    color: var(--text-tertiary);
  }
}

.restore-status__label {
  color: var(--text-tertiary);
  font-size: 11px;
}

.backup-list {
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
}

.backup-item {
  gap: 20px;
  padding: 17px 18px;
  background: var(--surface-card);

  & + & {
    border-top: 1px solid var(--border-subtle);
  }
}

.backup-item__main {
  min-width: 0;
  gap: 14px;
}

.backup-item__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid rgba(255, 106, 31, 0.2);
  border-radius: 11px;
  color: var(--el-color-primary);
  background: rgba(255, 106, 31, 0.08);
  font-weight: 700;
}

.backup-item__identity {
  min-width: 0;
}

.backup-item__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  overflow-wrap: anywhere;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
}

.backup-item__meta,
.backup-item__digest {
  margin-top: 5px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.backup-item__digest {
  overflow: hidden;
  max-width: 560px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-form {
  margin-top: 18px;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--surface-subtle);
}

@media (max-width: 760px) {
  .backup-card__header,
  .backup-item,
  .restore-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .backup-card__actions,
  .backup-item__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
