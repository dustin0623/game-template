/** XRPL login (server side): GemWallet + Joey signature checks and the Xaman REST sign-in. */
import { deriveAddress, verify } from "ripple-keypairs";
import { decode, encodeForSigning } from "ripple-binary-codec";
import { chainEnv, xrplChainConfig } from "@/lib/chains/modules/config";
import { toHex, fromHex } from "../../../utils";
import type { XamanStatus } from "../../../types";

export { buildLoginTx } from "../../../utils";


function xamanHeaders() {
  const key = process.env[chainEnv.xrpl.xamanApiKey];
  const secret = process.env[chainEnv.xrpl.xamanApiSecret];
  if (!key || !secret) throw new Error("Xaman sign-in is not configured yet (missing API key/secret).");
  return { "Content-Type": "application/json", "X-API-Key": key, "X-API-Secret": secret };
}

type XamanPayload = {
  meta?: { signed?: boolean; resolved?: boolean; expired?: boolean; cancelled?: boolean };
  response?: { account?: string | null };
  custom_meta?: { blob?: { token?: string } | null };
};


async function fetchXamanPayload(uuid: string, fetcher: typeof fetch) {
  const res = await fetcher(`${xrplChainConfig.xamanApiUrl}/payload/${encodeURIComponent(uuid)}`, {
    headers: xamanHeaders(),
  });
  if (!res.ok) throw new Error(`Xaman lookup failed (${res.status})`);
  return (await res.json()) as XamanPayload;
}



