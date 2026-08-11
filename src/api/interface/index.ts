import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

export interface RequestOptions extends AxiosRequestConfig {
  /** 是否禁止请求层自动展示错误提示 */
  silentError?: boolean;
  /** 登录失效时是否禁止请求层自动退出当前账号 */
  ignoreUnauthorizedLogout?: boolean;
  /** 是否返回完整 AxiosResponse，文件流请求内部使用 */
  rawResponse?: boolean;
}

export interface DownloadOptions extends RequestOptions {
  /** 响应头未返回文件名时使用的备用文件名 */
  filename?: string;
}

export interface InternalRequestConfig extends InternalAxiosRequestConfig {
  silentError?: boolean;
  ignoreUnauthorizedLogout?: boolean;
  rawResponse?: boolean;
}

export interface ErrorPayload {
  success?: boolean;
  code?: string | number;
  message?: string;
  detail?: string;
  error?:
    | string
    | {
        code?: string | number;
        message?: string;
        detail?: string;
      };
}

export interface BlobResponse {
  blob: Blob;
  disposition: string;
  contentType: string;
}
