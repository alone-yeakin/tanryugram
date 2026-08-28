import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { initialsAvatar, mediaSource } from "@/lib/mediaUrl";
import { blobToDataUrl, clampCropOffset, cropAvatarImage, type CropOffset } from "@/lib/avatarCrop";
import { SafeImage } from "@/components/SafeImage";
import { toast } from "sonner";
import { Link } from "wouter";
import { ShieldCheck, Sparkles, UserCheck, UserX, Trash2, Lock, Camera, Check, ArrowRight, Bug, X, Plus, Mail, Download, Upload, Archive, Loader2, Video, Play, Heart, MessageCircle, Flag, ChevronRight, PhoneCall, Database, Globe, Layers } from "lucide-react";
import { BugReportModal } from "@/components/TanryugramBetaPolish";
import { AIChatBox, type Message as GeminiChatMessage } from "@/components/AIChatBox";
import { ProfileBadge } from "@/components/ProfileBadge";
import { OnboardingScreen, EmailAuthForm } from "@/components/TanryugramBetaPolish";

export function LoginPanel({ onLogin }: { onLogin: () => void }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  return (
    <>
      {showOnboarding && <OnboardingScreen onComplete={() => setShowOnboarding(false)} />}
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-md rounded-[32px] border border-border/80 bg-card p-8 shadow-2xl">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-violet-500">Creator community</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Tanryugram</h1>
          <p className="mt-2 text-sm text-muted-foreground">A creator-first social space for independent work, stories, conversations, and community.</p>
          <div className="mt-8 space-y-4">
            <EmailAuthForm onLoginSuccess={() => window.location.reload()} />
            <Link href="/recover" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/60 bg-violet-500/10 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:text-violet-300">Forgot your password? Open Recovery Bot</Link>
            <button onClick={() => setShowOnboarding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted py-3 text-xs font-semibold transition hover:bg-muted/80">View Welcome Onboarding</button>
            <div className="rounded-2xl border border-amber-300/60 bg-amber-500/10 p-4 text-xs leading-5 text-amber-800 dark:text-amber-200"><ShieldCheck className="mb-1 h-4 w-4" />Sorry for the email-verification issue. Our email service is currently having problems, so verification may need to be handled manually for now.</div>
          </div>
        </div>
      </div>
    </>
  );
}

async function createVideoThumbnail(file: File) { const source = URL.createObjectURL(file); try { const video = document.createElement("video"); video.muted = true; video.playsInline = true; video.preload = "metadata"; video.src = source; await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error("Err")); }); const canvas = document.createElement("canvas"); canvas.width = 540; canvas.height = Math.round(540 * video.videoHeight / video.videoWidth); canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", 0.82); } finally { URL.revokeObjectURL(source); } }

