import { createFileRoute } from "@tanstack/react-router";
import { LoginPanel } from "@/components/auth/LoginPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Game" },
      { name: "description", content: "Sign in with email or your Solana, Hive or XRPL wallet." },
      { property: "og:title", content: "Sign in — Game" },
      { property: "og:description", content: "Sign in with email or your Solana, Hive or XRPL wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-card-foreground">Enter the Game</h1>
        <LoginPanel />
      </div>
    </main>
  );
}
