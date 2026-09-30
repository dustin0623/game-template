/** xrpl login event: browser signing + server verification. */
import { deriveAddress, verify } from "ripple-keypairs";
/** Browser: GemWallet connect + sign. Imported lazily to keep SSR clean. */
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

const toHex = (s: string) =>
  Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

/** Server: verify an XRPL message signature and that the public key owns the address. */
export function verifyXrplSignature(address: string, publicKey: string, message: string, signature: string) {
  try {
    if (deriveAddress(publicKey) !== address) return false;
    return verify(toHex(message), signature, publicKey);
  } catch {
    return false;
  }
}
