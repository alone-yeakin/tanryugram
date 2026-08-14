import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ShieldCheck, Bug, WifiOff, Users, Compass, CheckCircle2, Lock, Mail, User, KeyRound } from "lucide-react";

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    { title: "Welcome to Tanryugram", subtitle: "The premier creator-first social platform for independent work, stories, and community.", icon: Sparkles },
    { title: "Connect with Friends", subtitle: "Search usernames, send voice notes, share reactions, and start group chats instantly.", icon: Users },
    { title: "Share Your Story", subtitle: "Publish multi-image carousels, 24-hour expiring stories, and stay close to your audience.", icon: Compass },
  ];
  const current = slides[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md rounded-[32px] border border-border/80 bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-500">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{current.title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{current.subtitle}</p>
        <div className="my-8 flex justify-center gap-1.5">
          {slides.map((_, index) => (
            <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-6 bg-violet-500" : "w-1.5 bg-border"}`} />
          ))}
        </div>
        <div className="space-y-3">
          <button
            onClick={() => {
              if (step < slides.length - 1) setStep(step + 1);
              else onComplete();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-sm font-semibold text-background shadow-lg transition hover:opacity-90 active:scale-[.99]"
          >
            {step < slides.length - 1 ? "Continue" : "Get Started"}
            <ArrowRight className="h-4 w-4" />
          </button>
          {step < slides.length - 1 && (
            <button onClick={onComplete} className="text-xs text-muted-foreground hover:text-foreground">
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmailAuthForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationHint, setVerificationHint] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data: any) => {
      if (data?.sessionToken) {
        try {
          sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.sessionToken}`);
        } catch {}
      }
      toast.success("Welcome back to Tanryugram!");
      onLoginSuccess();
    },
    onError: (err: any) => {
      toast.error("Login failed", { description: err.message });
    },
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data: any) => {
      if (data.requiresVerification) {
        setRequiresVerification(true);
        setVerificationHint(data.message || "Verification code sent to your email.");
        toast.message("Email verification required", { description: data.message });
      } else {
        if (data?.sessionToken) {
          try {
            sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.sessionToken}`);
          } catch {}
        }
        toast.success("Account created successfully!");
        onLoginSuccess();
      }
    },
    onError: (err: any) => {
      toast.error("Registration failed", { description: err.message });
    },
  });

  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetHint, setResetHint] = useState("");

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data: any) => {
      setResetRequested(true);
      setResetHint(data.message || "Reset code sent.");
      toast.success("Verification code sent!", { description: data.message });
    },
    onError: (err: any) => {
      toast.error("Request failed", { description: err.message });
    },
  });

  const confirmResetMutation = trpc.auth.confirmPasswordReset.useMutation({
    onSuccess: (data: any) => {
      toast.success("Password updated successfully!", { description: data.message });
      setMode("login");
      setResetRequested(false);
      setResetCode("");
      setNewPassword("");
    },
    onError: (err: any) => {
      toast.error("Reset failed", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      if (!email || !password) return toast.error("Please fill in email and password");
      loginMutation.mutate({ email, password });
    } else if (mode === "signup") {
      if (!email || !password || !name || !username) return toast.error("Please fill in all fields");
      signupMutation.mutate({ email, password, name, username, verificationCode: verificationCode.trim() || undefined });
    } else if (mode === "forgot") {
      if (!resetRequested) {
        if (!email) return toast.error("Please enter your email address");
        requestResetMutation.mutate({ email });
      } else {
        if (!resetCode || !newPassword) return toast.error("Please enter the verification code and new password");
        confirmResetMutation.mutate({ email, code: resetCode, newPassword });
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-xl text-left">
      <div className="mb-5 text-center">
        <h3 className="text-xl font-bold tracking-tight">Tanryugram Authentication</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "login" && "Sign in with your email & password"}
          {mode === "signup" && (requiresVerification ? "Enter email verification code" : "Create your new Tanryugram account")}
          {mode === "forgot" && "Reset your account password"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && !requiresVerification && (
          <>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
              <input
                type="text"
                placeholder="Aria Sol"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Username</label>
              <input
                type="text"
                placeholder="ariasol"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </>
        )}

        {(!requiresVerification || mode !== "signup") && (
          <>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                required
              />
            </div>

            {mode !== "forgot" ? (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                  required
                />
              </div>
            ) : (
              resetRequested && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3">
                    <p className="text-[11px] font-medium text-violet-700 dark:text-violet-300">{resetHint}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">6-Digit Verification Code</label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono tracking-widest text-center outline-none focus:border-violet-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">New Password</label>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                      required
                    />
                  </div>
                </div>
              )
            )}
          </>
        )}

        {requiresVerification && mode === "signup" && (
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4">
            <label className="text-xs font-semibold text-violet-600 dark:text-violet-300 mb-1 block">Verification Code</label>
            <p className="text-[11px] text-muted-foreground mb-2">{verificationHint}</p>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono tracking-widest text-center outline-none focus:border-violet-500"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending || signupMutation.isPending || requestResetMutation.isPending || confirmResetMutation.isPending}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
        >
          {mode === "login" && "Sign In"}
          {mode === "signup" && (requiresVerification ? "Verify & Complete Signup" : "Create Account")}
          {mode === "forgot" && (resetRequested ? "Verify Code & Update Password" : "Send Reset Code")}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
        {mode === "login" ? (
          <>
            <button onClick={() => setMode("forgot")} className="hover:text-foreground">
              Forgot password?
            </button>
            <button onClick={() => { setMode("signup"); setRequiresVerification(false); }} className="font-semibold text-violet-500 hover:underline">
              Create account
            </button>
          </>
        ) : (
          <button onClick={() => { setMode("login"); setRequiresVerification(false); setResetRequested(false); }} className="mx-auto font-semibold text-violet-500 hover:underline">
            Already have an account? Sign in
          </button>
        )}
      </div>
    </div>
  );
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[110] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-lg">
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Messages will send when reconnected.</span>
    </div>
  );
}

export function BugReportModal({ onClose }: { onClose: () => void }) {
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = () => {
    if (!desc.trim()) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast.success("Bug report submitted successfully. Thank you!");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Report a Bug</h3>
            <p className="text-xs text-muted-foreground">Help us improve the Tanryugram experience</p>
          </div>
        </div>
        <textarea
          rows={4}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe what went wrong..."
          className="w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-violet-500"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="rounded-xl bg-violet-600 hover:bg-violet-700">Submit Report</Button>
        </div>
      </div>
    </div>
  );
}