export function ReelSubmissionCard() {
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null); const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null); const [caption, setCaption] = useState("");
  const submissions = trpc.reels.mine.useQuery(); const upload = trpc.media.uploadBase64.useMutation(); const submit = trpc.reels.submit.useMutation();
  const choose = (candidate?: File) => { if (!candidate) return; if (!candidate.type.startsWith("video/")) return toast.error("Choose video"); const url = URL.createObjectURL(candidate); const video = document.createElement("video"); video.preload = "metadata"; video.onloadedmetadata = () => { const w = video.videoWidth; const h = video.videoHeight; URL.revokeObjectURL(url); if (!w || !h || Math.abs(w / h - 9 / 16) > 0.03) return toast.error("9:16 ratio required"); setFile(candidate); setPreview(URL.createObjectURL(candidate)); setDimensions({ width: w, height: h }); }; video.src = url; };
  const submitReel = async () => { if (!file || !dimensions) return; try { const reader = new FileReader(); const dataUrl = await new Promise<string>((res, rej) => { reader.onload = () => res(String(reader.result)); reader.readAsDataURL(file); }); const stored = await upload.mutateAsync({ fileName: file.name, base64Data: dataUrl, contentType: file.type, purpose: "reel" }); const thumbData = await createVideoThumbnail(file); const thumb = await upload.mutateAsync({ fileName: `${file.name}.jpg`, base64Data: thumbData, contentType: "image/jpeg", purpose: "reel" }); await submit.mutateAsync({ mediaUrl: stored.url, thumbnailUrl: thumb.url, caption: caption.trim() || undefined, width: dimensions.width, height: dimensions.height }); toast.success("Submitted"); setFile(null); setPreview(null); setCaption(""); (submissions as any).refetch(); } catch (e: any) { toast.error("Failed"); } };
  const busy = upload.isPending || submit.isPending; return <section className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm"><div className="flex justify-between items-start"><div><p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Reel submission</p><h2 className="text-xl font-semibold">Submit a 9:16 short video</h2></div></div><div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]"><div className="aspect-[9/16] overflow-hidden rounded-2xl border border-dashed bg-muted/50">{preview ? <video src={preview} muted playsInline controls className="h-full w-full object-cover" /> : <div className="p-4 text-center text-xs text-muted-foreground"><Video className="mx-auto mb-2 h-6 w-6" />Choose portrait video</div>}</div><div className="space-y-3"><label className="flex h-11 cursor-pointer items-center justify-center rounded-xl bg-foreground text-xs font-semibold text-background">Choose video<input type="file" accept="video/*" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} /></label><textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-24 w-full rounded-xl border p-3 text-sm" placeholder="Caption..." /><button disabled={!file || busy} onClick={submitReel} className="h-11 w-full rounded-xl bg-violet-600 text-xs font-semibold text-white">{busy ? "Uploading..." : "Submit"}</button></div></div></section>;
}

