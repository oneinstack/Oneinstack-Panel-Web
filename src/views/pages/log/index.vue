<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Api } from "@/api/modules";
import { ElMessage } from "element-plus";
import { View } from "@element-plus/icons-vue";
import i18n from "@/lang";
import type { ColumnItem } from "@/components/custom-table.vue";
import { hasOperationAccess } from '@/utils/access'

interface AuditEvent {
  id: number;
  sequence: number;
  requestId: string;
  eventType: string;
  action: string;
  method: string;
  route: string;
  path: string;
  status: number;
  outcome: "success" | "failure";
  sensitive: boolean;
  userId: number;
  username: string;
  authMode: string;
  remoteIp: string;
  userAgent: string;
  contentLength: number;
  durationMs: number;
  message: string;
  createdAt: string;
  previousHash: string;
  entryHash: string;
  chainVersion: number;
}

interface AuditStats {
  counts: {
    total: number;
    success: number;
    failure: number;
    sensitive: number;
    last24Hours: number;
    latestSequence: number;
  };
  retentionDays: number;
  cleanupSchedule: string;
  exportMaxRows: number;
}

const t = (key: string, fallback?: string, params?: Record<string, any>) => {
  const value = (i18n.t as any)(key, params);
  return value && value !== key ? value : fallback || key;
};

const loading = ref(false);
const verifying = ref(false);
const exporting = ref(false);
const canReadAudit = computed(() => hasOperationAccess('audit', 'read', {
  actions: ['audit.read', 'audit.log.read']
}))
const events = ref<AuditEvent[]>([]);
const total = ref(0);
const detail = ref<AuditEvent | null>(null);
const detailVisible = ref(false);
const dateRange = ref<[Date, Date] | undefined>();
const verification = ref<any>(null);
const stats = ref<AuditStats>({
  counts: {
    total: 0,
    success: 0,
    failure: 0,
    sensitive: 0,
    last24Hours: 0,
    latestSequence: 0,
  },
  retentionDays: 0,
  cleanupSchedule: "",
  exportMaxRows: 0,
});
const filters = reactive({
  page: 1,
  pageSize: 20,
  q: "",
  username: "",
  outcome: "",
  method: "",
  sensitive: "",
});
const columns = computed<ColumnItem<AuditEvent>[]>(() => [
  { prop: "sequence", label: t("audit.sequence"), minWidth: 92, slot: "sequence" },
  {
    prop: "createdAt",
    label: t("common.time"),
    minWidth: 170,
    slot: "createdAt",
  },
  { prop: "username", label: t("common.user"), minWidth: 120, slot: "username" },
  {
    prop: "action",
    label: t("approvalCenter.action"),
    minWidth: 220,
    showOverflowTooltip: true,
  },
  {
    prop: "message",
    label: t("audit.messageCommand"),
    minWidth: 220,
    showOverflowTooltip: true,
    slot: "message",
  },
  {
    prop: "remoteIp",
    label: t("audit.remoteIp"),
    minWidth: 135,
    slot: "remoteIp",
  },
  {
    prop: "result",
    label: t("audit.result"),
    minWidth: 108,
    align: "center",
    slot: "result",
  },
  {
    prop: "level",
    label: t("audit.level"),
    minWidth: 108,
    align: "center",
    slot: "level",
  },
  {
    prop: "durationMs",
    label: t("audit.duration"),
    minWidth: 90,
    align: "right",
    slot: "durationMs",
  },
  {
    prop: "actionColumn",
    label: t("common.action"),
    minWidth: 110,
    fixed: "right",
    slot: "actionColumn",
    className: "table-action-column",
  },
]);

const queryParams = (includePage = true) => {
  const params: Record<string, any> = {
    q: filters.q || undefined,
    username: filters.username || undefined,
    outcome: filters.outcome || undefined,
    method: filters.method || undefined,
    sensitive: filters.sensitive || undefined,
    startAt: dateRange.value?.[0]?.toISOString(),
    endAt: dateRange.value?.[1]?.toISOString(),
  };
  if (includePage) {
    params.page = filters.page;
    params.pageSize = filters.pageSize;
  }
  return params;
};

