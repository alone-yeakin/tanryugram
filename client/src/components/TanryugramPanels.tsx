import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { initialsAvatar, mediaSource } from "@/lib/mediaUrl";
import { blobToDataUrl, clampCropOffset, cropAvatarImage, type CropOffset } from "@/lib/avatarCrop";
import { SafeImage } from "@/components/SafeImage";
import { toast } from "sonner";
import { Link } from "wouter";
import { ShieldCheck, Sparkles, UserCheck, UserX, Trash2, Lock, Camera, Check, ArrowRight, Bug, X, Plus, Mail, Download, Upload, Archive, Loader2, Video, Play, Heart, MessageCircle, Flag, ChevronRight, PhoneCall } from "lucide-react";
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
            <Link href="/recover" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-violet-300/60 bg-violet-500/10 py-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-500/15 dark:text-violet-300">
              Forgot your password? Open Recovery Bot
            </Link>
            <button onClick={() => setShowOnboarding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted py-3 text-xs font-semibold transition hover:bg-muted/80">
              View Welcome Onboarding
            </button>
            <div className="rounded-2xl border border-amber-300/60 bg-amber-500/10 p-4 text-xs leading-5 text-amber-800 dark:text-amber-200">
              <ShieldCheck className="mb-1 h-4 w-4" />
              Sorry for the email-verification issue. Our email service is currently having problems, so verification may need to be handled manually for now. Please remember your password after registration. Never share your password, private email, verification code, or reset link with anyone.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function createVideoThumbnail(file: File) { const source = URL.createObjectURL(file); try { const video = document.createElement("video"); video.muted = true; video.playsInline = true; video.preload = "metadata"; video.src = source; await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error("Could not prepare thumbnail")); }); const canvas = document.createElement("canvas"); canvas.width = 540; canvas.height = Math.round(540 * video.videoHeight / video.videoWidth); canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/jpeg", 0.82); } finally { URL.revokeObjectURL(source); } }

export function ReelSubmissionCard() {
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null); const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null); const [caption, setCaption] = useState("");
  const submissions = trpc.reels.mine.useQuery(); const upload = trpc.media.uploadBase64.useMutation(); const submit = trpc.reels.submit.useMutation();
  const choose = (candidate?: File) => { if (!candidate) return; if (!candidate.type.startsWith("video/")) return toast.error("Choose an MP4, WebM, or MOV video"); if (candidate.size > 50 * 1024 * 1024) return toast.error("Reels must be 50 MB or smaller"); const url = URL.createObjectURL(candidate); const video = document.createElement("video"); video.preload = "metadata"; video.onloadedmetadata = () => { const width = video.videoWidth; const height = video.videoHeight; URL.revokeObjectURL(url); if (!width || !height || Math.abs(width / height - 9 / 16) > 0.03) return toast.error("Reels must use a 9:16 portrait aspect ratio"); setFile(candidate); setPreview(URL.createObjectURL(candidate)); setDimensions({ width, height }); }; video.onerror = () => { URL.revokeObjectURL(url); toast.error("Could not read this video"); }; video.src = url; };
  const submitReel = async () => { if (!file || !dimensions) return toast.error("Choose a valid 9:16 video first"); try { const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read video")); reader.readAsDataURL(file); }); const stored = await upload.mutateAsync({ fileName: file.name, base64Data: dataUrl, contentType: file.type, purpose: "reel" }); const thumbnailData = await createVideoThumbnail(file); const thumbnail = await upload.mutateAsync({ fileName: `${file.name}.jpg`, base64Data: thumbnailData, contentType: "image/jpeg", purpose: "reel" }); await submit.mutateAsync({ mediaUrl: stored.url, thumbnailUrl: thumbnail.url, caption: caption.trim() || undefined, width: dimensions.width, height: dimensions.height }); toast.success("Reel submitted for owner approval"); setFile(null); setPreview(null); setDimensions(null); setCaption(""); (submissions as any).refetch(); } catch (error: any) { toast.error(error.message || "Could not submit Reel"); } };
  const busy = upload.isPending || submit.isPending; return <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Reel submission</p><h2 className="mt-1 text-xl font-semibold">Submit a 9:16 short video</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Approved submissions appear in Explore after owner review.</p></div><span className="w-fit rounded-full bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Approval required</span></div><div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]"><div className="flex aspect-[9/16] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-violet-300/70 bg-muted/50">{preview ? <video src={preview} muted playsInline controls className="h-full w-full object-cover" /> : <div className="p-4 text-center text-xs text-muted-foreground"><Video className="mx-auto mb-2 h-6 w-6 text-violet-500" />Choose portrait video</div>}</div><div className="space-y-3"><label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-foreground px-4 py-3 text-xs font-semibold text-background">{file ? "Choose another video" : "Choose Reel video"}<input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => choose(event.target.files?.[0])} /></label>{dimensions && <p className="text-[11px] text-emerald-600">Valid 9:16 ratio · {dimensions.width}×{dimensions.height}</p>}<textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={500} className="min-h-24 w-full rounded-xl border border-border bg-background p-3 text-sm" placeholder="Add a caption (optional)" /><button type="button" disabled={!file || !dimensions || busy} onClick={submitReel} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Uploading…" : "Submit for approval"}</button></div></div><div className="mt-6 border-t border-border/60 pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Your submission status</p><div className="mt-3 space-y-2">{submissions.data?.length ? (submissions.data as any).map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-xs"><span className="truncate">{item.caption || "Untitled Reel"}</span><span className="rounded-full bg-background px-2 py-1 text-[9px] font-bold uppercase">{item.status}</span></div>) : <p className="text-xs text-muted-foreground">No submissions yet.</p>}</div></div></section>;
}

