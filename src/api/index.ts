import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { httpConfig } from "./config";
import { downloadBlob } from "./helper/download";
import {
  requestInterceptor,
  responseErrorInterceptor,
  responseInterceptor,
} from "./helper/interceptors";
import type {
  BlobResponse,
  DownloadOptions,
  RequestOptions,
} from "./interface";

export { HttpRequestError } from "./helper/httpError";
export type { DownloadOptions, RequestOptions } from "./interface";

class RequestHttp {
  private readonly service: AxiosInstance;

  /**
   * 创建独立的 Axios 实例并注册统一的请求、响应和异常拦截器。
   * @param config Axios 实例配置，默认使用项目的公共请求配置
   */
  constructor(config: AxiosRequestConfig = httpConfig) {
    this.service = axios.create(config);
    this.service.interceptors.request.use(requestInterceptor);
    this.service.interceptors.response.use(
      responseInterceptor,
      responseErrorInterceptor,
    );
  }

  /**
   * 发起完整配置形式的请求，适用于需要自定义 method、headers 等参数的场景。
   * @param config Axios 请求配置及项目扩展选项
   */
  request<T = any>(config: RequestOptions): Promise<T> {
    return this.service.request<any, T>(config);
  }

  /**
   * 发起 GET 请求。
   * @param url 请求地址
   * @param params URL 查询参数
   * @param options 其他 Axios 配置及项目扩展选项
   */
  get<T = any>(
    url: string,
    params?: Record<string, any>,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.request<T>({ method: "GET", url, params, ...options });
  }

  /**
   * 发起 POST 请求。
   * @param url 请求地址
   * @param data 请求体数据
   * @param options 其他 Axios 配置及项目扩展选项
   */
  post<T = any>(
    url: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.request<T>({ method: "POST", url, data, ...options });
  }

  /**
   * 发起 PUT 请求。
   * @param url 请求地址
   * @param data 请求体数据
   * @param options 其他 Axios 配置及项目扩展选项
   */
  put<T = any>(
    url: string,
    data?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.request<T>({ method: "PUT", url, data, ...options });
  }

  /**
   * 发起 DELETE 请求。
   * @param url 请求地址
   * @param params URL 查询参数
   * @param options 其他 Axios 配置及项目扩展选项
   */
  delete<T = any>(
    url: string,
    params?: Record<string, any>,
    options: RequestOptions = {},
  ): Promise<T> {
    return this.request<T>({ method: "DELETE", url, params, ...options });
  }

  /**
   * 获取二进制响应，但不自动下载，适用于图片预览或调用方自行处理文件流。
   * @param url 请求地址
   * @param options 可通过 method、data、params 覆盖默认的 GET 请求
   */
  async blob(url: string, options: RequestOptions = {}): Promise<BlobResponse> {
    const response = await this.service.request<Blob, AxiosResponse<Blob>>({
      method: "GET",
      ...options,
      url,
      responseType: "blob",
      rawResponse: true,
    } as RequestOptions);

    return {
      blob: response.data,
      disposition: response.headers["content-disposition"] || "",
      contentType: response.headers["content-type"] || response.data.type || "",
    };
  }

  /**
   * 下载二进制文件，优先使用响应头文件名，没有时使用传入的 filename。
   * @param url 请求地址
   * @param options 请求配置和备用文件名
   */
  async download(url: string, options: DownloadOptions = {}) {
    const { filename = "download", ...requestOptions } = options;
    const response = await this.blob(url, requestOptions);
    downloadBlob(response.blob, response.disposition, filename);
    return response;
  }
}

export default new RequestHttp();