const loadEvents = async () => {
  if (!canReadAudit.value) {
    events.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const { data } = await Api.getAuditEvents(queryParams());
    events.value = data?.items || [];
    total.value = data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  if (!canReadAudit.value) return
  const { data } = await Api.getAuditStats();
  stats.value = data;
};

const search = () => {
  filters.page = 1;
  void loadEvents();
};

const reset = () => {
  Object.assign(filters, {
    page: 1,
    pageSize: 20,
    q: "",
    username: "",
    outcome: "",
    method: "",
    sensitive: "",
  });
  dateRange.value = undefined;
  void loadEvents();
};

const showDetail = async (row: AuditEvent) => {
  if (!canReadAudit.value) return
  const { data } = await Api.getAuditEvent(row.id);
  detail.value = data;
  detailVisible.value = true;
};

const verifyChain = async () => {
  if (!canReadAudit.value) return
  verifying.value = true;
  try {
    const { data } = await Api.verifyAuditChain();
    verification.value = data;
    if (data.valid)
      ElMessage.success(
        t(
          "audit.chainValidMessage",
          `Audit chain is valid. ${data.checkedEntries} records verified.`,
          { count: data.checkedEntries },
        ),
      );
    else
      // ElMessage.error(
      //   t(
      //     "audit.chainInvalidMessage",
      //     `Audit chain verification failed: ${data.message}`,
      //     { message: data.message },
      //   ),
      // );
    await Promise.all([loadEvents(), loadStats()]);
  } finally {
    verifying.value = false;
  }
};

const exportEvents = async () => {
  if (!canReadAudit.value) return
  exporting.value = true;
  try {
    await Api.exportAuditEvents(
      queryParams(false),
      `oneinstack-audit-${Date.now()}.csv`,
    );
    ElMessage.success(t("audit.exportSuccess", "Audit logs exported"));
    await Promise.all([loadEvents(), loadStats()]);
  } catch (error: any) {
    // ElMessage.error(
    //   error?.message || t("audit.exportFailed", "Failed to export audit logs"),
    // );
  } finally {
    exporting.value = false;
  }
};

const formatTime = (value?: string) =>
  value ? new Date(value).toLocaleString() : "—";

onMounted(async () => {
  await Promise.all([loadEvents(), loadStats()]);
});
</script>

<template>
  <div class="audit-page">
    <div class="page-heading">
      <div>
        <h2>{{ $t("audit.title") }}</h2>
        <p>{{ $t("audit.fullDescription") }}</p>
      </div>
      <div class="heading-actions">
        <el-button v-if="canReadAudit" :loading="verifying" @click="verifyChain">{{
          $t("audit.verifyIntegrity")
        }}</el-button>
        <el-button v-if="canReadAudit" type="primary" :loading="exporting" @click="exportEvents">{{
          $t("audit.exportCsv")
        }}</el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>{{ $t("audit.currentRetention") }}</span>
        <strong>{{ stats.counts.total }}</strong>
        <small>{{
          $t("audit.latestSequence", {
            sequence: stats.counts.latestSequence || 0,
          })
        }}</small>
      </div>
      <div class="stat-card success">
        <span>{{ $t("audit.successfulOperations") }}</span>
        <strong>{{ stats.counts.success }}</strong>
        <small>{{
          $t("audit.last24HoursCount", { count: stats.counts.last24Hours })
        }}</small>
      </div>
      <div class="stat-card danger">
        <span>{{ $t("audit.failedRequests") }}</span>
        <strong>{{ stats.counts.failure }}</strong>
        <small>{{ $t("audit.failedRequestsHint") }}</small>
      </div>
      <div class="stat-card warning">
        <span>{{ $t("audit.sensitiveOperations") }}</span>
        <strong>{{ stats.counts.sensitive }}</strong>
        <small>{{
          $t("audit.retentionDays", { days: stats.retentionDays || "—" })
        }}</small>
      </div>
    </div>

    <el-alert
      v-if="verification"
      class="integrity-alert"
      :type="verification.valid ? 'success' : 'error'"
      :closable="false"
      show-icon
      :title="
        verification.valid ? $t('audit.chainValid') : $t('audit.chainInvalid')
      "
      :description="
        $t('audit.chainDescription', {
          message: verification.message,
          count: verification.checkedEntries,
          sequence: verification.checkpointSequence || 0,
        })
      "
    />

    <div class="audit-panel">
      <div class="filters">
        <el-input
          class="filter-query"
          v-model="filters.q"
          clearable
          :placeholder="$t('audit.requestSearchPlaceholder')"
          @keyup.enter="search"
        />
        <el-input
          class="filter-user"
          v-model="filters.username"
          clearable
          :placeholder="$t('audit.operatorPlaceholder')"
          @keyup.enter="search"
        />
        <el-select
          class="filter-select"
          v-model="filters.outcome"
          clearable
          :placeholder="$t('audit.outcome')"
        >
          <el-option :label="$t('common.success')" value="success" />
          <el-option :label="$t('common.failed')" value="failure" />
        </el-select>
        <el-select
          class="filter-select"
          v-model="filters.method"
          clearable
          :placeholder="$t('audit.method')"
        >
          <el-option
            v-for="method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'PTY']"
            :key="method"
            :label="method"
            :value="method"
          />
        </el-select>
        <el-select
          class="filter-select"
          v-model="filters.sensitive"
          clearable
          :placeholder="$t('audit.sensitiveLevel')"
        >
          <el-option :label="$t('audit.sensitiveOperations')" value="true" />
          <el-option :label="$t('audit.normalOperation')" value="false" />
        </el-select>
        <div class="filter-date">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            :start-placeholder="$t('audit.startTime')"
            :end-placeholder="$t('audit.endTime')"
            :range-separator="$t('audit.rangeSeparator')"
          />
        </div>
        <el-button class="filter-action" type="primary" @click="search">{{
          $t("common.query")
        }}</el-button>
        <el-button class="filter-action" @click="reset">{{
          $t("common.reset")
        }}</el-button>
      </div>

      <custom-table
        v-loading="loading"
        :data="events"
        :columns="columns"
        table-layout="auto"
        :pagination="false"
        :auto-pagination="false"
        border
        row-key="id"
        @row-dblclick="showDetail"
      >
        <template #sequence="{ row }">#{{ row.sequence }}</template>
        <template #createdAt="{ row }">{{
          formatTime(row.createdAt)
        }}</template>
        <template #username="{ row }">{{
          row.username || $t("common.unauthenticated")
        }}</template>
        <template #message="{ row }">{{ row.message || "—" }}</template>
        <template #remoteIp="{ row }">{{ row.remoteIp || "—" }}</template>
        <template #result="{ row }">
          <el-tag
            class="audit-result-tag"
            :type="row.outcome === 'success' ? 'success' : 'danger'"
            size="small"
            effect="light"
          >
            {{ row.status }}
            {{
              row.outcome === "success"
                ? $t("common.success")
                : $t("common.failed")
            }}
          </el-tag>
        </template>
        <template #level="{ row }">
          <el-tag v-if="row.sensitive" class="audit-level-tag" type="warning" size="small" effect="light">{{
            $t("common.sensitive")
          }}</el-tag>
          <el-tag v-else class="audit-level-tag audit-level-tag--normal" type="success" size="small" effect="light">
            {{ $t("common.normal") }}
          </el-tag>
        </template>
        <template #durationMs="{ row }">{{ row.durationMs }} ms</template>
        <template #actionColumn="{ row }">
          <el-button
            v-if="canReadAudit"
            link
            type="primary"
            :icon="View"
            @click="showDetail(row)"
            >{{ $t("common.detail") }}</el-button
          >
        </template>
        <template #empty>
          <el-empty :description="$t('audit.noRecords')" />
        </template>
      </custom-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="filters.page"
          v-model:page-size="filters.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @current-change="loadEvents"
          @size-change="search"
        />
      </div>
      <div class="policy-note">
        {{
          $t("audit.cleanupPolicy", {
            schedule: stats.cleanupSchedule || "—",
            maxRows: stats.exportMaxRows || "—",
          })
        }}
      </div>
    </div>

    <custom-drawer
      :visible="detailVisible"
      :title="$t('audit.detailTitle')"
      size="640px"
      :show-footer="false"
      :on-close="
        () => {
          detailVisible = false;
        }
      "
    >
      <div v-if="detail" class="audit-detail">
        <section class="audit-detail__hero">
          <div class="audit-detail__hero-main">
            <span class="audit-detail__eyebrow">
              {{ $t("audit.sequence") }} #{{ detail.sequence }}
            </span>
            <h3>{{ detail.action }}</h3>
            <p>{{ detail.route || detail.path }}</p>
          </div>
          <div class="audit-detail__hero-side">
            <div
              class="audit-detail__status"
              :class="`is-${detail.outcome}`"
            >
              {{ detail.status }} / {{ detail.outcome }}
            </div>
            <div class="audit-detail__meta">
              <span>{{ formatTime(detail.createdAt) }}</span>
              <span>{{ detail.durationMs }} ms</span>
            </div>
          </div>
        </section>

        <el-descriptions
          class="audit-detail-descriptions"
          :column="2"
          border
        >
          <el-descriptions-item :label="$t('common.user')"
            >{{ detail.username || $t("common.unauthenticated") }}（ID
            {{ detail.userId || 0 }}）</el-descriptions-item
          >
          <el-descriptions-item :label="$t('audit.authMode')">{{
            detail.authMode || "—"
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('common.time')">{{
            formatTime(detail.createdAt)
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.duration')"
            >{{ detail.durationMs }} ms</el-descriptions-item
          >
          <el-descriptions-item :label="$t('audit.result')"
            >{{ detail.status }} / {{ detail.outcome }}</el-descriptions-item
          >
          <el-descriptions-item :label="$t('audit.requestSize')"
            >{{ detail.contentLength }} bytes</el-descriptions-item
          >
          <el-descriptions-item :label="$t('audit.remoteIp')">{{
            detail.remoteIp || "—"
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.sequence')"
            >#{{ detail.sequence }}</el-descriptions-item
          >
          <el-descriptions-item :label="$t('approvalCenter.action')" :span="2">{{
            detail.action
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.route')" :span="2">{{
            detail.route || detail.path
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.requestId')" :span="2"
            ><code class="detail-code">{{ detail.requestId }}</code></el-descriptions-item
          >
          <el-descriptions-item :label="$t('audit.userAgent')" :span="2">{{
            detail.userAgent || "—"
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('common.description')" :span="2">{{
            detail.message || "—"
          }}</el-descriptions-item>
          <el-descriptions-item :label="$t('audit.previousHash')" :span="2"
            ><code class="detail-code hash">{{
              detail.previousHash
            }}</code></el-descriptions-item
          >
          <el-descriptions-item :label="$t('audit.entryHash')" :span="2"
            ><code class="detail-code hash">{{
              detail.entryHash
            }}</code></el-descriptions-item
          >
        </el-descriptions>
      </div>
    </custom-drawer>
  </div>
</template>

<style scoped lang="less">
.audit-page {
  padding-bottom: 28px;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 6px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.035em;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
    line-height: 1.6;
  }
}

.heading-actions {
  display: flex;
  flex-shrink: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.stat-card {
  min-height: 102px;
  padding: 18px 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 15px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--primary-color), 0.26);
    box-shadow: var(--shadow-sm);
  }

  span,
  small {
    color: var(--text-tertiary);
  }

  strong {
    margin: 6px 0;
    font-size: 28px;
    line-height: 1;
  }

  &.success strong {
    color: #37a878;
  }
  &.danger strong {
    color: #e25d5d;
  }
  &.warning strong {
    color: #d89532;
  }

  &.success:hover {
    border-color: color-mix(in srgb, rgb(var(--success-color)) 28%, var(--border-subtle));
  }

  &.danger:hover {
    border-color: color-mix(in srgb, var(--el-color-danger) 28%, var(--border-subtle));
  }

  &.warning:hover {
    border-color: color-mix(in srgb, var(--el-color-warning) 28%, var(--border-subtle));
  }
}

.integrity-alert {
  margin-bottom: 14px;
}

.audit-panel {
  padding: 20px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}

.filters {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 10px;
  align-items: center;
  margin-bottom: 18px;

  > * {
    min-width: 0;
    width: 100%;
  }

  .filter-query,
  .filter-user {
    grid-column: span 2;
  }

  .filter-select,
  .filter-action {
    grid-column: span 1;
  }

  .filter-action {
    margin-left: 0;
  }

  .filter-date {
    grid-column: span 3;
  }

  :deep(.el-date-editor) {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 1600px) {
  .filters {
    grid-template-columns: repeat(6, minmax(0, 1fr));

    .filter-query {
      grid-column: span 2;
    }

    .filter-user,
    .filter-select,
    .filter-action {
      grid-column: span 1;
    }

    .filter-date {
      grid-column: span 3;
    }
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.policy-note {
  margin-top: 14px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: right;
}

.audit-result-tag,
.audit-level-tag {
  min-width: 76px;
  justify-content: center;
  white-space: nowrap;
}

.audit-level-tag--normal {
  --el-tag-bg-color: rgba(34, 197, 94, 0.1);
  --el-tag-border-color: rgba(34, 197, 94, 0.2);
  --el-tag-text-color: #238b57;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.hash {
  word-break: break-all;
}

.audit-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.audit-detail__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border: 1px solid color-mix(in srgb, var(--border-subtle) 84%, transparent);
  border-radius: 18px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-card) 96%, white 4%) 0%,
      color-mix(in srgb, var(--surface-page) 78%, transparent) 100%
    );
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.audit-detail__hero-main {
  min-width: 0;

  h3 {
    margin: 8px 0 6px;
    color: var(--text-primary);
    font-size: 22px;
    font-weight: 780;
    line-height: 1.25;
  }

  p {
    margin: 0;
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.6;
    word-break: break-all;
  }
}

.audit-detail__eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  color: rgb(var(--primary-color));
  font-size: 12px;
  font-weight: 700;
  background: color-mix(in srgb, rgb(var(--primary-color)) 12%, transparent);
  border: 1px solid color-mix(in srgb, rgb(var(--primary-color)) 24%, transparent);
}

.audit-detail__hero-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.audit-detail__status {
  min-height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid transparent;

  &.is-success {
    color: #15803d;
    background: rgba(34, 197, 94, 0.12);
    border-color: rgba(34, 197, 94, 0.22);
  }

  &.is-failure {
    color: #dc2626;
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.22);
  }
}

.audit-detail__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;

  span {
    color: var(--text-tertiary);
    font-size: 12px;
    white-space: nowrap;
  }
}

