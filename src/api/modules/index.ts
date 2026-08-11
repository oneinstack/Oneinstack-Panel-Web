import { authApi } from "./auth";
import { homeApi } from "./home";
import { fileApi } from "./file";
import { softwareApi } from "./software";
import { bastionApi } from "./bastion";
import { containerApi } from "./container";
import { websiteApi } from "./website";
import { databaseApi } from "./database";
import { securityApi } from "./security";
import { taskApi } from "./task";
import { systemApi } from "./system";
import { snapshotApi } from "./snapshot";
import { accessApi } from "./access";
import { auditApi } from "./audit";
import { monitorApi } from "./monitor";
import { runtimeLogApi } from "./runtimeLog";

export * from "../types";

export const Api = {
  ...authApi,
  ...homeApi,
  ...fileApi,
  ...softwareApi,
  ...bastionApi,
  ...containerApi,
  ...websiteApi,
  ...databaseApi,
  ...securityApi,
  ...taskApi,
  ...systemApi,
  ...snapshotApi,
  ...accessApi,
  ...auditApi,
  ...monitorApi,
  ...runtimeLogApi,
};
