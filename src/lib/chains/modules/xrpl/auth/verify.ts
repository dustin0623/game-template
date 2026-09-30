import { deriveAddress, verify } from "ripple-keypairs";

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
