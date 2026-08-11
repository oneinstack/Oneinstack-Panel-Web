import type { AxiosError } from "axios";
import i18n from "@/lang";
import { formatHttpStatusMessage } from "@/utils/http-error";

const timeoutCodes = new Set(["ECONNABORTED", "ETIMEDOUT"]);

/**
 * 将 Axios 超时或网络异常转换为当前语言的提示文案。
 * @param error Axios 异常对象
 */
export const checkAxiosError = (error?: AxiosError) => {
  if (!error) return undefined;
  if (error.code && timeoutCodes.has(error.code)) {
    return i18n.t("common.request.timeout");
  }
  if (error.code === "ERR_NETWORK" || (!error.response && error.request)) {
    return i18n.t("common.request.networkError");
  }
  return undefined;
};

/**
 * 根据 HTTP 状态码生成统一的错误提示文案。
 * @param status HTTP 状态码
 * @param statusText HTTP 状态描述
 */
export const checkStatus = (status?: number, statusText?: string) => {
  if (!status) return undefined;
  return formatHttpStatusMessage(status, statusText);
};
