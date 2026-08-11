import http from "@/api";

export const homeApi = {
  /** 获取系统信息 */
  getSysinfo: () => {
    return http.get("/sys/info");
  },
  /** 获取监控信息 */
  getSysMonitor: () => {
    return http.get("/sys/monitor");
  },
  /** 获取备注信息 */
  getSysRemark: (id = 1) => {
    return http.get(`/sys/remark/${id}`);
  },
  /** 更新备注信息 */
  updateSysRemark: (obj: any) => {
    return http.post("/sys/remark/update", obj);
  },
  /** 获取网站统计 */
  getWebsiteCount: () => {
    return http.get("/sys/websitecount");
  },
  /** 获取数据库统计 */
  getDatabaseCount: () => {
    return http.get("/sys/libcount");
  },
};
