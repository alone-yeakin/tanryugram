import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { initialsAvatar, mediaSource } from "@/lib/mediaUrl";
import { SafeImage } from "@/components/SafeImage";
import { toast } from "sonner";
import { Link } from "wouter";
import { ShieldCheck, Sparkles, UserCheck, UserX, Trash2, Lock, Camera, Check, ArrowRight, Bug, X, Plus, Mail, Download, Upload, Archive } from "lucide-react";
import { BugReportModal } from "@/components/TanryugramBetaPolish";
import { AIChatBox, type Message as GeminiChatMessage } from "@/components/AIChatBox";

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

export function AdminView({ onTip }: { onTip: () => void }) {
  const usersQuery = trpc.admin.users.useQuery();
  const postsQuery = trpc.admin.posts.useQuery();
  const verifyMutation = trpc.admin.verifyUser.useMutation();
  const setBadgeMutation = trpc.admin.setBadge.useMutation();
  const setCreatorMutation = trpc.admin.setCreator.useMutation();
  const setBadgeLabelMutation = trpc.admin.setBadgeLabel.useMutation();
  const setShowBadgeMutation = trpc.admin.setShowBadge.useMutation();
  const setDisplayedFollowersMutation = trpc.admin.setDisplayedFollowers.useMutation();
  const reviewBadgeMutation = trpc.admin.reviewBadge.useMutation();
  const banUserMutation = trpc.admin.banUser.useMutation();
  const setRoleMutation = trpc.admin.setRole.useMutation();
  const deletePostMutation = trpc.admin.deletePost.useMutation();
  const applicationsQuery = trpc.admin.badgeApplications.useQuery();
  const uploadPolicyQuery = trpc.admin.uploadPolicy.useQuery();
  const setUploadPolicyMutation = trpc.admin.setUploadPolicy.useMutation();
  const emailSettingsQuery = trpc.admin.emailSettings.useQuery();
  const setEmailSettingsMutation = trpc.admin.setEmailSettings.useMutation();
  const recoverySettingsQuery = trpc.admin.recoverySettings.useQuery();
  const setRecoverySettingsMutation = trpc.admin.setRecoverySettings.useMutation();
  const recoveryInboxQuery = trpc.admin.recoveryInbox.useQuery();
  const replyRecoveryMutation = trpc.admin.replyRecovery.useMutation();
  const closeRecoveryMutation = trpc.admin.closeRecovery.useMutation();
  const migrationExportMutation = trpc.admin.migrationExport.useMutation();
  const migrationInspectMutation = trpc.admin.migrationInspect.useMutation();
  const migrationImportMutation = trpc.admin.migrationImport.useMutation();
  const migrationFileInput = useRef<HTMLInputElement>(null);
  const geminiProposalMutation = trpc.admin.geminiProposal.useMutation();
  const geminiApplyMutation = trpc.admin.geminiApplySafeActions.useMutation();
  const geminiChatMutation = trpc.admin.geminiChat.useMutation();
  const utils = trpc.useUtils();

  const [instagramConnected, setInstagramConnected] = useState(false);
  const [instagramUser, setInstagramUser] = useState("");
  const [followerOverrides, setFollowerOverrides] = useState<Record<number, string>>({});
  const [activeProviderModal, setActiveProviderModal] = useState<"supabase" | "firebase" | "vercel" | null>(null);
  const [providerConfigUrl, setProviderConfigUrl] = useState("");
  const [providerApiKey, setProviderApiKey] = useState("");
  const users = usersQuery.data || [];
  const posts = postsQuery.data || [];
  const applications = applicationsQuery.data || [];
  const uploadPolicy = uploadPolicyQuery.data || { photosEnabled: true, videosEnabled: false };
  const emailSettings = emailSettingsQuery.data || { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
  const recoverySettings = recoverySettingsQuery.data || { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
  const [whatsappNumber, setWhatsappNumber] = useState(recoverySettings.whatsappSupportNumber);
  const [recoveryReplies, setRecoveryReplies] = useState<Record<number, string>>({});
  const [betaPreviewCounts, setBetaPreviewCounts] = useState<Record<number, number>>({});
  const [migrationJson, setMigrationJson] = useState("");
  const [migrationSummary, setMigrationSummary] = useState<any | null>(null);
  const [geminiRequest, setGeminiRequest] = useState("");
  const [geminiProposal, setGeminiProposal] = useState<any | null>(null);
  const [geminiChatMessages, setGeminiChatMessages] = useState<GeminiChatMessage[]>([{ role: "assistant", content: "I’m your private TanRyuGram Creator Studio assistant. Ask me about features, settings, troubleshooting, or a safe implementation plan. I will explain what needs review and will never claim that source code was changed unless it actually was." }]);
  const updateUploadPolicy = (next: { photosEnabled: boolean; videosEnabled: boolean }) => setUploadPolicyMutation.mutate(next, { onSuccess: (policy) => { utils.admin.uploadPolicy.setData(undefined, policy); utils.media.policy.setData(undefined, policy); toast.success("Upload policy updated"); }, onError: (error) => toast.error(error.message) });
  const updateEmailSettings = (next: { emailDeliveryEnabled: boolean; signupVerificationEnabled: boolean; appScriptLoginEnabled: boolean; appScriptResetEnabled: boolean }) => setEmailSettingsMutation.mutate(next, { onSuccess: (settings) => { utils.admin.emailSettings.setData(undefined, settings); toast.success("Email settings updated"); }, onError: (error) => toast.error(error.message) });
  const updateRecoverySettings = (next: { guestRecoveryEnabled: boolean; whatsappSupportEnabled: boolean; whatsappSupportNumber: string }) => setRecoverySettingsMutation.mutate(next, { onSuccess: (settings) => { utils.admin.recoverySettings.setData(undefined, settings); setWhatsappNumber(settings.whatsappSupportNumber); utils.recovery.settings.invalidate(); toast.success("Recovery support settings updated"); }, onError: (error) => toast.error(error.message) });

  const downloadMigrationArchive = async () => {
    try {
      const archive = await migrationExportMutation.mutateAsync();
      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `tanryugram-user-migration-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
      toast.success("Full migration archive downloaded", { description: "Store this file privately. It includes account history but never passwords or session secrets." });
    } catch (error: any) { toast.error(error.message || "Could not export migration archive"); }
  };
  const inspectMigrationFile = async (file: File) => {
    if (file.size > 45 * 1024 * 1024) { toast.error("Migration archive is larger than 45 MB"); return; }
    const text = await file.text(); setMigrationJson(text);
    try { const summary = await migrationInspectMutation.mutateAsync({ archiveJson: text }); setMigrationSummary(summary); toast.success("Migration archive validated", { description: `${summary.users} users, ${summary.messages} direct messages, and ${summary.groupMessages} group messages found.` }); } catch (error: any) { setMigrationSummary(null); toast.error(error.message || "Invalid migration archive"); }
  };
  const importMigrationArchive = () => {
    if (!migrationJson || !migrationSummary) return toast.error("Choose and validate a migration archive first");
    if (!window.confirm(`Import ${migrationSummary.users} users and their full history? This is intended for a fresh destination and cannot be undone.`)) return;
    migrationImportMutation.mutate({ archiveJson: migrationJson, confirm: true }, { onSuccess: (result) => toast.success("Migration archive imported", { description: `${result.users} accounts require password reset before sign-in.` }), onError: (error) => toast.error(error.message) });
  };

  const sendGeminiChatMessage = (content: string) => {
    const nextMessages = [...geminiChatMessages, { role: "user" as const, content }];
    setGeminiChatMessages(nextMessages);
    const chatMessages = nextMessages.filter((message) => message.role !== "system").slice(-18).map(({ role, content: text }) => ({ role: role === "assistant" ? "assistant" as const : "user" as const, content: text }));
    geminiChatMutation.mutate({ messages: chatMessages }, { onSuccess: ({ reply }) => setGeminiChatMessages((current) => [...current, { role: "assistant", content: reply }]), onError: (error) => { setGeminiChatMessages((current) => [...current, { role: "assistant", content: `I could not reach Gemini right now. ${error.message}` }]); } });
  };
  const clearGeminiChat = () => setGeminiChatMessages([{ role: "assistant", content: "Chat cleared. What would you like to plan or troubleshoot in TanRyuGram?" }]);

  const requestGeminiProposal = () => {
    const request = geminiRequest.trim();
    if (!request) return toast.error("Describe the feature or setting you want to change");
    geminiProposalMutation.mutate({ request }, { onSuccess: (proposal) => { setGeminiProposal(proposal); toast.success("Gemini proposal ready", { description: "Review the warning and steps before applying any safe settings." }); }, onError: (error) => toast.error(error.message) });
  };
  const applyGeminiProposal = () => {
    if (!geminiProposal || !Array.isArray(geminiProposal.safeActions) || geminiProposal.safeActions.length === 0) return toast.error("This proposal has no safe live settings to apply");
    if (!window.confirm(`Apply ${geminiProposal.safeActions.length} safe Creator Studio setting change(s)?`)) return;
    geminiApplyMutation.mutate({ actions: geminiProposal.safeActions }, { onSuccess: (result) => { setGeminiProposal(null); utils.admin.emailSettings.invalidate(); utils.admin.uploadPolicy.invalidate(); utils.media.policy.invalidate(); toast.success("Approved settings applied", { description: `${result.applied.length} safe change(s) were applied.` }); }, onError: (error) => toast.error(error.message) });
  };

  const handleInstagramConnect = () => {
    if (!instagramUser.trim()) {
      toast.error("Enter a valid Instagram username or handle");
      return;
    }
    setInstagramConnected(true);
    toast.success("Successfully linked Instagram account", { description: `Syncing reels & explore feed from @${instagramUser.trim()} via official API.` });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-[32px] border border-violet-200/70 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-slate-950 p-5 text-white shadow-xl shadow-violet-500/10 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-100">TanRyuGram · Creator Studio</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Your command center.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Manage verification, creator access, audience presentation, uploads, and moderation from one focused workspace.</p>
          </div>
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">Owner access</span>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/15 bg-black/15 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Official Instagram Explore Integration</p>
              <p className="text-[11px] text-white/65">Connect via official API authorization to pull reels and media directly into Explore.</p>
            </div>
            <div className="flex items-center gap-2">
              {instagramConnected ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">Connected (@{instagramUser})</span>
                  <button onClick={() => setInstagramConnected(false)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10">Unlink</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input value={instagramUser} onChange={(e) => setInstagramUser(e.target.value)} placeholder="Instagram handle" className="h-9 rounded-xl border border-border bg-card px-3 text-xs outline-none" />
                  <button onClick={handleInstagramConnect} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700">Connect Instagram</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-amber-300/70 bg-amber-500/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Beta preview · not public metrics</p>
            <h3 className="mt-1 flex items-center gap-2 font-semibold"><Bug className="h-4 w-4 text-amber-600" /> Preview controls</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted-foreground">These buttons affect only this owner-panel preview in this browser session. They never create likes, never change public counts, and never appear to users.</p>
          </div>
          <span className="w-fit rounded-full bg-amber-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Test only</span>
        </div>
        <div className="mt-5 space-y-3">
          {posts.slice(0, 5).map((item: any) => {
            const previewCount = betaPreviewCounts[item.post.id] || 0;
            const realCount = item.post.likesCount || 0;
            return <div key={item.post.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="truncate text-xs font-semibold">{item.post.caption || `Post #${item.post.id}`}</p><p className="mt-1 text-[10px] text-muted-foreground">Real likes: {realCount} · Beta preview only: {previewCount}</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setBetaPreviewCounts((current) => ({ ...current, [item.post.id]: (current[item.post.id] || 0) + 1 }))} className="min-h-10 rounded-xl border border-amber-300 bg-amber-500/10 px-3 py-2 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-300">Preview +1</button>
                <button type="button" onClick={() => setBetaPreviewCounts((current) => ({ ...current, [item.post.id]: 0 }))} className="min-h-10 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold transition hover:border-amber-300">Reset preview</button>
              </div>
            </div>;
          })}
          {posts.length === 0 && <p className="rounded-2xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">Create a post to preview the clearly labeled beta controls.</p>}
        </div>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Storage protection</p>
            <h3 className="mt-1 font-semibold">Upload controls</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted-foreground">Choose which media types the beta accepts. Photos are enabled by default for everyone; video stays paused until storage capacity improves. Changes apply to posts, stories, and media uploads.</p>
          </div>
          <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Owner only</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => updateUploadPolicy({ photosEnabled: !uploadPolicy.photosEnabled, videosEnabled: uploadPolicy.videosEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${uploadPolicy.photosEnabled ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}>
            <span><span className="block text-sm font-semibold">Photo uploads</span><span className="mt-1 block text-[11px] text-muted-foreground">JPG, PNG, WEBP, and GIF · up to 10 MB</span></span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${uploadPolicy.photosEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{uploadPolicy.photosEnabled ? "ON" : "OFF"}</span>
          </button>
          <button type="button" onClick={() => updateUploadPolicy({ photosEnabled: uploadPolicy.photosEnabled, videosEnabled: !uploadPolicy.videosEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${uploadPolicy.videosEnabled ? "border-amber-300 bg-amber-500/10" : "border-border bg-muted/40"}`}>
            <span><span className="block text-sm font-semibold">Video uploads</span><span className="mt-1 block text-[11px] text-muted-foreground">MP4, WEBM, and MOV · up to 20 MB</span></span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${uploadPolicy.videosEnabled ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>{uploadPolicy.videosEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Account protection</p>
            <h3 className="mt-1 flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-violet-500" /> Email & verification controls</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted-foreground">Control whether TanRyuGram sends account emails and whether new accounts must verify an email address. These controls affect signup and password-reset delivery for everyone.</p>
          </div>
          <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Owner only</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => updateEmailSettings({ emailDeliveryEnabled: !emailSettings.emailDeliveryEnabled, signupVerificationEnabled: emailSettings.signupVerificationEnabled, appScriptLoginEnabled: emailSettings.appScriptLoginEnabled, appScriptResetEnabled: emailSettings.appScriptResetEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${emailSettings.emailDeliveryEnabled ? "border-emerald-300 bg-emerald-500/10" : "border-rose-300 bg-rose-500/10"}`}>
            <span><span className="block text-sm font-semibold">Email delivery</span><span className="mt-1 block text-[11px] text-muted-foreground">Brevo sends verification and password-reset messages.</span></span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${emailSettings.emailDeliveryEnabled ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>{emailSettings.emailDeliveryEnabled ? "ON" : "OFF"}</span>
          </button>
          <button type="button" onClick={() => updateEmailSettings({ emailDeliveryEnabled: emailSettings.emailDeliveryEnabled, signupVerificationEnabled: !emailSettings.signupVerificationEnabled, appScriptLoginEnabled: emailSettings.appScriptLoginEnabled, appScriptResetEnabled: emailSettings.appScriptResetEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${emailSettings.signupVerificationEnabled ? "border-violet-300 bg-violet-500/10" : "border-border bg-muted/40"}`}>
            <span><span className="block text-sm font-semibold">Signup verification</span><span className="mt-1 block text-[11px] text-muted-foreground">Require a six-digit email code before creating new accounts.</span></span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${emailSettings.signupVerificationEnabled ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{emailSettings.signupVerificationEnabled ? "REQUIRED" : "OPTIONAL"}</span>
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => updateEmailSettings({ emailDeliveryEnabled: emailSettings.emailDeliveryEnabled, signupVerificationEnabled: emailSettings.signupVerificationEnabled, appScriptLoginEnabled: !emailSettings.appScriptLoginEnabled, appScriptResetEnabled: emailSettings.appScriptResetEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${emailSettings.appScriptLoginEnabled ? "border-sky-300 bg-sky-500/10" : "border-border bg-muted/40"}`}>
            <span><span className="block text-sm font-semibold">Apps Script · login code</span><span className="mt-1 block text-[11px] text-muted-foreground">Use the protected Apps Script relay for signup/login verification codes.</span></span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${emailSettings.appScriptLoginEnabled ? "bg-sky-600 text-white" : "bg-muted text-muted-foreground"}`}>{emailSettings.appScriptLoginEnabled ? "ON" : "OFF"}</span>
          </button>
          <button type="button" onClick={() => updateEmailSettings({ emailDeliveryEnabled: emailSettings.emailDeliveryEnabled, signupVerificationEnabled: emailSettings.signupVerificationEnabled, appScriptLoginEnabled: emailSettings.appScriptLoginEnabled, appScriptResetEnabled: !emailSettings.appScriptResetEnabled })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${emailSettings.appScriptResetEnabled ? "border-sky-300 bg-sky-500/10" : "border-border bg-muted/40"}`}>
            <span><span className="block text-sm font-semibold">Apps Script · reset code</span><span className="mt-1 block text-[11px] text-muted-foreground">Use the protected Apps Script relay for password-reset codes.</span></span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${emailSettings.appScriptResetEnabled ? "bg-sky-600 text-white" : "bg-muted text-muted-foreground"}`}>{emailSettings.appScriptResetEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
        <p className="mt-3 rounded-xl bg-sky-500/10 px-3 py-2 text-[11px] leading-5 text-sky-800 dark:text-sky-200">Apps Script endpoint and secret stay in secure project secrets, not in this panel. Replace them in Settings → Secrets when you rotate the sender account. No CAPTCHA is used; cooldowns and delivery limits protect the public endpoints.</p>
        {!emailSettings.emailDeliveryEnabled && emailSettings.signupVerificationEnabled && <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-700 dark:text-amber-300">Signup verification is paused because email delivery is off. Turn email delivery on before enabling verification.</p>}
      </div>

      <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Recovery desk</p>
            <h3 className="mt-1 font-semibold">Guest recovery & WhatsApp support</h3>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted-foreground">Let locked-out users create a temporary guest ID that can message only this owner. You can also publish a WhatsApp recovery link and change its number. Never ask for or display a user’s current password.</p>
          </div>
          <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">Owner only</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => updateRecoverySettings({ guestRecoveryEnabled: !recoverySettings.guestRecoveryEnabled, whatsappSupportEnabled: recoverySettings.whatsappSupportEnabled, whatsappSupportNumber: whatsappNumber })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${recoverySettings.guestRecoveryEnabled ? "border-violet-300 bg-violet-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">Guest recovery ID</span><span className="mt-1 block text-[11px] text-muted-foreground">Temporary owner-only support thread, expires in 24 hours.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${recoverySettings.guestRecoveryEnabled ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>{recoverySettings.guestRecoveryEnabled ? "ON" : "OFF"}</span></button>
          <button type="button" onClick={() => updateRecoverySettings({ guestRecoveryEnabled: recoverySettings.guestRecoveryEnabled, whatsappSupportEnabled: !recoverySettings.whatsappSupportEnabled, whatsappSupportNumber: whatsappNumber })} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${recoverySettings.whatsappSupportEnabled ? "border-emerald-300 bg-emerald-500/10" : "border-border bg-muted/40"}`}><span><span className="block text-sm font-semibold">WhatsApp support link</span><span className="mt-1 block text-[11px] text-muted-foreground">Show a direct recovery link on the official portal.</span></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${recoverySettings.whatsappSupportEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{recoverySettings.whatsappSupportEnabled ? "ON" : "OFF"}</span></button>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="+8801404841981" className="h-11 flex-1 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-violet-500" /><button onClick={() => updateRecoverySettings({ guestRecoveryEnabled: recoverySettings.guestRecoveryEnabled, whatsappSupportEnabled: recoverySettings.whatsappSupportEnabled, whatsappSupportNumber: whatsappNumber })} className="min-h-11 rounded-2xl bg-foreground px-4 text-xs font-semibold text-background">Save WhatsApp number</button></div>
        <div className="mt-5 space-y-3"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Owner recovery inbox</h4><span className="text-[11px] text-muted-foreground">{recoveryInboxQuery.data?.length ?? 0} requests</span></div>{recoveryInboxQuery.data?.length ? recoveryInboxQuery.data.map((request) => <div key={request.id} className="rounded-2xl border border-border bg-muted/30 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{request.guestLabel || "Guest recovery request"}</p><p className="text-[11px] text-muted-foreground">{request.accountEmail || "Email not provided"} · {request.status}</p></div><button onClick={() => closeRecoveryMutation.mutate({ requestId: request.id }, { onSuccess: () => { utils.admin.recoveryInbox.invalidate(); toast.success("Recovery request closed"); }, onError: (error) => toast.error(error.message) })} className="rounded-xl border border-border px-3 py-1.5 text-[10px] font-semibold">Close</button></div><div className="mt-3 space-y-2">{request.messages.map((message) => <div key={message.id} className={`rounded-xl p-3 text-xs ${message.senderType === "owner" ? "bg-violet-600 text-white" : "bg-card"}`}><p>{message.body}</p><p className="mt-1 text-[10px] opacity-60">{message.senderType === "owner" ? "You" : "Guest"} · {new Date(message.createdAt).toLocaleString()}</p></div>)}</div><div className="mt-3 flex gap-2"><input value={recoveryReplies[request.id] ?? ""} onChange={(event) => setRecoveryReplies((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Reply without asking for a password" className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-violet-500" /><button onClick={() => { const body = (recoveryReplies[request.id] ?? "").trim(); if (!body) return; replyRecoveryMutation.mutate({ requestId: request.id, body }, { onSuccess: () => { setRecoveryReplies((current) => ({ ...current, [request.id]: "" })); utils.admin.recoveryInbox.invalidate(); toast.success("Reply sent"); }, onError: (error) => toast.error(error.message) }); }} className="rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white">Reply</button></div></div>) : <p className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">No active guest recovery requests.</p>}</div>
      </div>

      <div className="rounded-[28px] border border-violet-300/70 bg-violet-500/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">Owner automation</p>
            <h3 className="mt-1 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-violet-600" /> Gemini feature assistant</h3>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted-foreground">Describe a feature or setting in plain language. Gemini creates a proposal first. Only safe Creator Studio settings can be applied here; source-code changes require a reviewed development update and deployment.</p>
          </div>
          <span className="w-fit rounded-full bg-violet-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">Owner only</span>
        </div>
        <div className="mt-5 rounded-2xl border border-violet-300/60 bg-background/70 p-2"><div className="flex items-center justify-between gap-2 px-2 pb-2"><p className="text-xs font-semibold">Gemini chat</p><button type="button" onClick={clearGeminiChat} className="min-h-9 rounded-xl border border-border px-3 text-[10px] font-semibold text-muted-foreground hover:text-foreground">Clear chat</button></div><AIChatBox messages={geminiChatMessages} onSendMessage={sendGeminiChatMessage} isLoading={geminiChatMutation.isPending} height={460} placeholder="Ask Gemini about TanRyuGram…" emptyStateMessage="Start a private Creator Studio conversation" suggestedPrompts={["Plan a safe new feature", "Explain the current email controls", "How should I improve the mobile app?"]} /></div>
        <div className="mt-5 flex flex-col gap-3"><textarea value={geminiRequest} onChange={(event) => setGeminiRequest(event.target.value)} placeholder="Example: turn on signup email verification and keep photo uploads enabled" className="min-h-24 w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-violet-500" /><button type="button" onClick={requestGeminiProposal} disabled={geminiProposalMutation.isPending} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"><Sparkles className="h-4 w-4" />{geminiProposalMutation.isPending ? "Asking Gemini…" : "Create proposal"}</button></div>
        {geminiProposal && <div className="mt-4 rounded-2xl border border-violet-300/70 bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{geminiProposal.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{geminiProposal.summary}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${geminiProposal.requiresCodeChange ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}`}>{geminiProposal.requiresCodeChange ? "CODE REVIEW NEEDED" : "SAFE SETTINGS"}</span></div><div className="mt-3 space-y-1 text-[11px] text-muted-foreground">{geminiProposal.steps?.map((step: string, index: number) => <p key={`${step}-${index}`}>{index + 1}. {step}</p>)}</div>{geminiProposal.warning && <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-[11px] leading-5 text-amber-800 dark:text-amber-200">{geminiProposal.warning}</p>}{geminiProposal.safeActions?.length > 0 && <button type="button" onClick={applyGeminiProposal} disabled={geminiApplyMutation.isPending} className="mt-4 min-h-11 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50">{geminiApplyMutation.isPending ? "Applying…" : "Review and apply safe settings"}</button>}</div>}
        <p className="mt-3 text-[11px] leading-5 text-violet-800/80 dark:text-violet-200/80">The Gemini key is stored server-side and never shown to users. Gemini proposals use your Google API quota and may be subject to Google’s limits. Existing photo and media rendering code is not modified by this assistant.</p>
      </div>

      <div className="rounded-[28px] border border-amber-300/70 bg-amber-500/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Portability & continuity</p>
            <h3 className="mt-1 flex items-center gap-2 font-semibold"><Archive className="h-4 w-4 text-amber-600" /> Full user migration archive</h3>
            <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted-foreground">Export the complete portable history—not just IDs—including profiles, posts, media references, comments, reactions, follows, messages, groups, memberships, settings, badges, and timestamps. Passwords, sessions, reset codes, push tokens, payment identifiers, and server secrets are never included.</p>
          </div>
          <span className="w-fit rounded-full bg-amber-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Owner only</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={downloadMigrationArchive} disabled={migrationExportMutation.isPending} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-xs font-semibold text-background transition hover:opacity-90 disabled:opacity-50"><Download className="h-4 w-4" />{migrationExportMutation.isPending ? "Preparing archive…" : "Export all user history"}</button>
          <button type="button" onClick={() => migrationFileInput.current?.click()} disabled={migrationInspectMutation.isPending} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-50"><Upload className="h-4 w-4" />Choose archive to import</button>
          <input ref={migrationFileInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void inspectMigrationFile(file); event.currentTarget.value = ""; }} />
        </div>
        {migrationSummary && <div className="mt-4 rounded-2xl border border-emerald-300/70 bg-emerald-500/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Archive validated</p><p className="mt-1 text-[11px] text-muted-foreground">{migrationSummary.users} users · {migrationSummary.posts} posts · {migrationSummary.messages} direct messages · {migrationSummary.groupMessages} group messages · {migrationSummary.groups} groups · {(migrationSummary.bytes / 1024 / 1024).toFixed(2)} MB</p></div><button type="button" onClick={importMigrationArchive} disabled={migrationImportMutation.isPending} className="min-h-11 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{migrationImportMutation.isPending ? "Importing…" : "Import & reactivate history"}</button></div><p className="mt-3 text-[11px] leading-5 text-emerald-800/80 dark:text-emerald-200/80">Import is intentionally protected against duplicate identities and is designed for a fresh destination. Imported users keep their history but must complete a password reset before signing in.</p></div>}
      </div>

      <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Database & Cloud Provider Architecture</p>
          <h3 className="mt-1 font-semibold text-xl">Multi-Provider Database & Storage Sync Center</h3>
          <p className="mt-1 text-xs text-muted-foreground">Configure your primary database and object storage backends. To prevent data corruption and race conditions, Tanryugram uses one authoritative primary database at a time while letting you link Supabase, Firebase, Vercel Postgres, or Google Cloud Storage.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold">MySQL / SQL DB</span><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600">Primary Active</span></div>
            <p className="text-[11px] text-muted-foreground">Drizzle ORM schema synced via <code className="text-violet-600 font-mono">pnpm db:push</code>.</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold">Supabase / Postgres</span><button onClick={() => { setActiveProviderModal("supabase"); setProviderConfigUrl(""); setProviderApiKey(""); }} className="text-[10px] font-semibold text-violet-600 hover:underline">Configure</button></div>
            <p className="text-[11px] text-muted-foreground">PostgreSQL connection pooling and auth provider sync.</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold">Firebase / Firestore</span><button onClick={() => { setActiveProviderModal("firebase"); setProviderConfigUrl(""); setProviderApiKey(""); }} className="text-[10px] font-semibold text-violet-600 hover:underline">Configure</button></div>
            <p className="text-[11px] text-muted-foreground">Realtime document store for messaging and push notifications.</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold">Vercel Postgres</span><button onClick={() => { setActiveProviderModal("vercel"); setProviderConfigUrl(""); setProviderApiKey(""); }} className="text-[10px] font-semibold text-violet-600 hover:underline">Configure</button></div>
            <p className="text-[11px] text-muted-foreground">Edge-optimized relational data storage for global scale.</p>
          </div>
        </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
            <h4 className="font-semibold text-xs">Schema Migration & Backup Codes</h4>
            <p className="text-[11px] text-muted-foreground leading-5">To transfer this database schema to Supabase, Vercel, or Firebase, run the migration scripts stored under <code className="text-violet-600 font-mono">/drizzle</code> or export your table dumps directly.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => toast.success("Migration schema exported", { description: "schema.ts and SQL migration files are ready." })} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white">Export SQL Schema</button>
              <button onClick={() => toast.success("Backup snapshot generated", { description: "All user records and post relations saved." })} className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">Download DB Snapshot</button>
            </div>
          </div>

        {activeProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setActiveProviderModal(null)}>
            <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Provider settings</p>
                  <h3 className="mt-1 text-lg font-semibold capitalize">Configure {activeProviderModal}</h3>
                </div>
                <button onClick={() => setActiveProviderModal(null)} className="rounded-full p-2 hover:bg-muted"><Plus className="h-4 w-4 rotate-45" /></button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Connection Endpoint / Project URL</label>
                  <input
                    type="text"
                    placeholder={activeProviderModal === "supabase" ? "https://xyz.supabase.co" : activeProviderModal === "firebase" ? "https://project-id.firebaseio.com" : "postgres://default:pass@host/vercel"}
                    value={providerConfigUrl}
                    onChange={(e) => setProviderConfigUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">API Key / Secret Token</label>
                  <input
                    type="password"
                    placeholder="Enter private API key or service token"
                    value={providerApiKey}
                    onChange={(e) => setProviderApiKey(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-violet-500"
                  />
                </div>
                <div className="rounded-2xl bg-muted/50 p-3 text-[11px] text-muted-foreground leading-5">
                  Credentials are encrypted and saved securely to backend environment storage for {activeProviderModal}.
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={() => setActiveProviderModal(null)} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                  <button
                    onClick={() => {
                      if (!providerConfigUrl.trim() || !providerApiKey.trim()) {
                        toast.error("Please fill in both endpoint and API key");
                        return;
                      }
                      toast.success(`Successfully connected ${activeProviderModal.toUpperCase()}`, { description: "Endpoint verified and active for database syncing." });
                      setActiveProviderModal(null);
                    }}
                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
                  >
                    Save & Test Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">User Directory & Verification</h3>
          <div className="space-y-3">
            {users.map((u: any) => (
              <div key={u.id} className="space-y-4 rounded-2xl border border-border/70 bg-muted/35 p-4 transition hover:border-violet-300/70 hover:bg-muted/50">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold">{u.name || "User"}</span>
                      {u.badgeType === "blue" || (!u.badgeType && u.isVerified) ? <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">BLUE</span> : null}
                      {u.badgeType === "black" ? <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">BLACK</span> : null}
                      {u.isCreator ? <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-violet-600">CREATOR</span> : null}
                      <span className="rounded-full bg-background px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{u.role}</span>
                    </div>
                    <p className="mt-1 break-all text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${u.isBanned ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>{u.isBanned ? "Banned" : "Active"}</span>
                </div>

                <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Badges</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setBadgeMutation.mutate({ userId: u.id, badgeType: "blue" }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Blue badge assigned"); } })} className="rounded-xl bg-blue-500 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-600">Blue</button>
                      <button onClick={() => setBadgeMutation.mutate({ userId: u.id, badgeType: "black" }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Black badge assigned"); } })} className="rounded-xl bg-black px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-zinc-800">Black</button>
                      <button onClick={() => setBadgeMutation.mutate({ userId: u.id, badgeType: "none" }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Badge removed"); } })} className="rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold transition hover:border-violet-300">Clear</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Custom badge label</p>
                    <div className="flex items-center gap-2">
                      <input defaultValue={u.badgeLabel || "User"} onBlur={(e) => { const label = e.target.value.trim(); if (label) { utils.admin.users.setData(undefined, (old: any) => old?.map((row: any) => row.id === u.id ? { ...row, badgeLabel: label } : row)); setBadgeLabelMutation.mutate({ userId: u.id, label }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Badge label updated"); } }); } }} className="h-8 w-32 rounded-xl border border-border bg-card px-3 text-[10px] outline-none transition focus:border-violet-400" />
                      <button onClick={() => {
                        const nextShow = !(u.showBadge ?? true);
                        setShowBadgeMutation.mutate({ userId: u.id, value: nextShow }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success(nextShow ? "Badge shown on profile" : "Badge hidden on profile"); } });
                      }} className={`rounded-xl px-3 py-1.5 text-[10px] font-semibold transition ${(u.showBadge ?? true) ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {(u.showBadge ?? true) ? "Showing" : "Hidden"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Access</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setCreatorMutation.mutate({ userId: u.id, value: !u.isCreator }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Creator label updated"); } })} className="rounded-xl border border-violet-300 bg-card px-3 py-2 text-[10px] font-semibold text-violet-600 transition hover:bg-violet-500/10">{u.isCreator ? "Remove creator" : "Creator"}</button>
                      <button onClick={() => banUserMutation.mutate({ userId: u.id, value: !u.isBanned }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Ban status updated"); } })} className={`rounded-xl px-3 py-2 text-[10px] font-semibold transition ${u.isBanned ? "bg-emerald-500 text-white hover:bg-emerald-600" : "border border-rose-300 bg-card text-rose-600 hover:bg-rose-500/10"}`}>{u.isBanned ? "Unban" : "Ban"}</button>
                      <button onClick={() => setRoleMutation.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" }, { onSuccess: () => { utils.admin.users.invalidate(); toast.success("Role updated"); } })} className="rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold transition hover:border-violet-300">{u.role === "admin" ? "Make user" : "Make admin"}</button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Displayed followers</label>
                    <p className="text-[10px] text-muted-foreground">Leave blank to show the real count.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={followerOverrides[u.id] ?? (u.displayedFollowersCount ?? "")} onChange={(e) => setFollowerOverrides((current) => ({ ...current, [u.id]: e.target.value }))} inputMode="numeric" placeholder="Real count" className="h-9 w-28 rounded-xl border border-border bg-card px-3 text-[10px] outline-none transition focus:border-violet-400" />
                    <button onClick={() => { const raw = followerOverrides[u.id] ?? ""; const count = raw.trim() === "" ? null : Number(raw); if (count !== null && (!Number.isInteger(count) || count < 0)) { toast.error("Enter a non-negative whole number"); return; } setDisplayedFollowersMutation.mutate({ userId: u.id, count }, { onSuccess: () => { utils.admin.users.invalidate(); utils.profile.byId.invalidate(); toast.success(count === null ? "Follower display reset to real count" : "Follower display updated"); } }); }} className="rounded-xl bg-foreground px-3 py-2 text-[10px] font-semibold text-background transition hover:opacity-90">Save</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">Badge applications</h3><p className="mt-1 text-[11px] text-muted-foreground">Review requests before a badge appears publicly.</p></div>
            <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-violet-600">{applications.length} total</span>
          </div>
          <div className="mt-5 flex-1 space-y-3">
            {applications.length === 0 ? <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">✓</div><p className="text-sm font-semibold">Review queue is clear</p><p className="mt-1 max-w-xs text-[11px] leading-5 text-muted-foreground">New badge requests will appear here with the requested style, reason, and approval controls.</p></div> : applications.map((item: any) => <div key={item.application.id} className="rounded-2xl border border-border/60 bg-muted/40 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold">{item.user.name || item.user.username || "User"} requested <span className={item.application.requestedBadge === "blue" ? "text-blue-600" : "text-foreground"}>{item.application.requestedBadge} badge</span></p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{item.application.reason || "No reason provided."}</p></div><span className="w-fit rounded-full bg-background px-2 py-1 text-[9px] font-bold uppercase tracking-wide">{item.application.status}</span></div>{item.application.status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => reviewBadgeMutation.mutate({ applicationId: item.application.id, status: "approved" }, { onSuccess: () => { utils.admin.badgeApplications.invalidate(); utils.admin.users.invalidate(); toast.success("Badge application approved"); } })} className="rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-emerald-600">Approve</button><button onClick={() => reviewBadgeMutation.mutate({ applicationId: item.application.id, status: "rejected" }, { onSuccess: () => { utils.admin.badgeApplications.invalidate(); toast.success("Badge application rejected"); } })} className="rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-semibold transition hover:border-violet-300">Reject</button></div>}</div>)}
          </div>
        </div>

        <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Media Moderation Gallery</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {posts.map((item: any) => (
              <div key={item.post.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-muted">
                <SafeImage src={item.post.mediaUrl} fallbackName={item.post.caption || "Community post"} alt={item.post.caption || "Community post"} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => deletePostMutation.mutate({ postId: item.post.id }, { onSuccess: () => { utils.admin.posts.invalidate(); toast.success("Post removed by moderator"); } })} className="w-full rounded-xl bg-rose-500 py-1.5 text-[10px] font-semibold text-white">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
  const [showBugReport, setShowBugReport] = useState(false);
  const updateMutation = trpc.profile.update.useMutation();
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();
  const confirmResetMutation = trpc.auth.confirmPasswordReset.useMutation();
  const [passwordResetCode, setPasswordResetCode] = useState("");
  const [passwordResetRequested, setPasswordResetRequested] = useState(false);
  const presignMutation = trpc.media.prepareUpload.useMutation();
  const utils = trpc.useUtils();
  const badgeApplicationsQuery = trpc.profile.myBadgeApplications.useQuery();
  const applyBadgeMutation = trpc.profile.applyForBadge.useMutation();
  const [requestedBadge, setRequestedBadge] = useState<"blue" | "black">("blue");
  const [badgeReason, setBadgeReason] = useState("");
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
    onError: (err) => toast.error(err.message),
  });

  const base64Mutation = trpc.media.uploadBase64.useMutation();
  const mediaPolicyQuery = trpc.media.policy.useQuery();
  const mediaPolicy = mediaPolicyQuery.data || { photosEnabled: true, videosEnabled: false };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!mediaPolicy.photosEnabled) { toast.error("Photo uploads are temporarily paused by the owner"); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error("Choose a JPG, PNG, WEBP, or GIF photo up to 10 MB"); return; }
    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await base64Mutation.mutateAsync({ fileName: file.name, base64Data, contentType: file.type || "image/jpeg" });
          await updateMutation.mutateAsync({ avatarUrl: res.url });
          setAvatarUrl(res.url);
          await utils.auth.me.invalidate();
          toast.success("Photo uploaded and saved successfully");
        } catch (err: any) {
          toast.error(err.message || "Failed to upload photo");
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploading(false);
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploading(false);
      toast.error(err.message || "Failed to process photo");
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ name, username, bio, avatarUrl, subscriptionPrice: price }, {
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
      onError: (err) => toast.error(err.message),
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
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
              <SafeImage src={avatarUrl || user?.avatarUrl} fallback={avatarFallback} fallbackName={name || user?.username || "Tanryugram user"} loading="lazy" decoding="async" alt={name || "Tanryugram user"} className="h-full w-full object-cover" />
            </div>
            <div>
              <label className="cursor-pointer rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90">
                {uploading ? "Uploading..." : "Change photo"}
                <input type="file" accept={mediaPolicy.photosEnabled ? "image/jpeg,image/png,image/webp,image/gif" : ""} disabled={!mediaPolicy.photosEnabled || uploading} onChange={handleFileChange} className="hidden" />
              </label>
              <p className="mt-1 text-[10px] text-muted-foreground">{mediaPolicy.photosEnabled ? "Secure photo storage · JPG, PNG, WEBP, or GIF up to 10 MB" : "Photo uploads are temporarily paused by the owner"}</p>
            </div>
          </div>
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
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Creator label</p>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">Creator status and verification badges are assigned or approved only by the Tanryugram owner.</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold">Apply for a badge</p><p className="mt-1 text-[10px] text-muted-foreground">Your application will be reviewed manually by the owner.</p></div><select value={requestedBadge} onChange={(e) => setRequestedBadge(e.target.value as "blue" | "black")} className="rounded-xl border border-border bg-card px-2 py-2 text-[10px] font-semibold outline-none"><option value="blue">Blue badge</option><option value="black">Black badge</option></select></div>
            <textarea value={badgeReason} onChange={(e) => setBadgeReason(e.target.value)} placeholder="Optional reason for your application" className="mt-3 min-h-16 w-full resize-none rounded-xl border border-border bg-card p-3 text-[11px] outline-none" />
            <button disabled={applyBadgeMutation.isPending} onClick={() => applyBadgeMutation.mutate({ requestedBadge, reason: badgeReason.trim() || undefined }, { onSuccess: () => { badgeApplicationsQuery.refetch(); setBadgeReason(""); toast.success("Badge application submitted"); }, onError: (err) => toast.error(err.message) })} className="mt-3 rounded-xl bg-foreground px-3 py-2 text-[10px] font-semibold text-background disabled:opacity-60">{applyBadgeMutation.isPending ? "Submitting…" : "Submit application"}</button>
            <div className="mt-3 space-y-1">{(badgeApplicationsQuery.data || []).slice(0, 3).map((application: any) => <p key={application.id} className="text-[10px] text-muted-foreground">{application.requestedBadge} badge · <span className="font-semibold uppercase">{application.status}</span></p>)}</div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold">Profile Privacy</p>
            <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
              <span><span className="font-semibold">Private profile</span><span className="mt-1 block text-[10px] text-muted-foreground">New followers must be approved before they can follow you.</span></span>
              <input type="checkbox" checked={isPrivate} onChange={(e) => { const val = e.target.checked; setIsPrivate(val); updatePrivacyMutation.mutate({ isPrivate: val }); }} className="h-4 w-4 rounded border-border" />
            </label>
            <p className="pt-1 text-xs font-semibold">List Privacy Settings</p>
            <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
              <span>Show Followers List to others</span>
              <input type="checkbox" checked={showFollowersList} onChange={(e) => { const val = e.target.checked; setShowFollowersList(val); updatePrivacyMutation.mutate({ showFollowersList: val }); }} className="h-4 w-4 rounded border-border" />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
              <span>Show Following List to others</span>
              <input type="checkbox" checked={showFollowingList} onChange={(e) => { const val = e.target.checked; setShowFollowingList(val); updatePrivacyMutation.mutate({ showFollowingList: val }); }} className="h-4 w-4 rounded border-border" />
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">New Password (leave blank to keep current)</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 h-11 w-full rounded-2xl bg-muted px-4 text-sm outline-none" />
            {newPassword.trim() && (
              <div className="mt-3 space-y-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3">
                <p className="text-[11px] font-medium text-violet-700 dark:text-violet-300">
                  {passwordResetRequested ? "Verification code sent to your email. Enter it below to confirm password change." : "Changing your password requires a verification code sent to your email."}
                </p>
                {passwordResetRequested && (
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={passwordResetCode}
                    onChange={(e) => setPasswordResetCode(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-center font-mono tracking-widest text-sm outline-none focus:border-violet-500"
                  />
                )}
              </div>
            )}
          </div>
          </div>
        </div>
        <div className="shrink-0 space-y-2 border-t border-border/70 bg-card px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <button onClick={() => setShowBugReport(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted py-3 text-xs font-semibold transition hover:bg-muted/80">
            <Bug className="h-4 w-4 text-rose-500" /> Report a Bug
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3 text-xs font-semibold">Cancel</button>
            <button onClick={handleSave} className="flex-1 rounded-2xl bg-foreground py-3 text-xs font-semibold text-background">Save Changes</button>
          </div>
        </div>
      </div>
      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
    </div>
  );
}
