import type { AxiosRequestConfig } from "axios";

export const httpConfig: AxiosRequestConfig = {
  baseURL: "/v1",
  timeout: 30000,
  withCredentials: true,
  headers: { Accept: "application/json" },
};
