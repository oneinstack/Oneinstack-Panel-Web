import http from "@/api";

export const certificateApi = {
  /** 获取可用证书密钥算法。 */
  getCertificateAlgorithms: () => http.get("/certificates/algorithms"),
  /** 获取可配置的 DNS 服务商。 */
  getCertificateDnsProviders: () => http.get("/certificates/dns-providers"),
  /** 获取证书资源列表。 */
  getCertificates: (params?: { page?: number; pageSize?: number }) =>
    http.get("/certificates", params),
  /** 获取证书详情和网站绑定关系。 */
  getCertificateDetail: (id: string) =>
    http.get(`/certificates/${encodeURIComponent(id)}`),
  /** 上传已有证书并创建异步任务。 */
  uploadCertificate: (data: Record<string, any>) =>
    http.post("/certificates/upload", data),
  /** 创建自签证书异步任务。 */
  createSelfSignedCertificate: (data: Record<string, any>) =>
    http.post("/certificates/self-signed", data),
  /** 读取证书 PEM 材料。 */
  getCertificatePem: (id: string) =>
    http.blob(`/certificates/${encodeURIComponent(id)}/certificate`),
  /** 读取私钥 PEM 材料。 */
  getCertificatePrivateKey: (id: string) =>
    http.blob(`/certificates/${encodeURIComponent(id)}/private-key`),
  /** 下载证书 PEM 文件。 */
  downloadCertificate: (id: string) =>
    http.download(`/certificates/${encodeURIComponent(id)}/download`, {
      filename: "fullchain.pem",
    }),
  /** 将证书部署并绑定到网站。 */
  bindCertificateWebsite: (
    id: string,
    data: { websiteId: number; forceHttps: boolean },
  ) => http.post(`/certificates/${encodeURIComponent(id)}/bindings`, data),
  /** 解绑网站并关闭对应 SSL 配置。 */
  unbindCertificateWebsite: (id: string, websiteId: number) =>
    http.delete(
      `/certificates/${encodeURIComponent(id)}/bindings/${websiteId}`,
    ),
  /** 删除证书资源。 */
  deleteCertificate: (id: string) =>
    http.delete(`/certificates/${encodeURIComponent(id)}`),
  /** 获取证书任务列表。 */
  getCertificateCenterTasks: (params?: Record<string, any>) =>
    http.get("/certificates/tasks", params),
  /** 获取证书任务详情。 */
  getCertificateCenterTask: (id: string) =>
    http.get(`/certificates/tasks/${encodeURIComponent(id)}`),
  /** 获取证书任务日志。 */
  getCertificateCenterTaskLog: (id: string) =>
    http.get(`/certificates/tasks/${encodeURIComponent(id)}/log`),
  /** 取消未完成的证书任务。 */
  cancelCertificateCenterTask: (id: string) =>
    http.post(`/certificates/tasks/${encodeURIComponent(id)}/cancel`, {}),
  /** 获取 DNS 账号列表。 */
  getCertificateDnsAccounts: () => http.get("/certificates/dns-accounts"),
  /** 新增或更新 DNS 账号。 */
  saveCertificateDnsAccount: (data: Record<string, any>) =>
    http.post("/certificates/dns-accounts", data),
  /** 删除 DNS 账号。 */
  deleteCertificateDnsAccount: (id: string) =>
    http.delete(`/certificates/dns-accounts/${encodeURIComponent(id)}`),
};
