import type { AxiosError, AxiosResponse } from "axios";
import i18n from "@/lang";
import { useConfigStore } from "@/stores/modules/config";
import System from "@/utils/System";
import type { ErrorPayload, InternalRequestConfig } from "../interface";
import {
  createHttpError,
  handleHttpError,
  isBusinessFailure,
  parseBlobPayload,
} from "./httpError";

/**
 * 请求拦截器：添加当前语言请求头，并校验页面登录状态。
 * @param config Axios 内部请求配置
 */
export const requestInterceptor = (config: InternalRequestConfig) => {
  const sconfig = useConfigStore();
  config.headers.set(
    "Accept-Language",
    i18n.locale === "en-US" ? "en-US" : "zh-CN",
  );

  const currentPath = System.getRouterPath();
  if (!sconfig.userInfo?.authenticated && !currentPath.includes("/login")) {
    System.router?.replace("/login");
  }
  return config;
};

/**
 * 响应成功拦截器：解析业务状态，文件流请求则保留完整 AxiosResponse。
 * @param response Axios 响应对象
 */
export const responseInterceptor = async (response: AxiosResponse) => {
  const config = response.config as InternalRequestConfig;

  if (config.rawResponse) {
    const contentType = String(response.headers["content-type"] || "");
    if (
      response.data instanceof Blob &&
      contentType.includes("application/json")
    ) {
      const data = (await parseBlobPayload(response.data)) as ErrorPayload;
      if (isBusinessFailure(data)) {
        throw handleHttpError(
          createHttpError(
            data,
            response.status,
            response.statusText,
            undefined,
            response.headers as Record<string, unknown>,
          ),
          config,
        );
      }
    }
    return response;
  }

  const data =
    response.status === 204 ? { success: true, code: 0 } : response.data;
  if (isBusinessFailure(data)) {
    throw handleHttpError(
      createHttpError(
        data,
        response.status,
        response.statusText,
        undefined,
        response.headers as Record<string, unknown>,
      ),
      config,
    );
  }
  return data;
};

/**
 * 响应失败拦截器：解析普通响应和 Blob 错误，并抛出统一请求异常。
 * @param error Axios 异常对象
 */
export const responseErrorInterceptor = async (error: AxiosError) => {
  const config = (error.config || {}) as InternalRequestConfig;
  const response = error.response;
  const data = await parseBlobPayload(response?.data);
  throw handleHttpError(
    createHttpError(
      data,
      response?.status,
      response?.statusText,
      error,
      response?.headers as Record<string, unknown> | undefined,
    ),
    config,
  );
};
