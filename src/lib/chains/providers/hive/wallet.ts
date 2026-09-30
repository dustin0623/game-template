type KeychainResponse = { success: boolean; result?: string; message?: string; error?: string };
type Keychain = {
  requestSignBuffer: (
    user: string,
    message: string,
    role: "Posting",
    cb: (r: KeychainResponse) => void,
  ) => void;
};

/** Browser: sign with Hive Keychain using the posting key. */
export function signHive(username: string, message: string): Promise<{ signature: string }> {
  const kc = (window as unknown as { hive_keychain?: Keychain }).hive_keychain;
  if (!kc) return Promise.reject(new Error("Hive Keychain not found. Install the extension."));
  return new Promise((resolve, reject) =>
    kc.requestSignBuffer(username, message, "Posting", (r) =>
      r.success && r.result ? resolve({ signature: r.result }) : reject(new Error(r.message ?? "Signing cancelled")),
    ),
  );
}
