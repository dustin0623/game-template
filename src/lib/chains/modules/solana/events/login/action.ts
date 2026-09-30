/** solana login event: browser signing + server verification. */
import bs58 from "bs58";
import nacl from "tweetnacl";
type PhantomProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  signMessage: (msg: Uint8Array, enc: "utf8") => Promise<{ signature: Uint8Array }>;
};

function provider(): PhantomProvider {
  const w = window as unknown as { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider };
  const p = w.phantom?.solana ?? w.solana;
  if (!p) throw new Error("Solana wallet not found. Install Phantom.");
  return p;
}

/** Browser: connect Phantom and return the address. */
export async function connectSolana() {
  const res = await provider().connect();
  return { address: res.publicKey.toString() };
}

/** Browser: sign the login challenge, returning a base58 signature. */
export async function signSolanaLogin(_address: string, message: string) {
  const { signature } = await provider().signMessage(new TextEncoder().encode(message), "utf8");
  return { signature: bs58.encode(signature) };
}

/** Server: verify an ed25519 signature (base58) from a Solana wallet. */
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
