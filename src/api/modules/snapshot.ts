import http, { HttpRequestError } from "@/api";
import type {
  CreateConfigurationSnapshotPayload,
  SnapshotListParams,
} from "../types";

export const snapshotApi = {
  /** 分页查询配置快照 */
  getConfigurationSnapshots: (obj?: SnapshotListParams) => {
    return http.get("/config-snapshots", obj);
  },
  /** 手动创建配置快照 */
  createConfigurationSnapshot: (obj: CreateConfigurationSnapshotPayload) => {
    return http.post("/config-snapshots", obj);
  },
  /** 按资源类型读取可创建快照的资源列表 */
  getConfigurationSnapshotResources: (resourceType: string) => {
    return http.get(
      `/config-snapshots/resources/${encodeURIComponent(resourceType)}`,
    );
  },
  /** 查询配置快照详情 */
  getConfigurationSnapshot: (id: string) => {
    return http.get(`/config-snapshots/${encodeURIComponent(id)}`);
  },
  /** 查询配置快照差异 */
  getConfigurationSnapshotDiff: (id: string) => {
    return http.get(`/config-snapshots/${encodeURIComponent(id)}/diff`);
  },
  /** 预览配置快照回滚 */
  previewConfigurationSnapshotRestore: (id: string) => {
    return http.post(
      `/config-snapshots/${encodeURIComponent(id)}/restore/preview`,
      {},
    );
  },
  /** 执行配置快照回滚 */
  restoreConfigurationSnapshot: (
    id: string,
    force: boolean | { force: boolean },
  ) => {
    return http.post(
      `/config-snapshots/${encodeURIComponent(id)}/restore`,
      typeof force === "boolean" ? { force } : force,
    );
  },
  /** 分页查询配置快照 */
  listSnapshots: (params: SnapshotListParams) => {
    return http.get("/config-snapshots", params);
  },
  /** 查询配置快照详情 */
  getSnapshot: (id: string) => {
    return http.get(`/config-snapshots/${encodeURIComponent(id)}`);
  },
  /** 预览配置快照回滚 */
  previewRestore: (id: string) => {
    return http.post(
      `/config-snapshots/${encodeURIComponent(id)}/restore/preview`,
      {},
    );
  },
  /** 执行配置快照回滚 */
  restoreSnapshot: (id: string, force: boolean) => {
    return http.post(`/config-snapshots/${encodeURIComponent(id)}/restore`, {
      force,
    });
  },
  /** 删除配置快照 */
  deleteConfigurationSnapshot: async (id: string) => {
    const snapshotId = encodeURIComponent(id);
    try {
      return await http.delete(`/config-snapshots/${snapshotId}`, undefined, {
        silentError: true,
      });
    } catch (error) {
      if (error instanceof HttpRequestError && error.status === 404) {
        return http.post(`/config-snapshots/${snapshotId}/delete`, {
          confirm: true,
        });
      }
      throw error;
    }
  },
};
