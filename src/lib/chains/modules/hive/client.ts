import { HiveClient } from "hivexph-sdk";
import { hiveChainConfig, chainEnv } from "../config";

/**
 * Shared HiveClient instance.
 *
 * The client is side-effect free: creating it opens no connection. Private
 * keys are never held here — the SDK resolves `keyEnv` lazily, server-side,
 * only when a backend signing operation runs.
 */
let instance: HiveClient | null = null;

function readEndpoint(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[chainEnv.hive.endpoint] ?? hiveChainConfig.endpoint;
}

export function getHiveClient(): HiveClient {
  if (!instance) {
    instance = new HiveClient({
      endpoint: readEndpoint(),
      beaconUrl: hiveChainConfig.beaconUrl,
      applicationId: hiveChainConfig.applicationId,
      accounts: { ...hiveChainConfig.accounts },
    });
  }
  return instance;
}

/** Test/DI hook: swap the shared client. Pass null to reset. */
export function setHiveClient(client: HiveClient | null) {
  instance = client;
}

export type { HiveClient };
