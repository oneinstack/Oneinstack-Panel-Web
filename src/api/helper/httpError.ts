import type { AxiosError } from "axios";
import { HttpCode } from "@/enum/HttpCode";
import i18n from "@/lang";
import { useConfigStore } from "@/stores/modules/config";
import System from "@/utils/System";
import { resolveHttpErrorMessage } from "@/utils/http-error";
import type { ErrorPayload, InternalRequestConfig } from "../interface";
import { checkAxiosError, checkStatus } from "./checkStatus";

/** 包含业务错误码、HTTP 状态码和原始响应数据的统一请求异常。 */
export class HttpRequestError extends Error {
  code?: string | number;
  status?: number;
  data?: unknown;

  constructor(
    message: string,
    options: { code?: string | number; status?: number; data?: unknown } = {},
  ) {
    super(message);
    this.name = "HttpRequestError";
    this.code = options.code;
    this.status = options.status;
    this.data = options.data;
  }
}

/**
 * 从标准响应或嵌套 error 对象中读取业务错误码。
 * @param data 后端错误响应
 */
export const getErrorCode = (data?: ErrorPayload) =>
  typeof data?.error === "object" ? data.error.code ?? data.code : data?.code;

/**
 * 判断 HTTP 成功响应是否表示业务执行失败。
 * @param data 后端响应数据
 */
export const isBusinessFailure = (data?: ErrorPayload) => {
  if (!data || typeof data !== "object") return false;
  if (data.success === false) return true;
  return data.code !== undefined && data.code !== 0 && data.code !== "0";
};

/**
 * 将 Blob 类型的错误响应解析为 JSON 或文本，普通数据保持原样返回。
 * @param data Axios 响应数据
 */
export const parseBlobPayload = async (data: unknown) => {
  if (!(data instanceof Blob)) return data;
  const text = await data.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** 根据业务错误码读取对应的多语言提示。 */
const localizedCodeMessage = (code?: string | number) => {
  if (code === undefined || code === null || code === "") return "";
  const key = `code.${code}`;
  const message = i18n.t(key);
  return message === key ? "" : message;
};

/** 按 detail、业务码、HTTP 状态和默认提示的优先级生成错误文案。 */
const resolveRequestErrorMessage = (
  data: ErrorPayload | string | undefined,
  status?: number,
  statusText?: string,
  fallback?: string,
) => {
  if (data && typeof data === "object") {
    const detail =
      typeof data.error === "object" ? data.error.detail : data.detail;
    if (detail) return detail;

    const codeMessage = localizedCodeMessage(getErrorCode(data));
    if (codeMessage) return codeMessage;
  }

  return resolveHttpErrorMessage(
    data,
    fallback ||
      checkStatus(status, statusText) ||
      i18n.t("common.request.failed"),
  );
};

/**
 * 将后端响应或 Axios 异常转换为统一的 HttpRequestError。
 * @param data 后端响应数据
 * @param status HTTP 状态码
 * @param statusText HTTP 状态描述
 * @param cause 原始 Axios 异常
 */
export const createHttpError = (
  data: unknown,
  status?: number,
  statusText?: string,
  cause?: AxiosError,
) => {
  const payload = data as ErrorPayload | string | undefined;
  return new HttpRequestError(
    resolveRequestErrorMessage(
      payload,
      status,
      statusText,
      checkAxiosError(cause),
    ),
    {
      code:
        payload && typeof payload === "object"
          ? getErrorCode(payload)
          : undefined,
      status,
      data,
    },
  );
};

/**
 * 统一处理错误提示、初始密码跳转和登录失效退出。
 * @param error 标准请求异常
 * @param config 当前请求配置
 */
export const handleHttpError = (
  error: HttpRequestError,
  config: InternalRequestConfig,
) => {
  const sconfig = useConfigStore();
  if (config.silentError) return error;

  if (error.code === "PASSWORD_CHANGE_REQUIRED") {
    if (System.getRouterPath() !== "/first-login") {
      System.er(i18n.t("common.request.initialPasswordRequired"), {
        type: "warning",
      });
      System.router?.replace("/first-login");
    }
    return error;
  }

  const loginExpired =
    error.status === HttpCode.LOGIN_EXPIRED ||
    [1100, 1101, 1109].includes(Number(error.code));
  if (loginExpired && !config.ignoreUnauthorizedLogout) {
    System.er(error.message, { type: "error" });
    sconfig.logout(true);
    return error;
  }

  System.er(error.message, { type: "error" });
  return error;
};
