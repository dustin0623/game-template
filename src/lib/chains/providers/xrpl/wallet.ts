/** Browser: GemWallet connect + sign. Imported lazily to keep SSR clean. */
export async function connectXrpl() {
  const gem = await import("@gemwallet/api");
  const installed = await gem.isInstalled();
  if (!installed.result?.isInstalled) throw new Error("GemWallet not found. Install the extension.");
  const res = await gem.getPublicKey();
  if (!res.result) throw new Error("Wallet connection cancelled");
  return { address: res.result.address, publicKey: res.result.publicKey };
}

export async function signXrpl(message: string) {
  const gem = await import("@gemwallet/api");
  const res = await gem.signMessage(message);
  if (!res.result?.signedMessage) throw new Error("Signing cancelled");
  return { signature: res.result.signedMessage };
}
