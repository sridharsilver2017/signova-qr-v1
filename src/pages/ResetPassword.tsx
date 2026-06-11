import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No reset token provided.");
      setIsVerifying(false);
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        let data;
        try {
          data = await res.json();
        } catch (e) {
          throw new Error("Invalid response from server. Is the backend API running?");
        }
        
        if (!res.ok) {
          throw new Error(data?.error ?? "Invalid or expired reset token.");
        }
        setIsValid(true);
        setUsername(data.username);
      } catch (err: any) {
        setError(err.message ?? "Invalid or expired reset token.");
      } finally {
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Invalid response from server. Is the backend API running?");
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to reset password.");
      }

      setMessage("Your password has been reset successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message ?? "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Verifying reset token...</p>
            </div>
          ) : !isValid ? (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-destructive/15 text-destructive">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Invalid Request
                </h1>
                <p className="text-sm text-destructive mt-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error || "The reset link is invalid or has expired."}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-glow"
                  style={{ background: "var(--gradient-lime)" }}
                >
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Reset Password
                </h1>
                <p className="text-sm text-muted-foreground mt-1 text-center">
                  Create a new password for account <strong>{username}</strong>
                </p>
              </div>

              {message ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 text-center">
                  {message}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="reset-new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-10"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
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
                    disabled={isSubmitting || !password || !confirmPassword}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Resetting…" : "Reset Password"}
                  </Button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
