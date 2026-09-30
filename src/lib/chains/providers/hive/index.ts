export { sign } from "./sign";
export { verify } from "./verify";

/** Hive has no wallet "connect": the user types their account name. */
export async function connect(username?: string) {
  const address = (username ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!address) throw new Error("Enter your Hive username");
  return { address, publicKey: undefined as string | undefined };
}
