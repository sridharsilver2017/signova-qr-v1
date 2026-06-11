import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Invalid response from server. Is the backend API running?");
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to send reset request.");
      }

      setMessage(data.message ?? "Instructions have been sent if the email is registered.");
    } catch (err: any) {
      setError(err.message ?? "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-lime)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--gradient-lime)" }}
        aria-hidden
      />

      <div className="relative w-full max-w-md px-4">
        <div className="glass shadow-card rounded-2xl p-8 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-glow"
              style={{ background: "var(--gradient-lime)" }}
            >
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Forgot Password
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Enter your email to receive password reset instructions
            </p>
          </div>

          {message ? (
            <div className="space-y-6 text-center">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                {message}
              </div>
              <p className="text-xs text-muted-foreground">
                For local development, the reset link is logged directly to the server terminal console.
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2 font-semibold"
                style={{ background: "var(--gradient-lime)" }}
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isLoading ? "Sending…" : "Send Reset Link"}
              </Button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
                onClick={() => navigate("/login")}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