.audit-detail-descriptions {
  :deep(.el-descriptions) {
    border-radius: 18px;
    overflow: hidden;
    background: #f8fafc;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  }

  :deep(.el-descriptions__table) {
    border-collapse: separate;
  }

  :deep(.el-descriptions__body),
  :deep(.el-descriptions__table.is-bordered),
  :deep(.el-descriptions__cell) {
    border-color: rgba(148, 163, 184, 0.18) !important;
  }

  :deep(.el-descriptions__label) {
    width: 104px;
    color: #475569;
    font-weight: 700;
    background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  }

  :deep(.el-descriptions__content) {
    color: #0f172a;
    line-height: 1.65;
    word-break: break-word;
    background: rgba(255, 255, 255, 0.96);
  }

  :deep(.el-descriptions__cell) {
    padding-top: 16px;
    padding-bottom: 16px;
  }
}

.detail-code {
  display: block;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  color: #0f172a;
  font-size: 12px;
  line-height: 1.7;
  background:
    linear-gradient(
      180deg,
      #f8fafc 0%,
      #eff6ff 100%
    );
}

@media (max-width: 1350px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters {
    grid-template-columns: repeat(3, minmax(150px, 1fr));

    .filter-query,
    .filter-user,
    .filter-select,
    .filter-date,
    .filter-action {
      grid-column: auto;
    }
  }
}

@media (max-width: 760px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid,
  .filters {
    grid-template-columns: 1fr;
  }

  .audit-panel {
    padding: 12px;
  }

  .audit-detail__hero {
    flex-direction: column;
  }

  .audit-detail__hero-side,
  .audit-detail__meta {
    align-items: flex-start;
  }

  .audit-detail-descriptions {
    :deep(.el-descriptions) {
      display: block;
    }
  }
}
</style>
