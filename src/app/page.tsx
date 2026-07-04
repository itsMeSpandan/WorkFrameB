"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

type Tab = "signin" | "signup" | "verify";

export default function AuthPage() {
  const { user, loading: authLoading, signin, signup, verifyEmail } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const [tab, setTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [signupEmployeeId, setSignupEmployeeId] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const [verifyToken, setVerifyToken] = useState("");

  function resetState() {
    setMessage(null);
    setError(null);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      const msg = await signup(signupEmployeeId, signupEmail, signupPassword);
      setMessage(`${msg}\n\n[DEV] Check server console for verification token.`);
      setTab("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      await signin(signinEmail, signinPassword);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      await verifyEmail(verifyToken);
      setMessage("Email verified successfully. You can now sign in.");
      setTab("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground-primary uppercase">
            WorkFrame
          </h1>
          <p className="label-tactical mt-2 text-foreground-muted">HR Management System</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-surface-border mb-6">
          {(["signin", "signup", "verify"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); resetState(); }}
              className={`flex-1 py-2 text-xs font-medium uppercase tracking-tactical transition-colors ${
                tab === t
                  ? "border-b-2 border-accent text-accent"
                  : "text-foreground-muted hover:text-foreground-secondary"
              }`}
            >
              {t === "signin" ? "Sign In" : t === "signup" ? "Sign Up" : "Verify"}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success text-sm whitespace-pre-wrap">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Sign In */}
        {tab === "signin" && (
          <form onSubmit={handleSignin} className="space-y-4">
            <div>
              <label className="label-tactical block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={signinEmail}
                onChange={(e) => setSigninEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Sign Up */}
        {tab === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label-tactical block mb-1.5">Employee ID</label>
              <input
                type="text"
                required
                value={signupEmployeeId}
                onChange={(e) => setSignupEmployeeId(e.target.value)}
                className="input-field"
                placeholder="EMP001"
              />
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label-tactical block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="input-field"
                placeholder="Min 8 chars, upper, lower, number, special"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        )}

        {/* Verify */}
        {tab === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="label-tactical block mb-1.5">Verification Token</label>
              <input
                type="text"
                required
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                className="input-field font-mono"
                placeholder="Paste token from server console"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
