/**
 * XRPL login event: browser signing + server verification for
 * Xaman (server payload + QR), Joey (WalletConnect) and GemWallet (extension).
 */
import { deriveAddress, verify } from "ripple-keypairs";
import { decode, encode, encodeForSigning } from "ripple-binary-codec";
import { chainEnv, xrplChainConfig } from "@/lib/chains/modules/config";
import type { XamanStatus, XrplQrPrompt } from "./types";

export { XRPL_WALLETS } from "./types";
export type { XrplWallet, XrplWalletMeta, XrplQrPrompt, XamanStatus } from "./types";

const toHex = (s: string) =>
  Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
const fromHex = (h: string) =>
  new TextDecoder().decode(new Uint8Array((h.match(/../g) ?? []).map((b) => parseInt(b, 16))));

/* ------------------------------ GemWallet ------------------------------ */

/** Browser: GemWallet connect. Imported lazily to keep SSR clean. */
export async function connectXrpl() {
  const gem = await import("@gemwallet/api");
  const installed = await gem.isInstalled();
  if (!installed.result?.isInstalled) throw new Error("GemWallet not found. Install the extension.");
  const res = await gem.getPublicKey();
  if (!res.result) throw new Error("Wallet connection cancelled");
  return { address: res.result.address, publicKey: res.result.publicKey };
}

/** Browser: sign the login challenge with GemWallet. */
export async function signXrplLogin(_address: string, message: string) {
  const gem = await import("@gemwallet/api");
  const res = await gem.signMessage(message);
  if (!res.result?.signedMessage) throw new Error("Signing cancelled");
  return { signature: res.result.signedMessage };
}

/** Server: verify a GemWallet message signature and that the key owns the address. */
export function verifyXrplSignature(address: string, publicKey: string, message: string, signature: string) {
  try {
    if (deriveAddress(publicKey) !== address) return false;
    return verify(toHex(message), signature, publicKey);
  } catch {
    return false;
  }
}

/* -------------------------------- Xaman -------------------------------- */

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

/** Server: create a Xaman SignIn request bound to our challenge token. */
export async function createXamanSignIn(message: string, token: string, fetcher: typeof fetch = fetch) {
  const res = await fetcher(`${xrplChainConfig.xamanApiUrl}/payload`, {
    method: "POST",
    headers: xamanHeaders(),
    body: JSON.stringify({
      txjson: { TransactionType: "SignIn" },
      options: { expire: xrplChainConfig.xamanExpireMinutes },
      custom_meta: { instruction: message, blob: { token } },
    }),
  });
  if (!res.ok) throw new Error(`Xaman request failed (${res.status})`);
  const p = (await res.json()) as { uuid: string; next: { always: string }; refs: { qr_png: string } };
  return { uuid: p.uuid, qrImage: p.refs.qr_png, deeplink: p.next.always };
}

async function fetchXamanPayload(uuid: string, fetcher: typeof fetch) {
  const res = await fetcher(`${xrplChainConfig.xamanApiUrl}/payload/${encodeURIComponent(uuid)}`, {
    headers: xamanHeaders(),
  });
  if (!res.ok) throw new Error(`Xaman lookup failed (${res.status})`);
  return (await res.json()) as XamanPayload;
}

/** Server: poll a Xaman request. */
export async function getXamanStatus(uuid: string, fetcher: typeof fetch = fetch): Promise<XamanStatus> {
  const p = await fetchXamanPayload(uuid, fetcher);
  if (p.meta?.signed && p.response?.account) return { status: "signed", account: p.response.account };
  if (p.meta?.expired) return { status: "expired" };
  if (p.meta?.cancelled || p.meta?.resolved) return { status: "rejected" };
  return { status: "pending" };
}

/** Server: confirm with Xaman that the request was signed for this challenge; returns the account. */
export async function verifyXamanSignIn(uuid: string, token: string, fetcher: typeof fetch = fetch) {
  try {
    const p = await fetchXamanPayload(uuid, fetcher);
    if (!p.meta?.signed || !p.response?.account) return null;
    if (p.custom_meta?.blob?.token !== token) return null;
    return p.response.account;
  } catch {
    return null;
  }
}

