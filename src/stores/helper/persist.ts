import type { StateTree } from "pinia";
import type {
  PersistenceOptions,
  StorageLike,
} from "pinia-plugin-persistedstate";

/** 创建统一的 Pinia 持久化配置。 */
export const piniaPersistConfig = <State extends StateTree>(
  key: string,
  storage: StorageLike,
  pick?: Array<keyof State & string>,
): PersistenceOptions<State> => ({
  key,
  storage,
  ...(pick?.length ? { pick } : {}),
});

export default piniaPersistConfig;
