import http, { type RequestOptions } from "@/api";

export const containerApi = {
  /** 获取 Docker/Compose 运行时状态 */
  getContainerRuntime: () => {
    return http.get("/containers/runtime");
  },
  /** 获取容器列表 */
  getContainers: (obj?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) => {
    return http.get("/containers", obj);
  },
  /** 清理已停止容器 */
  cleanupContainers: () => {
    return http.post("/containers/cleanup", { confirm: true });
  },
  /** 创建容器 */
  createContainer: (obj: {
    name: string;
    image: string;
    ports?: Array<{
      hostIp?: string;
      hostPort: number;
      containerPort: number;
      protocol?: string;
    }>;
    networks?: string[];
    ipv4?: string;
    ipv6?: string;
    mounts?: Array<{ source: string; target: string; readOnly: boolean }>;
    command?: string[];
    entrypoint?: string[];
    autoRemove?: boolean;
    privileged?: boolean;
    tty?: boolean;
    openStdin?: boolean;
    restart?: string;
    cpuWeight?: number;
    cpuLimit?: number;
    memoryLimitMB?: number;
    labels?: Record<string, string>;
    environment?: Record<string, string>;
  }) => {
    return http.post("/containers", obj);
  },
  /** 获取容器异步任务列表 */
  getContainerTasks: (obj?: {
    page?: number;
    pageSize?: number;
    active?: boolean;
    operation?: string;
    status?: string;
  }) => {
    return http.get("/containers/tasks", obj);
  },
  /** 获取容器异步任务详情 */
  getContainerTask: (taskId: string) => {
    return http.get(`/containers/tasks/${encodeURIComponent(taskId)}`);
  },
  /** 增量读取容器任务日志 */
  getContainerTaskLog: (
    taskId: string,
    obj?: { cursor?: number; limit?: number },
  ) => {
    return http.get(`/containers/tasks/${encodeURIComponent(taskId)}/log`, obj);
  },
  /** 取消容器异步任务 */
  cancelContainerTask: (taskId: string) => {
    return http.post(
      `/containers/tasks/${encodeURIComponent(taskId)}/cancel`,
      {},
    );
  },
  /** 下载容器任务日志 */
  downloadContainerTaskLog: (taskId: string) => {
    return http.download(
      `/containers/tasks/${encodeURIComponent(taskId)}/log/download`,
      {
        filename: `oneinstack-container-${taskId}.log`,
        headers: { Accept: "text/plain" },
      },
    );
  },
  /** 获取容器详情 */
  getContainerDetail: (id: string) => {
    return http.get(`/containers/${encodeURIComponent(id)}`);
  },
  /** 获取容器单次资源统计 */
  getContainerStats: (id: string) => {
    return http.get(`/containers/${encodeURIComponent(id)}/stats`);
  },
  /** 执行容器生命周期操作 */
  runContainerAction: (
    id: string,
    obj: { action: string; confirm?: boolean; force?: boolean },
  ) => {
    return http.post(`/containers/${encodeURIComponent(id)}/actions`, obj);
  },
  /** 批量执行容器生命周期操作 */
  batchRunContainerAction: (obj: {
    ids: string[];
    action: string;
    confirm?: boolean;
    force?: boolean;
  }) => {
    return http.post("/containers/batch/actions", obj);
  },
  /** 获取容器日志 */
  getContainerLogs: (
    id: string,
    obj?: {
      tail?: number;
      since?: string;
      until?: string;
      timestamps?: boolean;
      follow?: boolean;
    },
  ) => {
    return http.get(`/containers/${encodeURIComponent(id)}/logs`, obj);
  },
  /** 下载容器日志 */
  downloadContainerLogs: (
    id: string,
    obj?: {
      tail?: number;
      since?: string;
      until?: string;
      timestamps?: boolean;
    },
    filename = "container.log",
  ) => {
    return http.download(
      `/containers/${encodeURIComponent(id)}/logs/download`,
      { params: obj, filename, headers: { Accept: "text/plain" } },
    );
  },
  /** 获取容器终端状态 */
  getContainerTerminalStatus: (
    id: string,
    options: Pick<RequestOptions, "silentError"> = {},
  ) => {
    return http.get(
      `/containers/${encodeURIComponent(id)}/terminal/status`,
      undefined,
      options,
    );
  },
  /** 创建容器终端一次性票据 */
  createContainerTerminalTicket: (
    id: string,
    obj: { password: string; confirmHighRisk?: boolean },
    options: Pick<RequestOptions, "silentError"> = {},
  ) => {
    return http.post(
      `/containers/${encodeURIComponent(id)}/terminal/ticket`,
      obj,
      options,
    );
  },
  /** 获取镜像列表 */
  getContainerImages: (obj?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    return http.get("/containers/images", obj);
  },
  /** 获取镜像详情 */
  getContainerImage: (id: string) => {
    return http.get(`/containers/images/${encodeURIComponent(id)}`);
  },
  /** 拉取镜像 */
  pullContainerImage: (obj: {
    reference?: string;
    registryId?: number;
    imageName?: string;
  }) => {
    return http.post("/containers/images/pull", obj);
  },
  /** 导入镜像 tar 文件 */
  importContainerImage: (file: File) => {
    const payload = new FormData();
    payload.append("file", file);
    return http.post("/containers/images/import", payload);
  },
  /** 构建镜像 */
  buildContainerImage: (obj: {
    name: string;
    dockerfile?: string;
    contextPath?: string;
    dockerfilePath?: string;
    labels?: Record<string, string>;
    labelsText?: string;
  }) => {
    return http.post("/containers/images/build", obj);
  },
  /** 修改镜像标签 */
  tagContainerImage: (
    id: string,
    obj: { reference: string; removeOther?: boolean; confirm?: boolean },
  ) => {
    return http.post(`/containers/images/${encodeURIComponent(id)}/tag`, obj);
  },
  /** 推送镜像 */
  pushContainerImage: (obj: {
    reference?: string;
    registryId?: number;
    imageName?: string;
  }) => {
    return http.post("/containers/images/push", obj);
  },
  /** 导出镜像 tar 文件 */
  exportContainerImage: (id: string, filename: string) => {
    return http.download(
      `/containers/images/${encodeURIComponent(id)}/export`,
      {
        filename,
      },
    );
  },
  /** 清理悬空镜像 */
  pruneContainerImages: () => {
    return http.post("/containers/images/prune", { confirm: true });
  },
  /** 清理构建缓存 */
  pruneContainerBuildCache: () => {
    return http.post("/containers/images/build-cache/prune", { confirm: true });
  },
  /** 删除镜像 */
  deleteContainerImage: (id: string) => {
    return http.delete(
      `/containers/images/${encodeURIComponent(id)}?confirm=true`,
    );
  },
  /** 获取 Docker 网络列表 */
  getContainerNetworks: (obj?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    return http.get("/containers/networks", obj);
  },
  /** 获取 Docker 网络详情 */
  getContainerNetwork: (id: string) => {
    return http.get(`/containers/networks/${encodeURIComponent(id)}`);
  },
  /** 创建 Docker 网络 */
  createContainerNetwork: (obj: {
    name: string;
    driver?: string;
    ipv4?: boolean;
    ipv4Subnet?: string;
    ipv4Gateway?: string;
    ipv4IpRange?: string;
    ipv4AuxAddresses?: Record<string, string>;
    ipv6?: boolean;
    ipv6Subnet?: string;
    ipv6Gateway?: string;
    ipv6IpRange?: string;
    ipv6AuxAddresses?: Record<string, string>;
    options?: Record<string, string>;
    optionsText?: string;
    labels?: Record<string, string>;
    labelsText?: string;
  }) => {
    return http.post("/containers/networks", obj);
  },
  /** 清理无用 Docker 网络 */
  pruneContainerNetworks: () => {
    return http.post("/containers/networks/prune", { confirm: true });
  },
  /** 删除 Docker 网络 */
  deleteContainerNetwork: (id: string) => {
    return http.delete(
      `/containers/networks/${encodeURIComponent(id)}?confirm=true`,
    );
  },
  /** 批量删除 Docker 网络 */
  batchDeleteContainerNetworks: (ids: string[]) => {
    return http.post("/containers/networks/batch/delete", {
      ids,
      confirm: true,
    });
  },
  /** 获取 Docker 存储卷列表 */
  getContainerVolumes: (obj?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    return http.get("/containers/volumes", obj);
  },
  /** 获取 Docker 存储卷详情 */
  getContainerVolume: (id: string) => {
    return http.get(`/containers/volumes/${encodeURIComponent(id)}`);
  },
  /** 创建 Docker 存储卷 */
  createContainerVolume: (obj: {
    name: string;
    driver?: string;
    nfs?: boolean;
    options?: Record<string, string>;
    optionsText?: string;
    labels?: Record<string, string>;
    labelsText?: string;
  }) => {
    return http.post("/containers/volumes", obj);
  },
  /** 清理无用 Docker 存储卷 */
  pruneContainerVolumes: () => {
    return http.post("/containers/volumes/prune", { confirm: true });
  },
  /** 删除 Docker 存储卷 */
  deleteContainerVolume: (id: string) => {
    return http.delete(
      `/containers/volumes/${encodeURIComponent(id)}?confirm=true`,
    );
  },
  /** 批量删除 Docker 存储卷 */
  batchDeleteContainerVolumes: (ids: string[]) => {
    return http.post("/containers/volumes/batch/delete", {
      ids,
      confirm: true,
    });
  },
  /** 获取 Compose 项目列表 */
  getContainerCompose: () => {
    return http.get("/containers/compose");
  },
  /** 获取编排模板能力状态 */
  getContainerTemplates: () => {
    return http.get("/containers/templates");
  },
  /** 创建编排模板 */
  createContainerTemplate: (obj: {
    name: string;
    description?: string;
    content: string;
  }) => {
    return http.post("/containers/templates", obj);
  },
  /** 更新编排模板 */
  updateContainerTemplate: (
    id: number | string,
    obj: { name: string; description?: string; content: string },
  ) => {
    return http.put(`/containers/templates/${encodeURIComponent(id)}`, obj);
  },
  /** 删除编排模板 */
  deleteContainerTemplate: (id: number | string) => {
    return http.delete(
      `/containers/templates/${encodeURIComponent(id)}?confirm=true`,
    );
  },
  /** 获取 Registry 凭据能力状态 */
  getContainerRegistries: (obj?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    return http.get("/containers/registries", obj);
  },
  /** 新增 Registry */
  createContainerRegistry: (obj: {
    name: string;
    address: string;
    protocol: "http" | "https";
    authEnabled?: boolean;
    username?: string;
    password?: string;
  }) => {
    return http.post("/containers/registries", obj);
  },
  /** 更新 Registry */
  updateContainerRegistry: (
    id: number | string,
    obj: {
      name: string;
      address: string;
      protocol: "http" | "https";
      authEnabled?: boolean;
      username?: string;
      password?: string;
    },
  ) => {
    return http.put(`/containers/registries/${encodeURIComponent(id)}`, obj);
  },
  /** 删除 Registry */
  deleteContainerRegistry: (id: number | string) => {
    return http.delete(
      `/containers/registries/${encodeURIComponent(id)}?confirm=true`,
    );
  },
  /** 测试 Registry 连通性 */
  testContainerRegistry: (id: number | string) => {
    return http.post(
      `/containers/registries/${encodeURIComponent(id)}/test`,
      {},
    );
  },
  /** 读取 Docker daemon 配置 */
  getContainerConfig: () => {
    return http.get("/containers/config");
  },
  /** 保存 Docker daemon 配置 */
  saveContainerConfig: (obj: {
    raw?: string;
    basic?: Record<string, unknown>;
  }) => {
    return http.put("/containers/config", obj);
  },
  /** 停止或重启 Docker 服务 */
  runContainerRuntimeAction: (obj: {
    action: "stop" | "restart";
    confirm: true;
  }) => {
    return http.post("/containers/runtime/actions", obj);
  },
};
