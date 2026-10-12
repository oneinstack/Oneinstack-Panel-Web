import type { AxiosError } from "axios";
import { ElNotification } from "element-plus";
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
  stableCode?: string;
  status?: number;
  data?: unknown;
  headers?: Record<string, unknown>;
  requestId?: string;

  constructor(
    message: string,
    options: {
      code?: string | number;
      stableCode?: string;
      status?: number;
      data?: unknown;
      headers?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = "HttpRequestError";
    this.code = options.code;
    this.stableCode = options.stableCode;
    this.status = options.status;
    this.data = options.data;
    this.headers = options.headers;
    const responseHeaders = options.headers as
      | (Record<string, unknown> & {
          get?: (name: string) => unknown;
        })
      | undefined;
    this.requestId =
      String(
        responseHeaders?.get?.("x-request-id") ||
          responseHeaders?.["x-request-id"] ||
          responseHeaders?.["X-Request-ID"] ||
          "",
      ).trim() || undefined;
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
  headers?: Record<string, unknown>,
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
      stableCode:
        payload &&
        typeof payload === "object" &&
        payload.error &&
        typeof payload.error === "object"
          ? payload.error.stableCode
          : undefined,
      status,
      data,
      headers,
    },
  );
};

let closePreviewErrorNotification: (() => void) | undefined;

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

  const diagnostic = [
    error.status ? `HTTP ${error.status}` : "",
    error.stableCode || error.code !== undefined
      ? `${i18n.locale === "en-US" ? "Code" : "错误码"}: ${error.stableCode || error.code}`
      : "",
    error.requestId ? `${i18n.t("audit.requestId")}: ${error.requestId}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const displayMessage = diagnostic
    ? `${error.message} (${diagnostic})`
    : error.message;

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
    System.er(displayMessage, {
      type: "error",
      groupKey: `${error.status || ""}|${error.code || ""}|${error.requestId || ""}|${error.message}`,
    });
    sconfig.logout(true);
    return error;
  }

  if (config.url?.split("?")[0] === "/operations/preview") {
    closePreviewErrorNotification?.();
    const notification = ElNotification.error({
      title: i18n.locale === "en-US" ? "Preview failed" : "操作预览失败",
      message: displayMessage,
      duration: 0,
      showClose: true,
    });
    closePreviewErrorNotification = () => notification.close();
    return error;
  }

  System.er(displayMessage, {
    type: "error",
    groupKey: `${error.status || ""}|${error.code || ""}|${error.requestId || ""}|${error.message}`,
  });
  return error;
};
