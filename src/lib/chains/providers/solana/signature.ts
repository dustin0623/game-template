import nacl from "tweetnacl";
import bs58 from "bs58";

/** Verify an ed25519 signature (base58) from a Solana wallet over a UTF-8 message. */
export function verifySolanaSignature(address: string, message: string, signatureB58: string) {
  try {
    return nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signatureB58),
      bs58.decode(address),
    );
  } catch {
    return false;
  }
}