export function AdminView({ onTip }: { onTip: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "governance" | "content" | "users" | "analytics" | "system">("overview");
  const usersQuery = trpc.admin.users.list.useQuery();
  const postsQuery = trpc.admin.posts.list.useQuery();
  const reportsQuery = trpc.admin.reports.list.useQuery();
  const reelsQuery = trpc.admin.getReels.useQuery();
  const appealsQuery = trpc.admin.getAppeals.useQuery();
  const auditLogQuery = trpc.admin.getAuditLog.useQuery();
  const reelsPromotionsQuery = trpc.admin.reelsPromotions.useQuery();
  const reelsAnalyticsQuery = trpc.admin.reelsAnalytics.useQuery();
  
  const setBadgeMutation = trpc.admin.setBadge.useMutation();
  const setCreatorMutation = trpc.admin.setCreator.useMutation();
  const setBadgeLabelMutation = trpc.admin.setBadgeLabel.useMutation();
  const setShowBadgeMutation = trpc.admin.setShowBadge.useMutation();
  const setDisplayedFollowersMutation = trpc.admin.setDisplayedFollowers.useMutation();
  const banUserMutation = trpc.admin.banUser.useMutation();
  const setRoleMutation = trpc.admin.setRole.useMutation();
  
  const reviewBadgeMutation = trpc.admin.reviewBadgeApplication.useMutation();
  const reviewReportMutation = trpc.admin.reviewReport.useMutation();
  const reviewReelMutation = trpc.admin.reviewReel.useMutation();
  const reviewAppealMutation = trpc.admin.reviewAppeal.useMutation();
  const setReelPromotionMutation = trpc.admin.setReelPromotion.useMutation();
  
  const deletePostMutation = trpc.admin.deletePost.useMutation();
  const applicationsQuery = trpc.admin.getBadgeApplications.useQuery();
  const uploadPolicyQuery = trpc.admin.getMediaPolicy.useQuery();
  const setUploadPolicyMutation = trpc.admin.setMediaPolicy.useMutation();
  const emailSettingsQuery = trpc.admin.getEmailSettings.useQuery();
  const setEmailSettingsMutation = trpc.admin.setEmailSettings.useMutation();
  const recoverySettingsQuery = trpc.admin.getRecoverySettings.useQuery();
  const setRecoverySettingsMutation = trpc.admin.setRecoverySettings.useMutation();
  const marketplaceSettingsQuery = trpc.marketplace.getSettings.useQuery();
  const setMarketplaceMutation = trpc.admin.setMarketplaceSetting.useMutation();
  const setPaymentMutation = trpc.admin.setPaymentSettings.useMutation();
  const setPlatformMutation = trpc.admin.setPlatformSetting.useMutation();
  const recoveryInboxQuery = trpc.admin.getRecoveryInbox.useQuery();
  const replyRecoveryMutation = trpc.admin.replyRecovery.useMutation();
  const closeRecoveryMutation = trpc.admin.closeRecovery.useMutation();
  const geminiApplyMutation = trpc.admin.geminiApplySafeActions.useMutation();
  const geminiChatMutation = trpc.admin.geminiChat.useMutation();
  const setMaintenanceMutation = trpc.admin.setMaintenance.useMutation();
  const utils = trpc.useUtils();

  const users = usersQuery.data || [];
  const posts = postsQuery.data || [];
  const applications = applicationsQuery.data || [];
  const reports = reportsQuery.data || [];
  const reels = reelsQuery.data || [];
  const appeals = appealsQuery.data || [];
  const auditLog = auditLogQuery.data || [];
  const promotions = reelsPromotionsQuery.data || [];
  const uploadPolicy = uploadPolicyQuery.data || { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };
  const emailSettings = emailSettingsQuery.data || { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
  const recoverySettings = recoverySettingsQuery.data || { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
  const [whatsappNumber, setWhatsappNumber] = useState(recoverySettings.whatsappSupportNumber);
  const [recoveryReplies, setRecoveryReplies] = useState<Record<number, string>>({});
  const [geminiChatMessages, setGeminiChatMessages] = useState<GeminiChatMessage[]>([{ role: "assistant", content: "I’m your private TanRyuGram Creator Studio assistant. Ask me about features, settings, troubleshooting, or a safe implementation plan. I will explain what needs review and will never claim that source code was changed unless it actually was." }]);
  const [showBugReport, setShowBugReport] = useState(false);

  const updateUploadPolicy = (next: { photosEnabled: boolean; profilePhotosEnabled: boolean; videosEnabled: boolean }) => setUploadPolicyMutation.mutate(next, { onSuccess: (policy: any) => { (utils.admin.getMediaPolicy as any).setData(undefined, policy); (utils.media.policy as any).setData(undefined, policy); toast.success("Upload policy updated"); }, onError: (error: any) => toast.error(error.message) });
  const updateEmailSettings = (next: { emailDeliveryEnabled: boolean; signupVerificationEnabled: boolean; appScriptLoginEnabled: boolean; appScriptResetEnabled: boolean }) => setEmailSettingsMutation.mutate(next, { onSuccess: (settings: any) => { (utils.admin.getEmailSettings as any).setData(undefined, settings); toast.success("Email settings updated"); }, onError: (error: any) => toast.error(error.message) });
  const updateRecoverySettings = (next: { guestRecoveryEnabled: boolean; whatsappSupportEnabled: boolean; whatsappSupportNumber: string }) => setRecoverySettingsMutation.mutate(next, { onSuccess: (settings: any) => { (utils.admin.getRecoverySettings as any).setData(undefined, settings); setWhatsappNumber(settings.whatsappSupportNumber); (utils.recovery.settings as any).invalidate(); toast.success("Recovery support settings updated"); }, onError: (error: any) => toast.error(error.message) });
  const toggleMaintenance = (enabled: boolean) => setMaintenanceMutation.mutate({ enabled }, { onSuccess: () => { marketplaceSettingsQuery.refetch(); toast.success(`Maintenance mode ${enabled ? "enabled" : "disabled"}`); }, onError: (error: any) => toast.error(error.message) });

  const tabs = [
    { id: "overview", label: "Overview", icon: ShieldCheck },
    { id: "governance", label: "Governance", icon: Lock },
    { id: "users", label: "Users", icon: UserCheck },
    { id: "content", label: "Content", icon: Video },
    { id: "analytics", label: "Analytics", icon: Sparkles },
    { id: "system", label: "System", icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-border bg-card lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="p-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-violet-600">Creator Studio</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owner Space</p>
          </div>
          <nav className="space-y-1 px-3 pb-6">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab.id ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-border/60">
              <Link href="/" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
                Back to Feed
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            {activeTab === "overview" && (
              <>
                <div className="rounded-[28px] border border-violet-300/70 bg-violet-500/5 p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-violet-700 dark:text-violet-300"><Sparkles className="h-4 w-4" /> AI Platform Assistant</h3>
                  <div className="h-[400px] overflow-hidden rounded-2xl border border-violet-200 bg-card shadow-inner dark:border-violet-900">
                    <AIChatBox messages={geminiChatMessages} onSendMessage={async (content) => {
                      const nextMessages = [...geminiChatMessages, { role: "user" as const, content }];
                      setGeminiChatMessages(nextMessages);
                      try {
                        const reply = await geminiChatMutation.mutateAsync({ 
                          messages: nextMessages.map(m => ({ role: m.role === "assistant" ? "model" as const : "user" as const, content: m.content })),
                        });
                        setGeminiChatMessages([...nextMessages, { role: "assistant", content: reply.content }]);
                      } catch (err: any) {
                        toast.error(err.message || "Gemini is unavailable");
                      }
                    }} isLoading={geminiChatMutation.isPending} />
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-violet-600">Platform Status</h3>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${marketplaceSettingsQuery.data?.platform.maintenanceMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{marketplaceSettingsQuery.data?.platform.maintenanceMode ? "Maintenance" : "Live"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider">Maintenance Mode</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Pause public access to all features except login for admins.</p>
                    </div>
                    <button onClick={() => toggleMaintenance(!marketplaceSettingsQuery.data?.platform.maintenanceMode)} disabled={setMaintenanceMutation.isPending} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${marketplaceSettingsQuery.data?.platform.maintenanceMode ? "bg-violet-600" : "bg-zinc-300"}`}>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${marketplaceSettingsQuery.data?.platform.maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "governance" && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold">Email Delivery</h3>
                    <div className="space-y-3">
                      <button type="button" onClick={() => updateEmailSettings({ ...emailSettings, emailDeliveryEnabled: !emailSettings.emailDeliveryEnabled })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${emailSettings.emailDeliveryEnabled ? "border-violet-300 bg-violet-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Automatic email sending</span><span className="mt-1 block text-[11px] text-muted-foreground">Required for signup verification and password resets.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${emailSettings.emailDeliveryEnabled ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{emailSettings.emailDeliveryEnabled ? "ON" : "OFF"}</span></button>
                      <button type="button" onClick={() => updateEmailSettings({ ...emailSettings, signupVerificationEnabled: !emailSettings.signupVerificationEnabled })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${emailSettings.signupVerificationEnabled ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Signup verification codes</span><span className="mt-1 block text-[11px] text-muted-foreground">Force users to verify their email before account creation.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${emailSettings.signupVerificationEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{emailSettings.signupVerificationEnabled ? "ON" : "OFF"}</span></button>
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold">Media Upload Policy</h3>
                    <div className="space-y-3">
                      <button type="button" onClick={() => updateUploadPolicy({ ...uploadPolicy, photosEnabled: !uploadPolicy.photosEnabled })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${uploadPolicy.photosEnabled ? "border-violet-300 bg-violet-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Allow post photo uploads</span><span className="mt-1 block text-[11px] text-muted-foreground">Global switch for new photo posts and stories.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${uploadPolicy.photosEnabled ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{uploadPolicy.photosEnabled ? "ON" : "OFF"}</span></button>
                      <button type="button" onClick={() => updateUploadPolicy({ ...uploadPolicy, profilePhotosEnabled: !uploadPolicy.profilePhotosEnabled })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${uploadPolicy.profilePhotosEnabled ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Allow profile photo changes</span><span className="mt-1 block text-[11px] text-muted-foreground">Enable users to upload custom avatars in settings.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${uploadPolicy.profilePhotosEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{uploadPolicy.profilePhotosEnabled ? "ON" : "OFF"}</span></button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-emerald-600">Event Themes</h3>
                  <div className="flex flex-wrap gap-3">
                    {["none", "ramadan", "eid", "new_year", "valentine", "halloween"].map((theme) => {
                      const active = marketplaceSettingsQuery.data?.platform.eventTheme === theme || (!marketplaceSettingsQuery.data?.platform.eventTheme && theme === "none");
                      return (
                        <button key={theme} onClick={() => setPlatformMutation.mutate({ eventTheme: theme === "none" ? null : theme }, { onSuccess: () => marketplaceSettingsQuery.refetch() })} className={`rounded-2xl border px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${active ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border bg-muted/40"}`}>{theme}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-violet-600">Badge Marketplace Pricing</h3>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      {["blue", "black", "gold", "vip", "founder", "legend"].map((type) => {
                        const s = marketplaceSettingsQuery.data?.marketplace.find((m: any) => m.badgeType === type);
                        return (
                          <div key={type} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3">
                            <div className="flex items-center gap-2"><ProfileBadge type={type as any} /><span className="text-xs font-bold uppercase">{type}</span></div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setMarketplaceMutation.mutate({ badgeType: type as any, isPaid: !s?.isPaid, price: s?.price || "0" }, { onSuccess: () => marketplaceSettingsQuery.refetch() })} className={`rounded-lg px-2 py-1 text-[10px] font-bold ${s?.isPaid ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>{s?.isPaid ? "PAID" : "FREE"}</button>
                              <input value={s?.price || ""} onChange={(e) => setMarketplaceMutation.mutate({ badgeType: type as any, isPaid: s?.isPaid || false, price: e.target.value }, { onSuccess: () => marketplaceSettingsQuery.refetch() })} className="w-16 rounded-lg bg-card px-2 py-1 text-[10px] outline-none" placeholder="Price" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Info</p>
                      <div className="space-y-2">
                        <input value={marketplaceSettingsQuery.data?.payments.bkashNumber || ""} onChange={(e) => { const p = marketplaceSettingsQuery.data?.payments; setPaymentMutation.mutate({ bkashNumber: e.target.value, nagadNumber: p?.nagadNumber || null, paypalEmail: p?.paypalEmail || null, instructions: p?.instructions || null }, { onSuccess: () => marketplaceSettingsQuery.refetch() }); }} placeholder="bKash Number" className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none" />
                        <input value={marketplaceSettingsQuery.data?.payments.nagadNumber || ""} onChange={(e) => { const p = marketplaceSettingsQuery.data?.payments; setPaymentMutation.mutate({ nagadNumber: e.target.value, bkashNumber: p?.bkashNumber || null, paypalEmail: p?.paypalEmail || null, instructions: p?.instructions || null }, { onSuccess: () => marketplaceSettingsQuery.refetch() }); }} placeholder="Nagad Number" className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none" />
                        <input value={marketplaceSettingsQuery.data?.payments.paypalEmail || ""} onChange={(e) => { const p = marketplaceSettingsQuery.data?.payments; setPaymentMutation.mutate({ paypalEmail: e.target.value, bkashNumber: p?.bkashNumber || null, nagadNumber: p?.nagadNumber || null, instructions: p?.instructions || null }, { onSuccess: () => marketplaceSettingsQuery.refetch() }); }} placeholder="PayPal Email" className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none" />
                        <textarea value={marketplaceSettingsQuery.data?.payments.instructions || ""} onChange={(e) => { const p = marketplaceSettingsQuery.data?.payments; setPaymentMutation.mutate({ instructions: e.target.value, bkashNumber: p?.bkashNumber || null, nagadNumber: p?.nagadNumber || null, paypalEmail: p?.paypalEmail || null }, { onSuccess: () => marketplaceSettingsQuery.refetch() }); }} placeholder="Payment Instructions" className="min-h-20 w-full rounded-xl border border-border bg-muted/30 p-3 text-xs outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Recovery Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button type="button" onClick={() => updateRecoverySettings({ ...recoverySettings, guestRecoveryEnabled: !recoverySettings.guestRecoveryEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${recoverySettings.guestRecoveryEnabled ? "border-violet-300 bg-violet-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Guest recovery ID</span><span className="mt-1 block text-[11px] text-muted-foreground">Temporary owner-only support thread.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${recoverySettings.guestRecoveryEnabled ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{recoverySettings.guestRecoveryEnabled ? "ON" : "OFF"}</span></button>
                    <button type="button" onClick={() => updateRecoverySettings({ ...recoverySettings, whatsappSupportEnabled: !recoverySettings.whatsappSupportEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${recoverySettings.whatsappSupportEnabled ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">WhatsApp support link</span><span className="mt-1 block text-[11px] text-muted-foreground">Show a direct recovery link.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${recoverySettings.whatsappSupportEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{recoverySettings.whatsappSupportEnabled ? "ON" : "OFF"}</span></button>
                  </div>
                  <div className="mt-4">
                    <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} onBlur={() => updateRecoverySettings({ ...recoverySettings, whatsappSupportNumber: whatsappNumber })} placeholder="WhatsApp Support Number" className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Badge Applications</h3>
                  <div className="space-y-3">
                    {applications.filter((a: any) => a.status === "pending").map((app: any) => (
                      <div key={app.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted"><SafeImage src={app.user.avatarUrl} fallbackName={app.user.name || app.user.username} className="h-full w-full object-cover" /></div>
                            <div>
                              <p className="text-sm font-semibold">{app.user.name || app.user.username}</p>
                              <div className="mt-1 flex items-center gap-2"><span className="text-[10px] text-muted-foreground">Requesting:</span><ProfileBadge type={app.requestedBadge} /><span className="text-[10px] font-bold uppercase">{app.requestedBadge}</span></div>
                              {app.reason && <p className="mt-2 rounded-lg bg-card p-2 text-[10px] italic">"{app.reason}"</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => reviewBadgeMutation.mutate({ applicationId: app.id, status: "approved" }, { onSuccess: () => { applicationsQuery.refetch(); toast.success("Approved"); } })} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white">Approve</button>
                            <button onClick={() => reviewBadgeMutation.mutate({ applicationId: app.id, status: "rejected" }, { onSuccess: () => { applicationsQuery.refetch(); toast.success("Rejected"); } })} className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">Reject</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!applications.filter((a: any) => a.status === "pending").length && <p className="py-6 text-center text-xs text-muted-foreground">No pending applications.</p>}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">User Directory</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(users as any).map((u: any) => (
                      <div key={u.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted"><SafeImage src={u.avatarUrl} fallbackName={u.name || u.username} className="h-full w-full object-cover" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{u.name || u.username}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{u.email} · {u.role}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <button onClick={() => setBadgeMutation.mutate({ userId: u.id, badgeType: u.badgeType === "blue" ? "none" : "blue" }, { onSuccess: () => usersQuery.refetch() })} className={`rounded-lg px-2 py-1 text-[9px] font-bold uppercase transition ${u.badgeType === "blue" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}>Blue</button>
                              <button onClick={() => setCreatorMutation.mutate({ userId: u.id, value: !u.isCreator }, { onSuccess: () => usersQuery.refetch() })} className={`rounded-lg px-2 py-1 text-[9px] font-bold uppercase transition ${u.isCreator ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"}`}>Creator</button>
                              <button onClick={() => banUserMutation.mutate({ userId: u.id, value: !u.isBanned }, { onSuccess: () => usersQuery.refetch() })} className={`rounded-lg px-2 py-1 text-[9px] font-bold uppercase transition ${u.isBanned ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"}`}>{u.isBanned ? "Unban" : "Ban"}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Recovery Inbox</h3>
                  <div className="space-y-4">
                    {(recoveryInboxQuery.data || []).map((request: any) => (
                      <div key={request.id} className="rounded-2xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <div><p className="text-sm font-semibold">{request.guestLabel}</p><p className="text-[10px] text-muted-foreground">{request.accountEmail} · {request.status}</p></div>
                          <button onClick={() => closeRecoveryMutation.mutate({ requestId: request.id }, { onSuccess: () => { recoveryInboxQuery.refetch(); toast.success("Closed"); } })} className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">Close</button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {(request.messages || []).map((msg: any) => <div key={msg.id} className={`rounded-xl p-2 text-xs ${msg.senderType === "owner" ? "bg-violet-600 text-white" : "bg-card"}`}>{msg.body}</div>)}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <input value={recoveryReplies[request.id] ?? ""} onChange={(e) => setRecoveryReplies({ ...recoveryReplies, [request.id]: e.target.value })} placeholder="Reply..." className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-xs outline-none" />
                          <button onClick={() => replyRecoveryMutation.mutate({ requestId: request.id, body: recoveryReplies[request.id] || "" }, { onSuccess: () => { setRecoveryReplies({ ...recoveryReplies, [request.id]: "" }); recoveryInboxQuery.refetch(); } })} className="rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white">Send</button>
                        </div>
                      </div>
                    ))}
                    {!recoveryInboxQuery.data?.length && <p className="py-6 text-center text-xs text-muted-foreground">No active recovery requests.</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "content" && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Reels Review</h3>
                  <div className="space-y-3">
                    {reels.filter((r: any) => r.reel.status === "pending").map((item: any) => (
                      <div key={item.reel.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="flex gap-4">
                          <div className="aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl bg-black">
                            <video src={item.reel.mediaUrl} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{item.user.name || item.user.username}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.reel.caption || "No caption"}</p>
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => reviewReelMutation.mutate({ reelId: item.reel.id, status: "approved" }, { onSuccess: () => reelsQuery.refetch() })} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white">Approve</button>
                              <button onClick={() => reviewReelMutation.mutate({ reelId: item.reel.id, status: "rejected" }, { onSuccess: () => reelsQuery.refetch() })} className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">Reject</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!reels.filter((r: any) => r.reel.status === "pending").length && <p className="py-6 text-center text-xs text-muted-foreground">No pending reels.</p>}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Content Appeals</h3>
                  <div className="space-y-3">
                    {appeals.filter((a: any) => a.status === "pending").map((app: any) => (
                      <div key={app.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <p className="text-xs font-semibold">{app.targetType} #{app.targetId}</p>
                        <p className="mt-1 text-xs italic">"{app.reason}"</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => reviewAppealMutation.mutate({ appealId: app.id, status: "approved" }, { onSuccess: () => appealsQuery.refetch() })} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white">Approve</button>
                          <button onClick={() => reviewAppealMutation.mutate({ appealId: app.id, status: "rejected" }, { onSuccess: () => appealsQuery.refetch() })} className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">Reject</button>
                        </div>
                      </div>
                    ))}
                    {!appeals.filter((a: any) => a.status === "pending").length && <p className="py-6 text-center text-xs text-muted-foreground">No pending appeals.</p>}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Safety Queue</h3>
                  <div className="space-y-3">
                    {reports.map((item: any) => (
                      <div key={item.report.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                        <div className="flex items-start justify-between">
                          <div><p className="text-xs font-semibold">{item.report.targetType} #{item.report.targetId}</p><p className="text-[10px] text-muted-foreground">{item.report.reason} · {item.report.status}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => reviewReportMutation.mutate({ reportId: item.report.id, status: "reviewed" }, { onSuccess: () => reportsQuery.refetch() })} className="rounded-xl bg-rose-600 px-3 py-1.5 text-[10px] font-semibold text-white">Keep hidden</button>
                            <button onClick={() => reviewReportMutation.mutate({ reportId: item.report.id, status: "dismissed" }, { onSuccess: () => reportsQuery.refetch() })} className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-semibold">Restore</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!reports.length && <p className="py-6 text-center text-xs text-muted-foreground">Safety queue is empty.</p>}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Recent Posts</h3>
                  <div className="space-y-3">
                    {posts.slice(0, 10).map((post: any) => (
                      <div key={post.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{post.caption || "No caption"}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                        <button onClick={() => deletePostMutation.mutate({ postId: post.id }, { onSuccess: () => postsQuery.refetch() })} className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-violet-600">Promotion Studio</h3>
                  <p className="mb-4 text-xs text-muted-foreground">Manage promoted reels and their priority in the feed.</p>
                  <div className="space-y-4">
                    {reels.filter((r: any) => r.reel.status === "approved").map((item: any) => {
                      const promo = promotions.find((p: any) => p.reel.id === item.reel.id);
                      return (
                        <div key={item.reel.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black"><video src={item.reel.mediaUrl} className="h-full w-full object-cover" /></div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{item.user.name || item.user.username}</p>
                              <p className="text-[10px] text-muted-foreground">Priority: {promo?.promotion.priority || 0}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setReelPromotionMutation.mutate({ reelId: item.reel.id, isPromoted: !promo, priority: 1 }, { onSuccess: () => reelsPromotionsQuery.refetch() })} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition ${promo ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{promo ? "Promoted" : "Promote"}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold">Reels Analytics</h3>
                  <div className="space-y-4">
                    {(reelsAnalyticsQuery.data || []).map((item: any) => (
                      <div key={item.reel.id} className="grid grid-cols-4 gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 text-center">
                        <div className="text-left"><p className="truncate text-[10px] font-bold uppercase text-muted-foreground">Reel</p><p className="truncate text-xs font-semibold">#{item.reel.id}</p></div>
                        <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Views</p><p className="text-xs font-semibold">{item.views}</p></div>
                        <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Likes</p><p className="text-xs font-semibold">{item.likes}</p></div>
                        <div><p className="text-[10px] font-bold uppercase text-muted-foreground">Comments</p><p className="text-xs font-semibold">{item.comments}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-semibold">Moderation Audit Log</h3>
                <div className="space-y-3">
                  {auditLog.map((log: any) => (
                    <div key={log.log.id} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-violet-600">{log.log.action}</p>
                        <p className="text-[9px] text-muted-foreground">{new Date(log.log.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="mt-1 text-[10px]">Actor: {log.actor?.name || "System"} · Target: {log.log.targetType} #{log.log.targetId}</p>
                      {log.log.details && <p className="mt-1 text-[10px] italic text-muted-foreground">{log.log.details}</p>}
                    </div>
                  ))}
                  {!auditLog.length && <p className="py-6 text-center text-xs text-muted-foreground">Audit log is empty.</p>}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
    </div>
  );
}

export function AccountSettings({ user, onClose }: { user: any; onClose: () => void }) {
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [price, setPrice] = useState(user?.subscriptionPrice || "4.99");
  const [newPassword, setNewPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState("avatar.jpg");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; offset: CropOffset } | null>(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const updateMutation = trpc.profile.update.useMutation();
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();
  const confirmResetMutation = trpc.auth.confirmPasswordReset.useMutation();
  const [passwordResetCode, setPasswordResetCode] = useState("");
  const [passwordResetRequested, setPasswordResetRequested] = useState(false);
  const utils = trpc.useUtils();
  const badgeApplicationsQuery = trpc.profile.myBadgeApplications.useQuery();
  const applyBadgeMutation = trpc.profile.applyForBadge.useMutation();
  const [requestedBadge, setRequestedBadge] = useState<"blue" | "black">("blue");
  const [badgeReason, setBadgeReason] = useState("");
  const marketplaceQuery = trpc.marketplace.getSettings.useQuery();
  const [themeColor, setThemeColor] = useState(user?.themeColor || "#8b5cf6");
  const [textColor, setTextColor] = useState(user?.customTextColor || "#ffffff");
  const privacyQuery = trpc.follows.privacy.useQuery();
  const [isPrivate, setIsPrivate] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState((user as any)?.showFollowersList ?? true);
  const [showFollowingList, setShowFollowingList] = useState((user as any)?.showFollowingList ?? true);
  useEffect(() => {
    if (!privacyQuery.data) return;
    setIsPrivate(privacyQuery.data.isPrivate);
    setShowFollowersList(privacyQuery.data.showFollowersList);
    setShowFollowingList(privacyQuery.data.showFollowingList);
  }, [privacyQuery.data]);
  const updatePrivacyMutation = trpc.follows.updatePrivacy.useMutation({
    onSuccess: () => {
      toast.success("List privacy settings updated");
      utils.auth.me.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const base64Mutation = trpc.media.uploadBase64.useMutation();
  const mediaPolicyQuery = trpc.media.policy.useQuery();
  const mediaPolicy = mediaPolicyQuery.data || { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!mediaPolicy.profilePhotosEnabled) { toast.error("Profile photo uploads are temporarily paused by the owner"); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error("Choose a JPG, PNG, WEBP, or GIF photo up to 10 MB"); return; }
    try {
      const source = await blobToDataUrl(file);
      setCropSource(source);
      setCropFileName(file.name.replace(/\.[^.]+$/, "") + "-avatar.jpg");
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    } catch (err: any) {
      toast.error(err.message || "Failed to read image file");
    }
  };

  const saveCroppedPhoto = async () => {
    if (!cropSource || uploading) return;
    try {
      setUploading(true);
      const croppedBlob = await cropAvatarImage(cropSource, cropZoom, cropOffset);
      const base64Data = await blobToDataUrl(croppedBlob);
      const res = await base64Mutation.mutateAsync({ fileName: cropFileName, base64Data, contentType: "image/jpeg", purpose: "profile" });
      await updateMutation.mutateAsync({ avatarUrl: res.url });
      setAvatarUrl(res.url);
      setCropSource(null);
      await utils.auth.me.invalidate();
      toast.success("Profile photo updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
      dragStartRef.current = null;
    }
  };

  const removePhoto = async () => {
    if (!avatarUrl || uploading) return;
    try {
      setUploading(true);
      await updateMutation.mutateAsync({ avatarUrl: null });
      setAvatarUrl("");
      await utils.auth.me.invalidate();
      toast.success("Profile photo removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ name, username, bio, avatarUrl: avatarUrl || null, subscriptionPrice: price }, {
      onSuccess: () => {
        if (newPassword.trim()) {
          if (!passwordResetRequested) {
            requestResetMutation.mutate({ email: user?.email || "" }, {
              onSuccess: (data: any) => {
                setPasswordResetRequested(true);
                toast.success("Verification code sent to your email!", { description: data.message });
              },
              onError: (err: any) => toast.error(err.message),
            });
            return;
          } else {
            if (!passwordResetCode.trim()) {
              toast.error("Please enter the verification code sent to your email");
              return;
            }
            confirmResetMutation.mutate({ email: user?.email || "", code: passwordResetCode.trim(), newPassword: newPassword.trim() }, {
              onSuccess: () => {
                utils.auth.me.invalidate();
                toast.success("Profile and password updated successfully with verification code!");
                onClose();
              },
              onError: (err: any) => toast.error(err.message),
            });
            return;
          }
        }
        utils.auth.me.invalidate();
        toast.success("Account settings saved");
        onClose();
      },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const avatarFallback = initialsAvatar(name || user?.username || "Tanryugram user");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)]" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 border-b border-border/70 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <h2 className="font-display text-xl font-bold">Account Settings</h2>
          <p className="mt-1 text-xs text-muted-foreground">Manage your profile information, profile photo, and creator bio.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [overscroll-behavior:contain] sm:px-6">
          <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
              <SafeImage src={avatarUrl} fallback={avatarFallback} fallbackName={name || user?.username || "Tanryugram user"} loading="lazy" decoding="async" alt={name || "Tanryugram user"} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90 ${!mediaPolicy.profilePhotosEnabled || uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  {uploading ? "Saving photo…" : "Change photo"}
                  <input type="file" accept={mediaPolicy.profilePhotosEnabled ? "image/jpeg,image/png,image/webp,image/gif" : ""} disabled={!mediaPolicy.profilePhotosEnabled || uploading} onChange={handleFileChange} className="hidden" />
                </label>
                <button type="button" onClick={removePhoto} disabled={!avatarUrl || uploading} className="min-h-11 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50">Remove Photo</button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">{mediaPolicy.profilePhotosEnabled ? "Secure profile photo storage · JPG, PNG, WEBP, or GIF up to 10 MB" : "Profile photo uploads are temporarily paused by the owner"}</p>
              {uploading && <p role="status" aria-live="polite" className="mt-2 flex items-center gap-2 text-[11px] font-medium text-violet-600 dark:text-violet-300"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Uploading and saving your profile photo…</p>}
            </div>
          </div>
          {cropSource && <div role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" className="rounded-2xl border border-violet-300/60 bg-violet-500/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p id="avatar-crop-title" className="text-sm font-semibold">Adjust your profile photo</p><p className="mt-1 text-[10px] leading-5 text-muted-foreground">Drag the image to reposition it, then use the zoom slider before saving.</p></div>
              <button type="button" onClick={() => setCropSource(null)} disabled={uploading} aria-label="Cancel crop" className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-50"><X className="h-4 w-4" /></button>
            </div>
            <div className="relative mx-auto mt-4 h-64 w-64 max-w-full touch-none select-none overflow-hidden rounded-2xl bg-muted" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragStartRef.current = { pointerX: event.clientX, pointerY: event.clientY, offset: cropOffset }; }} onPointerMove={(event) => { const start = dragStartRef.current; if (!start) return; setCropOffset({ x: clampCropOffset(start.offset.x + event.clientX - start.pointerX, cropZoom), y: clampCropOffset(start.offset.y + event.clientY - start.pointerY, cropZoom) }); }} onPointerUp={() => { dragStartRef.current = null; }} onPointerCancel={() => { dragStartRef.current = null; }}>
              <img src={cropSource} alt="Profile photo crop preview" draggable={false} className="h-full w-full object-cover" style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`, transformOrigin: "center" }} />
              <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/90 shadow-[inset_0_0_0_999px_rgba(15,23,42,0.12)]" />
            </div>
            <label className="mt-4 block text-[11px] font-semibold">Zoom <input type="range" min="1" max="2.5" step="0.05" value={cropZoom} onChange={(event) => { const zoom = Number(event.target.value); setCropZoom(zoom); setCropOffset((current) => ({ x: clampCropOffset(current.x, zoom), y: clampCropOffset(current.y, zoom) })); }} className="mt-2 w-full accent-violet-600" /></label>
            <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setCropSource(null)} disabled={uploading} className="min-h-11 rounded-xl border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50">Cancel</button><button type="button" onClick={saveCroppedPhoto} disabled={uploading} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-60">{uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}{uploading ? "Saving…" : "Use this photo"}</button></div>
          </div>}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl bg-muted px-4 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl bg-muted px-4 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5 min-h-20 w-full rounded-2xl bg-muted p-4 text-sm outline-none resize-none" />
          </div>
          <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Badge Marketplace</h3>
            <p className="mb-4 text-xs text-muted-foreground">Get verified or unlock premium badges. Some badges require a one-time payment.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["blue", "black", "gold", "vip", "founder", "legend"].map((type) => {
                const setting = marketplaceQuery.data?.marketplace.find((s: any) => s.badgeType === type);
                const isOwned = user?.badgeType === type || user?.secondaryBadgeType === type;
                const canApply = !isOwned && (
                  type === "blue" ? user?.badgeType !== "blue" : 
                  (user?.badgeType === "blue" ? user?.secondaryBadgeType === "none" : user?.badgeType === "none")
                );
                return (
                  <button key={type} disabled={!canApply || isOwned} onClick={() => setRequestedBadge(type as any)} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${requestedBadge === type ? "border-violet-500 bg-violet-500/10" : "border-border bg-muted/40"} ${isOwned ? "opacity-50 grayscale" : !canApply ? "opacity-30 cursor-not-allowed" : "hover:border-violet-300"}`}>
                    <ProfileBadge type={type as any} />
                    <span className="text-xs font-bold uppercase tracking-wider">{type}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{setting?.isPaid ? `$${setting.price}` : "Free"}</span>
                    {isOwned ? <span className="text-[9px] font-bold text-emerald-600">OWNED</span> : !canApply && <span className="text-[9px] font-bold text-rose-500 uppercase">Slot Full</span>}
                  </button>
                );
              })}
            </div>
            {requestedBadge && (
              <div className="mt-5 space-y-4 rounded-2xl bg-muted/30 p-4">
                <p className="text-xs font-semibold">Applying for {requestedBadge.toUpperCase()} Badge</p>
                {marketplaceQuery.data?.marketplace.find((s: any) => s.badgeType === requestedBadge)?.isPaid && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
                    <p className="font-bold">Manual Payment Required</p>
                    <p className="mt-1">To get this badge, please contact the owner and pay via:</p>
                    <ul className="mt-2 space-y-1 list-inside list-disc">
                      {marketplaceQuery.data?.payments.bkashNumber && <li>bKash: {marketplaceQuery.data.payments.bkashNumber}</li>}
                      {marketplaceQuery.data?.payments.nagadNumber && <li>Nagad: {marketplaceQuery.data.payments.nagadNumber}</li>}
                      {marketplaceQuery.data?.payments.paypalEmail && <li>PayPal: {marketplaceQuery.data.payments.paypalEmail}</li>}
                    </ul>
                    {marketplaceQuery.data?.payments.instructions && <p className="mt-2 italic">{marketplaceQuery.data.payments.instructions}</p>}
                  </div>
                )}
                <textarea value={badgeReason} onChange={(e) => setBadgeReason(e.target.value)} placeholder="Add a note or transaction ID..." className="min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none" />
                <button disabled={applyBadgeMutation.isPending} onClick={() => applyBadgeMutation.mutate({ requestedBadge, reason: badgeReason }, { onSuccess: () => { setBadgeReason(""); badgeApplicationsQuery.refetch(); toast.success("Application submitted"); } })} className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700">Submit Application</button>
              </div>
            )}
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Application History</p>
              {(badgeApplicationsQuery.data || []).map((app: any) => (
                <div key={app.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-3 text-[10px]">
                  <div className="flex items-center gap-2"><ProfileBadge type={app.requestedBadge} /><span className="font-bold uppercase">{app.requestedBadge}</span></div>
                  <span className={`rounded-full px-2 py-0.5 font-bold uppercase ${app.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : app.status === "rejected" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>{app.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Profile Customization</h3>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {["#8b5cf6", "#3b82f6", "#ec4899", "#f97316", "#10b981", "#ef4444"].map((color) => (
                    <button key={color} onClick={() => setThemeColor(color)} className={`h-8 w-8 rounded-full border-2 transition ${themeColor === color ? "border-foreground scale-110 shadow-md" : "border-transparent"}`} style={{ backgroundColor: color }} />
                  ))}
                  <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="h-8 w-8 rounded-full border-none p-0 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Text Color</label>
                <div className="flex flex-wrap gap-2">
                  {["#ffffff", "#f8fafc", "#f3f4f6", "#e2e8f0", "#94a3b8", "#64748b"].map((color) => (
                    <button key={color} onClick={() => setTextColor(color)} className={`h-8 w-8 rounded-full border-2 transition ${textColor === color ? "border-foreground scale-110 shadow-md" : "border-transparent"}`} style={{ backgroundColor: color }} />
                  ))}
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-8 rounded-full border-none p-0 cursor-pointer" />
                </div>
              </div>
              <button onClick={() => updateMutation.mutate({ themeColor, customTextColor: textColor }, { onSuccess: () => { utils.auth.me.invalidate(); toast.success("Profile colors updated"); } })} className="w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:border-violet-900/30 dark:bg-violet-900/10 dark:text-violet-300">Save Colors</button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Privacy & Lists</p>
            <div className="space-y-2">
              <button type="button" onClick={() => updatePrivacyMutation.mutate({ isPrivate: !isPrivate })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${isPrivate ? "border-violet-300 bg-violet-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Private account</span><span className="mt-1 block text-[11px] text-muted-foreground">Hide posts and lists from unapproved viewers.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isPrivate ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{isPrivate ? "ON" : "OFF"}</span></button>
              <button type="button" onClick={() => updatePrivacyMutation.mutate({ showFollowersList: !showFollowersList })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${showFollowersList ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Show followers list</span><span className="mt-1 block text-[11px] text-muted-foreground">Allow others to see who follows you.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${showFollowersList ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{showFollowersList ? "ON" : "OFF"}</span></button>
              <button type="button" onClick={() => updatePrivacyMutation.mutate({ showFollowingList: !showFollowingList })} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${showFollowingList ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Show following list</span><span className="mt-1 block text-[11px] text-muted-foreground">Allow others to see who you follow.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${showFollowingList ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{showFollowingList ? "ON" : "OFF"}</span></button>
            </div>
          </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-border/70 bg-muted/20 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={() => setShowBugReport(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition hover:text-rose-500"><Bug className="h-3 w-3" /> Report a bug</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="min-h-11 flex-1 rounded-2xl border border-border px-6 py-2 text-xs font-semibold transition hover:bg-muted sm:flex-none">Cancel</button>
              <button disabled={updateMutation.isPending} onClick={handleSave} className="min-h-11 flex-1 rounded-2xl bg-foreground px-6 py-2 text-xs font-semibold text-background transition hover:opacity-90 sm:flex-none">{updateMutation.isPending ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      </div>
      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
    </div>
  );
}