export function AdminView({ onTip }: { onTip: () => void }) {
  const usersQuery = trpc.admin.users.list.useQuery(); const postsQuery = trpc.admin.posts.list.useQuery(); const reportsQuery = trpc.admin.reports.list.useQuery(); const reelsQuery = trpc.admin.getReels.useQuery(); const auditLogQuery = trpc.admin.getAuditLog.useQuery(); const reelsAnalyticsQuery = trpc.admin.reelsAnalytics.useQuery();
  const setBadgeMutation = trpc.admin.setBadge.useMutation(); const setCreatorMutation = trpc.admin.setCreator.useMutation(); const banUserMutation = trpc.admin.banUser.useMutation(); const setUserMediaPermissionsMutation = trpc.admin.setUserMediaPermissions.useMutation(); const setContentHiddenMutation = trpc.admin.setContentHidden.useMutation(); const resetUserPasswordMutation = trpc.admin.resetUserPassword.useMutation();
  const reviewBadgeMutation = trpc.admin.reviewBadgeApplication.useMutation(); const reviewReportMutation = trpc.admin.reviewReport.useMutation(); const reviewReelMutation = trpc.admin.reviewReel.useMutation(); const deletePostMutation = trpc.admin.deletePost.useMutation();
  const applicationsQuery = trpc.admin.getBadgeApplications.useQuery(); const uploadPolicyQuery = trpc.admin.getMediaPolicy.useQuery(); const setUploadPolicyMutation = trpc.admin.setMediaPolicy.useMutation();
  const emailSettingsQuery = trpc.admin.getEmailSettings.useQuery(); const setEmailSettingsMutation = trpc.admin.setEmailSettings.useMutation(); const recoverySettingsQuery = trpc.admin.getRecoverySettings.useQuery(); const setRecoverySettingsMutation = trpc.admin.setRecoverySettings.useMutation();
  const marketplaceSettingsQuery = trpc.marketplace.getSettings.useQuery(); const setPlatformMutation = trpc.admin.setPlatformSetting.useMutation(); const recoveryInboxQuery = trpc.admin.getRecoveryInbox.useQuery(); const replyRecoveryMutation = trpc.admin.replyRecovery.useMutation(); const closeRecoveryMutation = trpc.admin.closeRecovery.useMutation(); const geminiChatMutation = trpc.admin.geminiChat.useMutation(); const setMaintenanceMutation = trpc.admin.setMaintenance.useMutation();
  const utils = trpc.useUtils(); const users = usersQuery.data || []; const auditLog = auditLogQuery.data || []; const reels = reelsQuery.data || []; const reports = reportsQuery.data || []; const uploadPolicy = uploadPolicyQuery.data || { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };
  const emailSettings = emailSettingsQuery.data || { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
  const recoverySettings = recoverySettingsQuery.data || { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
  const [recoveryReplies, setRecoveryReplies] = useState<Record<number, string>>({}); const [resetUserId, setResetUserId] = useState("0"); const [ownerResetPassword, setOwnerResetPassword] = useState("");
  const [geminiChatMessages, setGeminiChatMessages] = useState<GeminiChatMessage[]>([{ role: "assistant", content: "I’m your Creator Studio assistant." }]);
  const [activeProviderModal, setActiveProviderModal] = useState<"supabase" | "firebase" | "vercel" | null>(null);
  const toggleMaintenance = (enabled: boolean) => setMaintenanceMutation.mutate({ enabled }, { onSuccess: () => marketplaceSettingsQuery.refetch() });
  const assignBadge = (userId: number, badgeType: string, isSecondary = false) => setBadgeMutation.mutate({ userId, badgeType: badgeType as any, isSecondary }, { onSuccess: () => usersQuery.refetch() });
  const updateUserPublishingAccess = (u: any, patch: any) => { const current = u.mediaPermissions || { postsEnabled: true, photosEnabled: true, videosEnabled: true, reelsEnabled: true, storiesEnabled: true }; setUserMediaPermissionsMutation.mutate({ userId: u.id, ...current, ...patch }, { onSuccess: () => usersQuery.refetch() }); };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex justify-between items-center"><div><h2 className="text-3xl font-bold">Creator Studio</h2><p className="text-sm text-muted-foreground">Governance and management.</p></div><Link href="/" className="rounded-2xl border bg-card px-4 py-2 text-xs font-semibold">Back</Link></div>

        <div className="rounded-[28px] border border-violet-300/70 bg-violet-500/5 p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-violet-700 dark:text-violet-300"><Sparkles className="h-4 w-4" /> AI Platform Assistant</h3>
          <div className="h-[400px] overflow-hidden rounded-2xl border bg-card shadow-inner">
            <AIChatBox messages={geminiChatMessages} onSendMessage={async (content) => {
              const next = [...geminiChatMessages, { role: "user" as const, content }]; setGeminiChatMessages(next);
              try { const reply = await geminiChatMutation.mutateAsync({ messages: next.map(m => ({ role: m.role === "assistant" ? "model" as const : "user" as const, content: m.content })) }); setGeminiChatMessages([...next, { role: "assistant", content: reply.content }]); } catch (e) { toast.error("Err"); }
            }} isLoading={geminiChatMutation.isPending} />
          </div>
        </div>

        <div className="rounded-[28px] border p-6 shadow-sm bg-card">
          <h3 className="mb-4 font-semibold text-violet-600">Platform Status</h3>
          <button onClick={() => toggleMaintenance(!marketplaceSettingsQuery.data?.platform.maintenanceMode)} className={`flex w-full justify-between items-center p-4 border rounded-2xl transition ${marketplaceSettingsQuery.data?.platform.maintenanceMode ? "bg-amber-500/10 border-amber-300" : "bg-muted/40"}`}>
            <span><span className="block text-sm font-semibold">Maintenance Mode</span></span>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${marketplaceSettingsQuery.data?.platform.maintenanceMode ? "bg-amber-600 text-white" : "bg-muted"}`}>{marketplaceSettingsQuery.data?.platform.maintenanceMode ? "ON" : "OFF"}</span>
          </button>
        </div>

        <div className="rounded-[28px] border p-6 shadow-sm bg-card">
          <h3 className="mb-4 font-semibold text-violet-600">Provider Configuration</h3>
          <div className="mt-6 space-y-3">
            {[ { id: "supabase", label: "Supabase", icon: Database }, { id: "firebase", label: "Firebase", icon: Globe }, { id: "vercel", label: "Vercel", icon: Layers } ].map((p) => (
              <div key={p.id} className="flex justify-between items-center p-4 border rounded-2xl bg-muted/30">
                <div className="flex items-center gap-3"><p.icon className="h-4 w-4 text-violet-500" /><span className="text-xs font-semibold">{p.label}</span></div>
                <button onClick={() => setActiveProviderModal(p.id as any)} className="text-[10px] font-bold text-violet-600">Configure</button>
              </div>
            ))}
          </div>
        </div>

        {activeProviderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md p-8 border rounded-[32px] bg-card shadow-2xl">
              <div className="flex justify-between mb-6"><h3 className="text-lg font-bold">Configure {activeProviderModal}</h3><button onClick={() => setActiveProviderModal(null)}><X className="h-5 w-5" /></button></div>
              <div className="space-y-5">
                <div><label className="text-xs font-semibold text-muted-foreground">Endpoint</label><input type="text" className="w-full p-2.5 border rounded-xl bg-background text-xs" placeholder="https://..." /></div>
                <div><label className="text-xs font-semibold text-muted-foreground">API Key</label><input type="password" className="w-full p-2.5 border rounded-xl bg-background text-xs" placeholder="Secret" /></div>
                <div className="flex justify-end gap-2 pt-2"><button onClick={() => setActiveProviderModal(null)} className="px-4 py-2.5 text-xs font-semibold">Cancel</button><button onClick={() => { toast.success("Connected"); setActiveProviderModal(null); }} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold">Save</button></div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[28px] border p-6 shadow-sm bg-violet-500/5">
          <h3 className="font-semibold">Reset user password</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <select value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} className="h-11 border rounded-xl bg-background px-3 text-xs"><option value="0">Choose user</option>{(users as any[]).map((u: any) => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}</select>
            <input type="password" value={ownerResetPassword} onChange={(e) => setOwnerResetPassword(e.target.value)} placeholder="New password" className="h-11 border rounded-xl bg-background px-3 text-xs" />
            <button disabled={resetUserPasswordMutation.isPending || Number(resetUserId) <= 0 || ownerResetPassword.length < 8} onClick={() => resetUserPasswordMutation.mutate({ userId: Number(resetUserId), newPassword: ownerResetPassword }, { onSuccess: () => { setOwnerResetPassword(""); toast.success("Reset"); } })} className="h-11 bg-violet-600 text-white px-4 rounded-xl text-xs font-semibold">Reset</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border p-6 shadow-sm bg-card">
            <h3 className="mb-4 font-semibold">Media Policy</h3>
            <div className="space-y-4">
              {[ ["photosEnabled", "Public photos"], ["videosEnabled", "Public videos"], ["profilePhotosEnabled", "Profile photos"] ].map(([k, l]) => (
                <button key={k} onClick={() => setUploadPolicyMutation.mutate({ ...uploadPolicy, [k]: !(uploadPolicy as any)[k] }, { onSuccess: () => uploadPolicyQuery.refetch() })} className={`flex w-full justify-between items-center p-4 border rounded-2xl transition ${(uploadPolicy as any)[k] ? "border-violet-300 bg-violet-500/10" : "bg-muted/40"}`}><span><span className="block text-sm font-semibold">{l}</span></span><span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${(uploadPolicy as any)[k] ? "bg-violet-600 text-white" : "bg-muted"}`}>{(uploadPolicy as any)[k] ? "ON" : "OFF"}</span></button>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border p-6 shadow-sm bg-card">
            <h3 className="mb-4 font-semibold">Email Settings</h3>
            <div className="space-y-3">
              {[ ["emailDeliveryEnabled", "Email delivery"], ["signupVerificationEnabled", "Signup verification"] ].map(([k, l]) => (
                <button key={k} onClick={() => setEmailSettingsMutation.mutate({ ...emailSettings, [k]: !(emailSettings as any)[k] }, { onSuccess: () => emailSettingsQuery.refetch() })} className={`flex w-full justify-between items-center p-4 border rounded-2xl transition ${(emailSettings as any)[k] ? "border-emerald-300 bg-emerald-500/10" : "bg-muted/40"}`}><span><span className="block text-sm font-semibold">{l}</span></span><span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${(emailSettings as any)[k] ? "bg-emerald-600 text-white" : "bg-muted"}`}>{(emailSettings as any)[k] ? "ON" : "OFF"}</span></button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border p-6 shadow-sm bg-card">
          <h3 className="mb-4 font-semibold">User Directory</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {(users as any).map((u: any) => (
              <div key={u.id} className="p-4 border rounded-2xl bg-muted/30">
                <div className="flex gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-muted"><SafeImage src={u.avatarUrl} fallbackName={u.name || u.username} className="h-full w-full object-cover" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.name || u.username}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <select value={u.badgeType || "none"} onChange={(e) => assignBadge(u.id, e.target.value)} className="bg-muted px-2 py-1 text-[9px] font-bold uppercase outline-none"><option value="none">Primary</option><option value="blue">Blue</option><option value="black">Black</option><option value="gold">Gold</option><option value="vip">VIP</option><option value="founder">Founder</option><option value="legend">Legend</option></select>
                      <select value={u.secondaryBadgeType || "none"} onChange={(e) => assignBadge(u.id, e.target.value, true)} className="bg-muted px-2 py-1 text-[9px] font-bold uppercase outline-none"><option value="none">Secondary</option><option value="blue">Blue</option><option value="black">Black</option><option value="gold">Gold</option><option value="vip">VIP</option><option value="founder">Founder</option><option value="legend">Legend</option></select>
                      <button onClick={() => setCreatorMutation.mutate({ userId: u.id, value: !u.isCreator }, { onSuccess: () => usersQuery.refetch() })} className={`px-2 py-1 text-[9px] font-bold rounded ${u.isCreator ? "bg-violet-500 text-white" : "bg-muted"}`}>CREATOR</button>
                      <button onClick={() => banUserMutation.mutate({ userId: u.id, value: !u.isBanned }, { onSuccess: () => usersQuery.refetch() })} className={`px-2 py-1 text-[9px] font-bold rounded ${u.isBanned ? "bg-rose-500 text-white" : "bg-muted"}`}>BAN</button>
                      <button onClick={() => setContentHiddenMutation.mutate({ userId: u.id, value: !u.contentHidden }, { onSuccess: () => usersQuery.refetch() })} className={`px-2 py-1 text-[9px] font-bold rounded ${u.contentHidden ? "bg-amber-600 text-white" : "bg-muted"}`}>{u.contentHidden ? "Account publishing paused" : "PAUSE PUBLISHING"}</button>
                    </div>
                    <div className="mt-3 border-t pt-3"><p className="text-[9px] font-bold uppercase text-muted-foreground mb-2">Publishing access</p><div className="flex flex-wrap gap-1.5">
                      {[ ["postsEnabled", "Posts"], ["photosEnabled", "Photos"], ["videosEnabled", "Videos"], ["reelsEnabled", "Reels"], ["storiesEnabled", "Stories"] ].map(([k, l]) => {
                        const en = u.mediaPermissions?.[k] ?? true;
                        return <button key={k} onClick={() => updateUserPublishingAccess(u, { [k]: !en })} className={`px-2 py-1 text-[9px] font-bold rounded ${en ? "bg-violet-500/10 text-violet-700" : "bg-muted line-through"}`}>{en ? l : `${l} (Paused)`}</button>;
                      })}
                    </div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border p-6 shadow-sm bg-card">
          <h3 className="mb-4 font-semibold text-violet-600">Advanced Tools</h3>
          <div className="space-y-8">
            <section><h4 className="mb-4 text-xs font-bold uppercase text-muted-foreground">Recovery Inbox</h4>{(recoveryInboxQuery.data || []).map((r: any) => (<div key={r.id} className="p-4 border rounded-2xl bg-muted/30 mb-4"><div className="flex justify-between"><div><p className="text-sm font-semibold">{r.guestLabel}</p><p className="text-[10px] text-muted-foreground">{r.accountEmail}</p></div><button onClick={() => closeRecoveryMutation.mutate({ requestId: r.id }, { onSuccess: () => recoveryInboxQuery.refetch() })} className="text-[10px] font-bold">CLOSE</button></div><div className="mt-3 space-y-2">{(r.messages || []).map((m: any) => <div key={m.id} className={`p-2 text-xs rounded-xl ${m.senderType === "owner" ? "bg-violet-600 text-white" : "bg-card"}`}>{m.body}</div>)}</div><div className="mt-3 flex gap-2"><input value={recoveryReplies[r.id] ?? ""} onChange={(e) => setRecoveryReplies({ ...recoveryReplies, [r.id]: e.target.value })} placeholder="Reply..." className="h-9 flex-1 bg-background px-3 text-xs rounded-xl" /><button onClick={() => replyRecoveryMutation.mutate({ requestId: r.id, body: recoveryReplies[r.id] || "" }, { onSuccess: () => { setRecoveryReplies({ ...recoveryReplies, [r.id]: "" }); recoveryInboxQuery.refetch(); } })} className="bg-violet-600 px-3 text-xs text-white rounded-xl">SEND</button></div></div>))}</section>
            <section><h4 className="mb-4 text-xs font-bold uppercase text-muted-foreground">Audit Log</h4><div className="space-y-2">{(auditLog.slice(0, 5) as any).map((l: any) => <div key={l.log.id} className="p-3 text-[10px] bg-muted/30 rounded-xl"><b>{l.log.action}</b> · Actor: {l.actor?.name || "System"}</div>)}</div></section>
          </div>
        </div>

        <div className="rounded-[28px] border p-6 shadow-sm bg-card">
          <h3 className="mb-4 font-semibold text-violet-600">Badge Marketplace & Payments</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-2xl bg-muted/30">
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Marketplace Items</h4>
              <div className="space-y-2">
                {(marketplaceSettingsQuery.data?.marketplace || []).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span>{item.badgeType}</span>
                    <span className="font-mono">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border rounded-2xl bg-muted/30">
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Payment Methods</h4>
              <div className="space-y-2">
                {(marketplaceSettingsQuery.data?.payments || []).map((method: any) => (
                  <div key={method.id} className="flex justify-between items-center text-xs">
                    <span>{method.provider}</span>
                    <span className={method.isEnabled ? "text-emerald-600" : "text-muted-foreground"}>{method.isEnabled ? "Active" : "Disabled"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border p-6 shadow-sm bg-card">
          <h3 className="mb-4 font-semibold text-violet-600">Reels & Content Moderation</h3>
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase text-muted-foreground">Pending Reels</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {reels.filter((r: any) => r.status === "pending").map((r: any) => (
                  <div key={r.id} className="p-3 border rounded-xl bg-muted/30">
                    <div className="aspect-video bg-black rounded-lg mb-2 overflow-hidden"><video src={r.mediaUrl} className="h-full w-full object-cover" /></div>
                    <p className="text-[10px] truncate mb-2">{r.caption || "No caption"}</p>
                    <div className="flex gap-2">
                      <button onClick={() => reviewReelMutation.mutate({ reelId: r.id, status: "approved" }, { onSuccess: () => reelsQuery.refetch() })} className="flex-1 bg-emerald-600 text-white py-1.5 rounded-lg text-[10px] font-bold">APPROVE</button>
                      <button onClick={() => reviewReelMutation.mutate({ reelId: r.id, status: "rejected" }, { onSuccess: () => reelsQuery.refetch() })} className="flex-1 bg-rose-600 text-white py-1.5 rounded-lg text-[10px] font-bold">REJECT</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4 className="mb-3 text-xs font-bold uppercase text-muted-foreground">Recent Reports</h4>
              <div className="space-y-2">
                {reports.slice(0, 5).map((rep: any) => (
                  <div key={rep.id} className="p-3 border rounded-xl bg-muted/30 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 uppercase">{rep.reason}</p>
                      <p className="text-[9px] text-muted-foreground">Target: {rep.targetType} #{rep.targetId}</p>
                    </div>
                    <button onClick={() => reviewReportMutation.mutate({ reportId: rep.id, status: "reviewed" }, { onSuccess: () => reportsQuery.refetch() })} className="text-[9px] font-bold border px-2 py-1 rounded">RESOLVE</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}

export function AccountSettings({ user, onClose }: { user: any; onClose: () => void }) {
  const [name, setName] = useState(user?.name || ""); const [username, setUsername] = useState(user?.username || ""); const [bio, setBio] = useState(user?.bio || ""); const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || ""); const [price, setPrice] = useState(user?.subscriptionPrice || "4.99");
  const [cropSource, setCropSource] = useState<string | null>(null); const [cropFileName, setCropFileName] = useState("avatar.jpg"); const [cropZoom, setCropZoom] = useState(1); const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const updateMutation = trpc.profile.update.useMutation(); const updatePrivacyMutation = trpc.follows.updatePrivacy.useMutation(); const utils = trpc.useUtils();
  const handleSave = async () => { try { await updateMutation.mutateAsync({ name, username, bio, avatarUrl, subscriptionPrice: price }); toast.success("Updated"); utils.auth.me.invalidate(); onClose(); } catch (e) { toast.error("Failed"); } };
  const handleFile = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = (e) => { setCropSource(e.target?.result as string); setCropFileName(f.name); }; r.readAsDataURL(f); };
  const applyCrop = async () => { if (!cropSource) return; try { const cropped = await cropAvatarImage(cropSource, cropZoom, cropOffset); const uploadMutation = trpc.media.uploadBase64.useMutation(); const res = await uploadMutation.mutateAsync({ fileName: cropFileName, base64Data: cropped as any, contentType: "image/jpeg", purpose: "profile" }); setAvatarUrl(res.url); setCropSource(null); toast.success("Prepared"); } catch (e) { toast.error("Failed"); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border bg-card shadow-2xl">
        <div className="flex justify-between items-center border-b p-6"><h2 className="text-xl font-bold">Account Settings</h2><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex flex-col items-center gap-4"><div className="group relative h-24 w-24 overflow-hidden rounded-full bg-muted shadow-inner"><SafeImage src={avatarUrl} fallbackName={name || username} className="h-full w-full object-cover" /><label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100"><Camera className="h-6 w-6 text-white" /><input type="file" accept="image/*" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} /></label></div><button onClick={() => setAvatarUrl("")} className="text-[10px] font-bold uppercase text-rose-500">Remove Photo</button></div>
          <div className="grid gap-5 sm:grid-cols-2"><div><label className="text-xs font-bold uppercase text-muted-foreground">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-2xl border bg-muted/30 px-4 text-sm" /></div><div><label className="text-xs font-bold uppercase text-muted-foreground">Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 w-full rounded-2xl border bg-muted/30 px-4 text-sm" /></div></div>
          <div><label className="text-xs font-bold uppercase text-muted-foreground">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-24 w-full rounded-2xl border bg-muted/30 p-4 text-sm" /></div>
          <div className="space-y-2"><p className="text-xs font-bold uppercase text-muted-foreground">Privacy</p><button onClick={() => updatePrivacyMutation.mutate({ isPrivate: !isPrivate }, { onSuccess: (p: any) => setIsPrivate(p.isPrivate) })} className="flex w-full items-center justify-between p-4 border rounded-2xl"><span>Private Account</span><span className="text-[10px] font-bold">{isPrivate ? "ON" : "OFF"}</span></button></div>
        </div>
        <div className="p-6 border-t flex justify-end gap-2"><button onClick={onClose} className="px-6 py-2 text-xs font-semibold border rounded-2xl">Cancel</button><button onClick={handleSave} className="px-6 py-2 text-xs font-semibold bg-foreground text-background rounded-2xl">Save changes</button></div>
      </div>
      {cropSource && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-lg space-y-6"><div className="aspect-square overflow-hidden rounded-full border-4 border-white/20 bg-muted"><img src={cropSource} className="h-full w-full object-cover" style={{ transform: `scale(${cropZoom}) translate(${cropOffset.x}px, ${cropOffset.y}px)` }} /></div><div className="space-y-4 rounded-[32px] bg-card p-6"><input type="range" min="1" max="3" step="0.01" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="w-full" /><div className="flex gap-3"><button onClick={() => setCropSource(null)} className="flex-1 h-12 border rounded-2xl text-xs font-semibold">Cancel</button><button onClick={applyCrop} className="flex-1 h-12 bg-violet-600 text-white rounded-2xl text-xs font-semibold">Set Avatar</button></div></div></div>
        </div>
      )}
    </div>
  );
}
