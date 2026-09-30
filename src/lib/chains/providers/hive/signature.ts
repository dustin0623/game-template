import { Signature, cryptoUtils } from "@hiveio/dhive";

/** Recover the public key that signed `message` (Keychain requestSignBuffer). */
export function recoverHivePublicKey(message: string, signatureHex: string) {
  try {
    return Signature.fromString(signatureHex).recover(cryptoUtils.sha256(message)).toString();
  } catch {
    return null;
  }
}

/** Fetch posting + active public keys for a Hive account. */
export async function getHiveAccountKeys(rpc: string, username: string) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "condenser_api.get_accounts", params: [[username]], id: 1 }),
  });
  const json = (await res.json()) as {
    result?: Array<{ posting: { key_auths: [string, number][] }; active: { key_auths: [string, number][] } }>;
  };
  const acc = json.result?.[0];
  if (!acc) return [];
  return [...acc.posting.key_auths, ...acc.active.key_auths].map(([k]) => k);
}

export async function verifyHiveSignature(rpc: string, username: string, message: string, signatureHex: string) {
  const pub = recoverHivePublicKey(message, signatureHex);
  if (!pub) return false;
  return (await getHiveAccountKeys(rpc, username)).includes(pub);
}