/** Browser: wait for the user to sign in Xaman. */
export async function waitForXaman(
  poll: (uuid: string) => Promise<XamanStatus>,
  uuid: string,
  intervalMs = 2000,
  timeoutMs = xrplChainConfig.xamanExpireMinutes * 60_000,
) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const s = await poll(uuid);
    if (s.status === "signed") return s.account;
    if (s.status !== "pending") throw new Error(s.status === "expired" ? "Xaman request expired" : "Sign-in rejected in Xaman");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Xaman request expired");
}

/* ------------------------- Joey (WalletConnect) ------------------------ */

type WcClient = Awaited<ReturnType<typeof import("@walletconnect/sign-client").default.init>>;
let wc: { client: WcClient; topic: string } | null = null;

/** Browser: pair with Joey over WalletConnect; shows a QR/deeplink via onPrompt. */
export async function connectJoey(onPrompt?: (p: XrplQrPrompt) => void) {
  const projectId = (import.meta.env as Record<string, string | undefined>)[xrplChainConfig.walletConnect.projectIdEnv];
  if (!projectId) throw new Error("Joey sign-in is not configured yet (missing WalletConnect project id).");
  const { default: SignClient } = await import("@walletconnect/sign-client");
  const client = await SignClient.init({
    projectId,
    metadata: { ...xrplChainConfig.walletConnect.metadata, url: window.location.origin, icons: [...xrplChainConfig.walletConnect.metadata.icons] },
  });
  const { chainId, method } = xrplChainConfig.walletConnect;
  const { uri, approval } = await client.connect({
    requiredNamespaces: { xrpl: { chains: [chainId], methods: [method], events: [] } },
  });
  if (uri) onPrompt?.({ wallet: "joey", qrValue: uri, deeplink: `${xrplChainConfig.joeyDeeplink}${encodeURIComponent(uri)}` });
  const session = await approval();
  const account = session.namespaces.xrpl?.accounts[0];
  if (!account) throw new Error("Joey returned no XRPL account");
  wc = { client, topic: session.topic };
  return { address: account.split(":").pop()! };
}

/** The unsubmitted transaction carrying the login challenge as a memo. */
export function buildLoginTx(address: string, message: string) {
  return {
    TransactionType: "AccountSet",
    Account: address,
    Memos: [{ Memo: { MemoType: toHex("login"), MemoData: toHex(message) } }],
  };
}

/** Browser: ask Joey to sign (never submit) the login transaction. Returns the signed blob. */
export async function signJoeyLogin(address: string, message: string) {
  if (!wc) throw new Error("Joey is not connected");
  const { chainId, method } = xrplChainConfig.walletConnect;
  const result = (await wc.client.request({
    topic: wc.topic,
    chainId,
    request: { method, params: { tx_json: buildLoginTx(address, message), autofill: true, submit: false } },
  })) as { tx_blob?: string; tx_json?: Record<string, unknown> };
  const blob = result.tx_blob ?? (result.tx_json ? encode(result.tx_json as never) : null);
  if (!blob) throw new Error("Joey returned no signature");
  return { signature: blob };
}

/** Server: verify a signed login transaction blob (Joey). */
export function verifyXrplSignedTx(address: string, message: string, blob: string) {
  try {
    const tx = decode(blob) as Record<string, unknown> & {
      Account?: string;
      SigningPubKey?: string;
      TxnSignature?: string;
      Memos?: { Memo: { MemoType?: string; MemoData?: string } }[];
    };
    if (tx.TransactionType !== "AccountSet" || tx.Account !== address) return false;
    if (!tx.SigningPubKey || !tx.TxnSignature) return false;
    if (deriveAddress(tx.SigningPubKey) !== address) return false;
    const memo = tx.Memos?.find((m) => m.Memo.MemoType && fromHex(m.Memo.MemoType) === "login");
    if (!memo?.Memo.MemoData || fromHex(memo.Memo.MemoData) !== message) return false;
    const { TxnSignature, ...unsigned } = tx;
    return verify(encodeForSigning(unsigned as never), TxnSignature, tx.SigningPubKey);
  } catch {
    return false;
  }
}
