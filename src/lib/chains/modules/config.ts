/**
 * Chain-specific configuration.
 *
 * `src/lib/config/config.ts` holds APPLICATION configuration.
 * This file holds everything that is specific to a blockchain: endpoints,
 * token symbols, precisions, application ids and the NAMES of the server-only
 * environment variables used for signing.
 *
 * Never put secret values here — only environment variable names. Keys are
 * resolved lazily, server-side, by the chain module at signing time.
 */

/** Server-only env var names. Values are read inside server code only. */
export const chainEnv = {
  hive: {
    /** Optional RPC endpoint override. */
    endpoint: "HIVE_RPC_ENDPOINT",
    /** Treasury account name + active key (used by the transaction worker). */
    treasuryAccount: "HIVE_TREASURY_ACCOUNT",
    treasuryKey: "HIVE_TREASURY_ACTIVE_KEY",
  },
} as const;

export const hiveChainConfig = {
  /** Default RPC node. Beacon discovery handles failover from here. */
  endpoint: "https://api.hive.blog",
  beaconUrl: "https://beacon.peakd.com/api/nodes",
  /** custom_json id used for this app's standardized game actions. */
  applicationId: "lovable-game",
  /** Layer 1 assets. */
  native: {
    symbols: ["HIVE", "HBD"] as const,
    precision: 3,
  },
  /** Layer 2 (Hive Engine) game token. */
  engine: {
    symbol: "SCRAP",
    precision: 3,
  },
  /** Backend signing accounts, referenced by alias. */
  accounts: {
    treasury: {
      accountEnv: chainEnv.hive.treasuryAccount,
      keyEnv: chainEnv.hive.treasuryKey,
    },
  },
} as const;

export type HiveNativeSymbol = (typeof hiveChainConfig.native.symbols)[number];

export const chainsConfig = {
  hive: hiveChainConfig,
} as const;

/** True when `symbol` is a Layer 1 Hive asset. */
export function isNativeHiveSymbol(symbol: string): symbol is HiveNativeSymbol {
  return (hiveChainConfig.native.symbols as readonly string[]).includes(symbol);
}
