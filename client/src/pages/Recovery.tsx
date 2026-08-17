import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Bot, LockKeyhole, MessageCircle, Send, ShieldAlert, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const safetyCopy = "Never share your private email address, password, verification code, or reset link with anyone. TanRyuGram support will never ask for your current password.";

export default function Recovery() {
  const [mode, setMode] = useState<"email" | "guest">("email");
  const [email, setEmail] = useState("");
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [guestLabel, setGuestLabel] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestToken, setGuestToken] = useState("");
  const [guestBody, setGuestBody] = useState("");
  const utils = trpc.useUtils();
  const settingsQuery = trpc.recovery.settings.useQuery();
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => { setResetRequested(true); toast.success("Reset code requested"); },
    onError: (error) => toast.error(error.message),
  });
  const confirmResetMutation = trpc.auth.confirmPasswordReset.useMutation({
    onSuccess: () => { toast.success("Password updated. You can now sign in."); setResetRequested(false); setResetCode(""); setNewPassword(""); },
    onError: (error) => toast.error(error.message),
  });
  const createGuestMutation = trpc.recovery.createGuest.useMutation({
    onSuccess: (data) => { setGuestToken(data.guestToken); toast.success("Recovery guest ID created"); },
    onError: (error) => toast.error(error.message),
  });
  const threadQuery = trpc.recovery.thread.useQuery({ guestToken }, { enabled: Boolean(guestToken), refetchInterval: guestToken ? 10000 : false });
  const sendGuestMutation = trpc.recovery.sendMessage.useMutation({
    onSuccess: () => { setGuestBody(""); void utils.recovery.thread.invalidate({ guestToken }); toast.success("Message sent to the owner"); },
    onError: (error) => toast.error(error.message),
  });
  const settings = settingsQuery.data;
  const whatsappHref = settings?.whatsappLink ? `${settings.whatsappLink}?text=${encodeURIComponent("Hello TanRyuGram, I need help recovering my account.")}` : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to TanRyuGram</Link>
        <section className="mt-6 overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-xl">
          <div className="bg-gradient-to-br from-violet-700 via-fuchsia-600 to-slate-950 p-6 text-white sm:p-8">
            <div className="flex items-start gap-3"><div className="rounded-2xl bg-white/15 p-3"><Bot className="h-6 w-6" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-100">TanRyuGram Recovery Bot</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Let’s get your account back.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Use the verified email reset flow, or create a temporary guest recovery ID to contact the owner.</p></div></div>
          </div>
          <div className="space-y-6 p-5 sm:p-8">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>{safetyCopy}</p></div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1"><button onClick={() => setMode("email")} className={`min-h-12 rounded-xl px-3 text-sm font-semibold transition ${mode === "email" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Reset by email</button><button onClick={() => setMode("guest")} className={`min-h-12 rounded-xl px-3 text-sm font-semibold transition ${mode === "guest" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Guest support</button></div>

            {mode === "email" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-violet-500" /><div><h2 className="font-semibold">Secure password reset</h2><p className="text-xs text-muted-foreground">A six-digit code is sent only to the account email.</p></div></div>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Account email address" className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-violet-500" />
                {!resetRequested ? <button disabled={requestResetMutation.isPending} onClick={() => requestResetMutation.mutate({ email })} className="min-h-12 w-full rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{requestResetMutation.isPending ? "Requesting…" : "Send reset code"}</button> : <div className="space-y-3"><input value={resetCode} onChange={(event) => setResetCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit verification code" className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-center font-mono tracking-[0.35em] outline-none focus:border-violet-500" /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password (at least 6 characters)" className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-violet-500" /><button disabled={confirmResetMutation.isPending} onClick={() => confirmResetMutation.mutate({ email, code: resetCode, newPassword })} className="min-h-12 w-full rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{confirmResetMutation.isPending ? "Updating…" : "Verify code and update password"}</button></div>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-violet-500" /><div><h2 className="font-semibold">Owner recovery support</h2><p className="text-xs text-muted-foreground">Your guest ID can message only the TanRyuGram owner and expires after 24 hours.</p></div></div>
                {!settings?.guestRecoveryEnabled ? <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">Guest recovery support is currently turned off by the owner.</div> : !guestToken ? <div className="space-y-3"><input value={guestLabel} onChange={(event) => setGuestLabel(event.target.value)} placeholder="Your name or nickname (optional)" className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-violet-500" /><input type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder="Account email (optional)" className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-violet-500" /><button disabled={createGuestMutation.isPending} onClick={() => createGuestMutation.mutate({ guestLabel: guestLabel || undefined, accountEmail: guestEmail || undefined })} className="min-h-12 w-full rounded-2xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{createGuestMutation.isPending ? "Creating guest ID…" : "Create guest recovery ID"}</button></div> : <div className="space-y-3"><div className="rounded-2xl border border-violet-300/60 bg-violet-500/10 p-4"><p className="text-xs font-semibold text-violet-800 dark:text-violet-200">Your temporary guest ID</p><p className="mt-1 break-all font-mono text-xs text-violet-700 dark:text-violet-300">{guestToken}</p><p className="mt-2 text-[11px] text-muted-foreground">Keep this ID private. Anyone with it can send messages in this recovery thread.</p></div><div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-muted p-3">{threadQuery.data?.messages?.length ? threadQuery.data.messages.map((message) => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.senderType === "owner" ? "bg-violet-600 text-white" : "bg-card"}`}><p>{message.body}</p><p className="mt-1 text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString()}</p></div>) : <p className="p-4 text-center text-xs text-muted-foreground">No messages yet. Tell the owner what account you need help recovering.</p>}</div><div className="flex gap-2"><textarea value={guestBody} onChange={(event) => setGuestBody(event.target.value)} placeholder="Message the owner about your account recovery…" className="min-h-20 flex-1 resize-none rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-violet-500" /><button disabled={sendGuestMutation.isPending} onClick={() => sendGuestMutation.mutate({ guestToken, body: guestBody })} className="min-h-12 self-end rounded-2xl bg-violet-600 px-4 text-white hover:bg-violet-700 disabled:opacity-60"><Send className="h-4 w-4" /></button></div></div>}
                {settings?.whatsappSupportEnabled && whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><Smartphone className="h-4 w-4" /> Contact recovery support on WhatsApp</a>}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
