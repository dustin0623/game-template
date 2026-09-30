import { z } from "zod";

export const ChainProviderSchema = z.enum(["solana", "hive", "xrpl"]);
export const AuthProviderSchema = z.enum(["email", "solana", "hive", "xrpl"]);

export const PlayerSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  chain: ChainProviderSchema.nullable(),
  chainAddress: z.string().nullable(),
  displayName: z.string(),
  createdAt: z.string(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const EmailCredentialsSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});
export type EmailCredentials = z.infer<typeof EmailCredentialsSchema>;

export const ChallengeRequestSchema = z.object({
  chain: ChainProviderSchema,
  address: z.string().min(1).max(128),
});

export const ChallengeSchema = z.object({
  message: z.string(),
  token: z.string(),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

export const WalletLoginSchema = z.object({
  chain: ChainProviderSchema,
  address: z.string().min(1).max(128),
  message: z.string().max(1000),
  token: z.string().max(2000),
  signature: z.string().min(1).max(1000),
  /** Required for XRPL (address is derived from it). */
  publicKey: z.string().max(200).optional(),
});
export type WalletLogin = z.infer<typeof WalletLoginSchema>;
