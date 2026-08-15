import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { normalizeMessengerPeer } from "@/lib/messengerPeer";
import { initialsAvatar } from "@/lib/mediaUrl";
import { resolveProfileUser } from "@/lib/profileViewData";
import { toast } from "sonner";
import {
  Bell, Bookmark, Check, ChevronRight, CircleHelp, Compass, CreditCard, Download, Heart, Home as HomeIcon, ImagePlus, LogOut, Mail, Menu, MessageCircle, MoreHorizontal, Moon, PhoneCall, PhoneIncoming, PhoneMissed, Play, Plus, Search, Send, Settings, ShieldCheck, Sparkles, Sun, Users, Video, X, Zap,
} from "lucide-react";
import { LoginPanel, AdminView, AccountSettings } from "@/components/TanryugramPanels";
import { AdvancedMessagesView, MultiImageComposer, ReactionButton, StoryBarLive, StoryViewerLive } from "@/components/TanryugramAdvancedFeatures";
import { MessengerExperience } from "@/components/TanryugramMessengerAdvanced";
import { ProfileMessageButton } from "@/components/ProfileMessageButton";
import { ProfileFollowButton } from "@/components/ProfileFollowButton";
import { CommentBottomSheet } from "@/components/CommentBottomSheet";
import { SafeImage } from "@/components/SafeImage";
import { canSeeOwnerStudio } from "@/lib/ownerAccess";

const fallbackStories = [
  { name: "Your story", handle: "you", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&q=80", own: true },
  { name: "Nadia", handle: "nadia.codes", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=180&q=80" },
  { name: "Mika", handle: "mika.studio", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=180&q=80" },
  { name: "Theo", handle: "theo.makes", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&q=80" },
  { name: "Lena", handle: "lena.inmotion", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=180&q=80" },
  { name: "Marcus", handle: "marcusframes", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&q=80" },
];

const fallbackPosts = [
  { id: 1, creator: { name: "Maya Chen", username: "mayachen", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&q=80", verified: true, role: "Creative director" }, media: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=85", caption: "A quiet corner for loud ideas. Designing the new studio around the way we actually make things.", likes: 1842, comments: 86, time: "34 min ago", tag: "STUDIO NOTES" },
  { id: 2, creator: { name: "Noah Williams", username: "noahmakes", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&q=80", verified: false, role: "Product designer" }, media: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=1200&q=85", caption: "The messy middle is where the good stuff starts. Sharing the process, not just the polished frame.", likes: 927, comments: 42, time: "2 hrs ago", tag: "IN THE MAKING", premium: true },
  { id: 3, creator: { name: "Aria Sol", username: "ariasol", avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=96&q=80", verified: true, role: "Photographer" }, media: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=85", caption: "Found light, soft edges, and a little room to breathe.", likes: 3210, comments: 118, time: "5 hrs ago", tag: "FIELD NOTES" },
];

const fallbackCreators = [
  { name: "Amara Jones", username: "amaraj", role: "Illustrator", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&q=80", verified: true, followers: "28.4k" },
  { name: "Leo Park", username: "leopark", role: "Music producer", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=96&q=80", verified: false, followers: "14.9k" },
  { name: "Sofia Reed", username: "sofiareed", role: "Stylist & writer", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=96&q=80", verified: true, followers: "42.1k" },
];

type View = "home" | "explore" | "messages" | "profile" | "admin";

function Avatar({ src, size = "md", ring = false, name }: { src?: string | null; size?: "sm" | "md" | "lg"; ring?: boolean; name?: string | null }) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-20 w-20" };
  const fallback = initialsAvatar(name);
  return <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-orange-300 p-[2px] ${ring ? "ring-2 ring-violet-500/30 ring-offset-2 ring-offset-background" : ""}`}><SafeImage src={src} fallback={fallback} fallbackName={name} loading="lazy" decoding="async" className="h-full w-full rounded-full object-cover" alt={name || "Tanryugram user"} /></div>;
}

function ProfileBadge({ badgeType, legacyVerified, label }: { badgeType?: "none" | "blue" | "black" | null; legacyVerified?: boolean; label?: string | null }) { const type = badgeType && badgeType !== "none" ? badgeType : legacyVerified ? "blue" : "none"; if (type === "none") return null; return <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-white ${type === "blue" ? "bg-blue-500" : "bg-black"}`} title={`${label || (type === "blue" ? "Blue" : "Black")} badge`}><Check className="h-2.5 w-2.5 stroke-[3]" /></span>; }

const RINGTONE_OPTIONS = [{ id: "default", label: "System default" }, { id: "soft", label: "Soft pulse" }, { id: "bright", label: "Bright ring" }] as const;
type RingtoneId = typeof RINGTONE_OPTIONS[number]["id"];
function playRingtonePreview(ringtone: RingtoneId) { if (typeof window === "undefined") return; const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext; if (!AudioContextCtor) return; const context = new AudioContextCtor(); const oscillator = context.createOscillator(); const gain = context.createGain(); const frequency = ringtone === "bright" ? 880 : ringtone === "soft" ? 520 : 660; oscillator.frequency.value = frequency; oscillator.type = ringtone === "bright" ? "square" : "sine"; gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.5); window.setTimeout(() => void context.close(), 700); }
function CallHistoryCard({ rows, ringtone, onRingtoneChange }: { rows: any[]; ringtone: RingtoneId; onRingtoneChange: (value: RingtoneId) => void }) { return <section className="mb-6 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">Stay connected</p><h2 className="mt-1 font-display text-lg font-semibold">Calls & ringtone</h2><p className="mt-1 text-xs text-muted-foreground">Review recent calls and choose how incoming calls sound.</p></div><a href="/api/download/tanryugram-v2.apk" download className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-2 text-xs font-semibold text-background"><Download className="h-3.5 w-3.5" />Get the app</a></div><div className="grid gap-4 lg:grid-cols-[1fr_240px]"><div className="space-y-2">{rows.length ? rows.slice(0, 5).map((row: any) => { const call = row.call || row; const peer = row.peer || {}; const outgoing = Number(call.callerId) > 0 && Number(call.callerId) !== Number(peer.id); const missed = call.status === "missed" || call.status === "declined"; return <div key={call.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${missed ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-600"}`}>{missed ? <PhoneMissed className="h-4 w-4" /> : outgoing ? <PhoneCall className="h-4 w-4" /> : <PhoneIncoming className="h-4 w-4" />}</span><Avatar src={peer.avatarUrl} size="sm" name={peer.name} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{peer.name || peer.username || "TanRyuGram member"}</p><p className="text-[10px] text-muted-foreground">{missed ? "Missed call" : outgoing ? "Outgoing" : "Received"} · {call.callType} · {call.startedAt ? new Date(call.startedAt).toLocaleString() : "Recently"}</p></div><span className="text-[10px] font-semibold text-muted-foreground">{call.durationSeconds ? `${call.durationSeconds}s` : ""}</span></div>; }) : <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Your recent calls will appear here.</div>}</div><div className="rounded-2xl border border-border/70 bg-background/60 p-3"><p className="mb-2 text-xs font-semibold">Incoming ringtone</p><select value={ringtone} onChange={(event) => onRingtoneChange(event.target.value as RingtoneId)} className="h-9 w-full rounded-xl border border-border bg-card px-2 text-xs"><option value="default">System default</option><option value="soft">Soft pulse</option><option value="bright">Bright ring</option></select><button onClick={() => playRingtonePreview(ringtone)} className="mt-2 w-full rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Test ringtone</button><p className="mt-2 text-[10px] leading-4 text-muted-foreground">The selected tone is used for foreground web alerts and the matching Android notification channel in the final APK.</p></div></div></section>; }
function VerifiedBadge() { return <ProfileBadge badgeType="blue" />; }

function NavItem({ icon: Icon, label, active, onClick, badge }: { icon: typeof HomeIcon; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return <button onClick={onClick} className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all duration-200 active:scale-[.98] ${active ? "bg-foreground text-background shadow-lg shadow-foreground/10" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}><Icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.5]" : ""}`} /><span>{label}</span>{badge ? <span className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${active ? "bg-background text-foreground" : "bg-violet-500 text-white"}`}>{badge}</span> : null}</button>;
}

function StoryBar({ onOpen }: { onOpen: (story: typeof fallbackStories[number]) => void }) {
  return <section className="mb-8 overflow-hidden rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">Live from the community</p><h2 className="mt-1 font-display text-lg font-semibold">Stories <span className="text-muted-foreground">/ 24h</span></h2></div><button className="text-xs font-semibold text-muted-foreground hover:text-foreground">View all <ChevronRight className="ml-1 inline h-3 w-3" /></button></div><div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]"><button onClick={() => onOpen(fallbackStories[0])} className="group flex w-[70px] shrink-0 flex-col items-center gap-2"><div className="relative"><Avatar src={fallbackStories[0].image} size="md" ring name={fallbackStories[0].name} /><span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-foreground text-background"><Plus className="h-3 w-3" /></span></div><span className="max-w-[70px] truncate text-[11px] font-medium text-muted-foreground">Your story</span></button>{fallbackStories.slice(1).map((story) => <button key={story.handle} onClick={() => onOpen(story)} className="group flex w-[70px] shrink-0 flex-col items-center gap-2"><div className="rounded-full bg-gradient-to-tr from-orange-400 via-fuchsia-500 to-violet-600 p-[2px]"><div className="rounded-full bg-card p-[2px]"><SafeImage src={story.image} fallbackName={story.name} alt={story.name} className="h-11 w-11 rounded-full object-cover transition-transform group-hover:scale-105" /></div></div><span className="max-w-[70px] truncate text-[11px] font-medium text-foreground">{story.name}</span></button>)}</div></section>;
}

function PostMediaCarousel({ post }: { post: typeof fallbackPosts[number] }) { const [active, setActive] = useState(0); const mediaQuery = trpc.posts.media.useQuery({ postId: post.id }, { enabled: post.id > 0 }); const media = mediaQuery.data?.length ? [post.media, ...mediaQuery.data.map((item: any) => item.mediaUrl).filter((url: string) => url !== post.media)] : [post.media]; const fallback = initialsAvatar(post.creator?.name); return <div className="relative aspect-[1.25/1] overflow-hidden bg-muted"><SafeImage src={media[active]} fallback={fallback} fallbackName={post.creator?.name} loading="lazy" decoding="async" alt="Creator post" className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" />{media.length > 1 && <><button aria-label="Previous image" onClick={() => setActive((value) => (value - 1 + media.length) % media.length)} className="absolute left-3 top-1/2 rounded-full bg-black/40 p-2 text-white"><ChevronRight className="h-4 w-4 rotate-180" /></button><button aria-label="Next image" onClick={() => setActive((value) => (value + 1) % media.length)} className="absolute right-3 top-1/2 rounded-full bg-black/40 p-2 text-white"><ChevronRight className="h-4 w-4" /></button><div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">{media.map((_, index) => <span key={index} className={`h-1.5 rounded-full ${index === active ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />)}</div></>}{post.premium && <div className="absolute left-4 top-4 rounded-full bg-foreground/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-background backdrop-blur"><Sparkles className="mr-1 inline h-3 w-3" /> Community post</div>}<div className="absolute bottom-4 left-4 rounded-full bg-background/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur">{post.tag}</div></div>; }

function PostCard({ post, liked, saved, onLike, onSave, onComment, onOpenComments, onSubscribe, onSelectUser }: { post: typeof fallbackPosts[number]; liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; onComment: (value: string) => void; onOpenComments: () => void; onSubscribe: () => void; onSelectUser: (user: any) => void }) {
  const [comment, setComment] = useState("");
  const creatorUser = { id: (post as any).userId || (post.creator as any).userId || 0, name: post.creator.name, username: post.creator.username, avatarUrl: post.creator.avatar, isVerified: post.creator.verified, isCreator: post.creator.role !== "Member", badgeType: (post.creator as any).badgeType, badgeLabel: (post.creator as any).badgeLabel, showBadge: (post.creator as any).showBadge };
  return <article className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-violet-500/5"><div className="flex items-center justify-between px-4 py-4 sm:px-5"><div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectUser(creatorUser)}><Avatar src={post.creator.avatar} size="sm" name={post.creator.name} /><div><div className="flex items-center gap-1.5"><span className="text-sm font-semibold group-hover:text-violet-500 transition">{post.creator.name}</span>{(post.creator as any).showBadge !== false && <ProfileBadge badgeType={(post.creator as any).badgeType} legacyVerified={post.creator.verified} label={(post.creator as any).badgeLabel} />}</div><p className="text-[11px] text-muted-foreground">@{post.creator.username} · {post.creator.role}</p></div></div><button className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><MoreHorizontal className="h-5 w-5" /></button></div><PostMediaCarousel post={post} /><div className="p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-1"><ReactionButton postId={post.id} liked={liked} onLike={onLike} /><span className="mr-2 text-xs font-semibold tabular-nums">{(post.likes + (liked ? 1 : 0)).toLocaleString()}</span><button onClick={onOpenComments} className="flex items-center gap-1.5 rounded-full p-2 text-foreground hover:bg-violet-500/10 hover:text-violet-500"><MessageCircle className="h-[19px] w-[19px]" /><span className="text-xs font-semibold tabular-nums">{post.comments}</span></button></div><button onClick={onSave} className={`rounded-full p-2 transition-colors ${saved ? "text-violet-500" : "text-foreground hover:bg-violet-500/10 hover:text-violet-500"}`}><Bookmark className={`h-[19px] w-[19px] ${saved ? "fill-current" : ""}`} /></button></div><p className="text-sm leading-6 text-foreground"><span className="mr-2 font-semibold">@{post.creator.username}</span>{post.caption}</p><div className="mt-2 text-[11px] font-medium text-muted-foreground">{post.time}</div>{post.premium && <button onClick={onSubscribe} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-violet-500/10 px-4 py-3 text-left text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-500/15 dark:text-violet-300"><span><Sparkles className="mr-2 inline h-4 w-4" />Unlock the full process</span><span>$4.99 / month <ChevronRight className="ml-1 inline h-3 w-3" /></span></button>}<div onClick={onOpenComments} className="mt-4 flex cursor-pointer items-center justify-between border-t border-border/60 pt-3 text-muted-foreground hover:text-foreground"><span className="text-xs">View all comments...</span><MessageCircle className="h-4 w-4 text-violet-500" /></div></div></article>;
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>("home");
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [story, setStory] = useState<any | null>(null);
  const [storySequence, setStorySequence] = useState<any[]>([]);
  const [storyIndex, setStoryIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [message, setMessage] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activePeerId, setActivePeerId] = useState<number | null>(null);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [ringtone, setRingtone] = useState<RingtoneId>(() => (typeof window !== "undefined" && (localStorage.getItem("tanryugram-ringtone") as RingtoneId)) || "default");
  const feed = trpc.discovery.feed.useQuery({ limit: 20, offset: 0 });
  const ownProfileQuery = trpc.profile.byId.useQuery({ userId: Number(user?.id || 0) }, { enabled: isAuthenticated && !!user?.id, staleTime: 0, refetchOnWindowFocus: true });
  const explore = trpc.discovery.explore.useQuery(undefined, { enabled: view === "explore" });
  const likeMutation = trpc.posts.like.useMutation();
  const saveMutation = trpc.posts.save.useMutation();
  const commentMutation = trpc.posts.comment.useMutation();
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 8000 });
  const unreadNotificationsQuery = trpc.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 8000 });
  const markNotificationsReadMutation = trpc.notifications.markRead.useMutation();
  const registerPushTokenMutation = trpc.notifications.registerPushToken.useMutation();
  const incomingCallsQuery = trpc.messages.incomingCalls.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 1200 });
  const recentCallsQuery = trpc.messages.recentCalls.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 15000 });
  const globalCallUpdateMutation = trpc.messages.updateCall.useMutation({ onSuccess: () => incomingCallsQuery.refetch() });
  const announcedCallId = useRef<number | null>(null);
  const nativeAnnouncedCallId = useRef<number | null>(null);
  const pendingCall = incomingCallsQuery.data?.[0] as any;
  useEffect(() => { localStorage.setItem("tanryugram-ringtone", ringtone); (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView?.postMessage(JSON.stringify({ type: "set-ringtone", ringtone })); }, [ringtone]);
  useEffect(() => {
    const callId = Number(pendingCall?.call?.id || 0);
    if (!callId || announcedCallId.current === callId) return;
    announcedCallId.current = callId;
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(`Incoming ${pendingCall.call.callType} call`, { body: `${pendingCall.caller?.name || "A TanRyuGram member"} is calling you` });
    }
  }, [pendingCall]);
  useEffect(() => {
    const nativeBridge = (window as Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }).ReactNativeWebView;
    const callId = Number(pendingCall?.call?.id || 0);
    if (!isAuthenticated || !callId || nativeAnnouncedCallId.current === callId) return;
    nativeAnnouncedCallId.current = callId;
    nativeBridge?.postMessage(JSON.stringify({ type: "incoming-call", callId, callType: pendingCall.call.callType, callerName: pendingCall.caller?.name || "TanRyuGram member" }));
  }, [isAuthenticated, pendingCall]);
  useEffect(() => {
    const refreshCalls = () => incomingCallsQuery.refetch();
    window.addEventListener("focus", refreshCalls);
    document.addEventListener("visibilitychange", refreshCalls);
    return () => { window.removeEventListener("focus", refreshCalls); document.removeEventListener("visibilitychange", refreshCalls); };
  }, [incomingCallsQuery]);
  useEffect(() => {
    const handleNativePushToken = (event: Event) => {
      const token = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (isAuthenticated && token) registerPushTokenMutation.mutate({ token });
    };
    window.addEventListener("tanryugram-native-push-token", handleNativePushToken);
    return () => window.removeEventListener("tanryugram-native-push-token", handleNativePushToken);
  }, [isAuthenticated, registerPushTokenMutation]);
  // Payment mutations removed for beta stability
  const realPosts = feed.data?.map((row: any) => { const creator = row.creator || {}; return { id: row.post.id, userId: row.post.userId, creator: { userId: row.post.userId, name: creator.name || "Tanryugram creator", username: creator.username || `creator-${row.post.userId}`, avatar: creator.avatarUrl || null, verified: Boolean(creator.isVerified), badgeType: creator.badgeType, badgeLabel: creator.badgeLabel, showBadge: creator.showBadge, role: creator.badgeLabel || (creator.isCreator ? "Creator" : "Member") }, media: row.post.mediaUrl, caption: row.post.caption || "", likes: row.post.likesCount, comments: row.post.commentsCount, time: "Recently", tag: row.post.isPremium ? "PREMIUM" : "FROM THE COMMUNITY", premium: row.post.isPremium }; }) || [];
  const posts = realPosts.length ? realPosts : fallbackPosts;
  const realExplore = explore.data?.map((row: any) => { const creator = row.creator || {}; return { id: row.post.id, userId: row.post.userId, creator: { userId: row.post.userId, name: creator.name || "Tanryugram creator", username: creator.username || `creator-${row.post.userId}`, avatar: creator.avatarUrl || null, verified: Boolean(creator.isVerified), badgeType: creator.badgeType, badgeLabel: creator.badgeLabel, showBadge: creator.showBadge, role: creator.badgeLabel || (creator.isCreator ? "Creator" : "Member") }, media: row.post.mediaUrl, caption: row.post.caption || "", likes: row.post.likesCount, comments: row.post.commentsCount, time: "Trending now", tag: "EXPLORE", premium: row.post.isPremium }; }) || [];
  const displayedPosts = view === "explore" && realExplore.length ? realExplore : posts;
  const creators = fallbackCreators;
  const unreadCount = isAuthenticated ? Number(unreadNotificationsQuery.data ?? 0) : 0;
  const ownerStudioVisible = canSeeOwnerStudio(user);
  const liveNotifications = notificationsQuery.data ?? [];
  const databaseUser = ownProfileQuery.data?.user || null;
  const currentUserAvatar = databaseUser?.avatarUrl || user?.avatarUrl || null;
  const visibleProfile = view === "profile" && selectedUser ? selectedUser : (databaseUser || user);
  const profileName = visibleProfile?.name || "Tanryugram user";
  const profileHandle = visibleProfile?.username || "creator";
  const profileAvatar = visibleProfile?.avatarUrl || currentUserAvatar;

  const handleLike = (id: number) => { setLiked((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); if (isAuthenticated) likeMutation.mutate({ postId: id }); };
  const handleSave = (id: number) => { setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); if (isAuthenticated) saveMutation.mutate({ postId: id }); };
  const handleComment = (id: number, value: string) => { toast.success("Comment added", { description: "Your audience can now see it." }); if (isAuthenticated) commentMutation.mutate({ postId: id, content: value }); };
  const handleSubscribe = () => { toast("Community Access", { description: "All community posts are free and open for beta members." }); };
  const openStorySequence = (selected: any, allStories?: any[]) => { const sequence = allStories?.length ? allStories : [selected]; const selectedIndex = Math.max(0, sequence.findIndex((item) => (item.id && selected.id ? item.id === selected.id : item.handle === selected.handle))); setStorySequence(sequence); setStoryIndex(selectedIndex); setStory(sequence[selectedIndex] || selected); };
  const handleTip = () => { toast("Support Community", { description: "Direct creator support and tips are disabled for this beta." }); };

  const navItems = useMemo(() => [{ icon: HomeIcon, label: "Home", view: "home" as View }, { icon: Compass, label: "Explore", view: "explore" as View }, { icon: MessageCircle, label: "Messages", view: "messages" as View, badge: 2 }, { icon: Bell, label: "Activity", view: "home" as View, badge: unreadCount }, { icon: Users, label: "My profile", view: "profile" as View }], [unreadCount]);
  const navigateToView = (nextView: View) => {
    if (nextView === "profile") setSelectedUser(null);
    setView(nextView);
  };
  const openOwnProfile = () => {
    setSelectedUser(null);
    setShowProfileMenu(false);
    setView("profile");
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"><div className="rounded-2xl border border-border/70 bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">Restoring your Tanryugram session…</div></div>;
  if (!isAuthenticated) return <LoginPanel onLogin={() => startLogin()} />;

  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><button onClick={() => { setSelectedUser(null); setView("home"); }} className="flex shrink-0 items-center gap-3"><span className="font-display text-xl font-bold tracking-tight">tanryugram<span className="text-violet-500">.</span></span></button><div className="relative hidden max-w-md flex-1 md:block">
  <Search className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search @username..."
    className="h-10 sm:h-11 w-full rounded-2xl border border-border bg-card pl-9 sm:pl-11 pr-4 text-xs sm:text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
  />
  {query.trim().length > 0 && (
    <UserSearchDropdown query={query} onClose={() => setQuery("")} onSelectUser={(u) => { setSelectedUser(u); setQuery(""); setView("profile"); }} />
  )}
</div><div className="flex items-center gap-1.5 sm:gap-2"><button onClick={() => setShowMobileSearch(true)} aria-label="Search Tanryugram" className="rounded-xl p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"><Search className="h-[18px] w-[18px]" /></button><button onClick={() => setShowNotifications((open) => !open)} className="relative rounded-xl p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"><Bell className="h-[18px] w-[18px]" />{unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />}</button><button onClick={toggleTheme} className="rounded-xl p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground" title="Toggle theme">{theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</button><button onClick={() => setShowComposer(true)} className="hidden items-center gap-2 rounded-xl bg-foreground px-3.5 py-2.5 text-xs font-semibold text-background transition hover:opacity-90 active:scale-[.98] sm:flex"><Plus className="h-4 w-4" />Create</button><div className="relative"><button onClick={() => setShowProfileMenu((open) => !open)} className="rounded-full transition hover:scale-105"><Avatar src={currentUserAvatar} size="sm" /></button>{showProfileMenu && <div className="absolute right-0 top-12 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl"><button onClick={openOwnProfile} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium hover:bg-muted"><Users className="h-4 w-4" />View profile</button><button onClick={() => { setShowProfileMenu(false); setShowSettings(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium hover:bg-muted"><Settings className="h-4 w-4" />Account settings</button>{isAuthenticated ? <button onClick={() => logout()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-500 hover:bg-rose-500/10"><LogOut className="h-4 w-4" />Sign out</button> : <button onClick={() => startLogin()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium hover:bg-muted"><Sparkles className="h-4 w-4" />Sign in</button>}</div>}</div></div>{showMobileSearch && <div className="fixed inset-0 z-[80] bg-background/95 p-4 backdrop-blur-xl md:hidden"><div className="mx-auto flex max-w-lg items-center gap-2"><button onClick={() => { setShowMobileSearch(false); setQuery(""); }} aria-label="Close search" className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people or @username" className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />{query.trim().length > 0 && <UserSearchDropdown query={query} onClose={() => setQuery("")} onSelectUser={(u) => { setSelectedUser(u); setQuery(""); setShowMobileSearch(false); setView("profile"); }} />}</div></div><p className="mx-auto mt-4 max-w-lg px-12 text-xs text-muted-foreground">Search by a display name or exact username to open the right profile.</p></div>}</div></header><div className="mx-auto flex max-w-[1440px] gap-8 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-10"><aside className="sticky top-[96px] hidden h-[calc(100vh-120px)] w-[215px] shrink-0 flex-col lg:flex"><div className="space-y-1 pt-8">{navItems.map((item) => <NavItem key={item.label} icon={item.icon} label={item.label} active={item.view === view || (item.label === "Activity" && showNotifications)} badge={item.badge} onClick={() => item.label === "Activity" ? setShowNotifications(true) : navigateToView(item.view)} />)}</div>{ownerStudioVisible && (
  <div className="mt-8 border-t border-border/70 pt-5">
    <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Owner space</p>
    <NavItem icon={Sparkles} label="Creator studio" active={view === "admin"} onClick={() => setView("admin")} />
  </div>
)}<div className="mt-auto rounded-[22px] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-orange-500/15 p-4"><Sparkles className="mb-3 h-5 w-5 text-violet-500" /><p className="text-sm font-semibold">Turn attention into income.</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Offer premium work and let your people support the process.</p><button onClick={handleTip} className="mt-3 text-xs font-semibold text-violet-600 dark:text-violet-300">Explore monetization <ChevronRight className="ml-1 inline h-3 w-3" /></button></div></aside><main className="min-w-0 flex-1 pt-6 lg:pt-8"><div className="mb-7 flex items-end justify-between"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">{view === "explore" ? "Curated for you" : view === "messages" ? "Stay close" : "Your creative orbit"}</p><h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{view === "home" ? "Make space for what you’re making." : view === "explore" ? "Find your next obsession" : view === "messages" ? "Conversations" : view === "profile" ? profileName : "Creator studio"}</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">{view === "home" ? "Share the process, find your people, and keep the work moving." : view === "explore" ? "Discover independent voices, new references, and the process behind the post." : view === "messages" ? "Real-time conversations with the people who keep your work moving." : view === "profile" ? `@${profileHandle} · Building in public since 2024` : "Understand your audience, publish premium work, and keep your community close."}</p></div>{view === "home" && <button onClick={() => setShowComposer(true)} className="hidden items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-semibold shadow-sm transition hover:border-violet-300 hover:text-violet-600 sm:flex"><ImagePlus className="h-4 w-4" /> New post</button>}</div>{view === "home" || view === "explore" ? <><StoryBarLive onOpen={openStorySequence} />{view === "home" && <CallHistoryCard rows={(recentCallsQuery.data || []) as any[]} ringtone={ringtone} onRingtoneChange={setRingtone} />}<div className="grid gap-6 xl:grid-cols-[minmax(0,680px)_280px]">{view === "explore" && <div className="col-span-full mb-2"><div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1"><span className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background">For you</span>{["Memes & Shorts", "Design", "Music", "Film", "Fashion", "Writing"].map((tag) => <button key={tag} className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:border-violet-300 hover:text-violet-600">{tag}</button>)}</div><div className="mb-6 rounded-[28px] border border-border/70 bg-gradient-to-br from-violet-500/10 via-card to-card p-5"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" /><h2 className="font-display font-semibold">YouTube Memes & Shorts Explore</h2></div><span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-600 dark:text-violet-300">Live curated</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[{ id: "dQw4w9WgXcQ", title: "When the bug works on the first try 😂", channel: "MemeStudio" }, { id: "L_LUpnjgPso", title: "Coding at 3 AM be like...", channel: "DevHumor" }, { id: "jNQXAC9IVRw", title: "First video ever uploaded on YouTube!", channel: "YouTube Rewind" }].map((vid) => <div key={vid.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-violet-400"><div className="aspect-video w-full overflow-hidden bg-muted"><div className="relative h-full w-full lg:hidden"><img src={`https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`} alt={vid.title} className="h-full w-full object-cover" /><div className="absolute inset-0 flex items-center justify-center bg-foreground/35"><a href={`https://www.youtube.com/watch?v=${vid.id}`} target="_blank" rel="noreferrer" className="rounded-full bg-background/95 px-4 py-2 text-xs font-semibold text-foreground shadow-lg">Open video</a></div></div><iframe className="hidden h-full w-full lg:block" src={`https://www.youtube-nocookie.com/embed/${vid.id}`} title={vid.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div><div className="p-3"><p className="line-clamp-1 text-xs font-semibold">{vid.title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{vid.channel}</p></div></div>)}</div></div></div>}<div className="space-y-6">{displayedPosts.map((post) => <PostCard key={`${post.id}-${user?.id ?? "guest"}`} post={post} liked={liked.includes(post.id)} saved={saved.includes(post.id)} onLike={() => handleLike(post.id)} onSave={() => handleSave(post.id)} onComment={(value) => handleComment(post.id, value)} onOpenComments={() => setCommentPostId(post.id)} onSubscribe={() => handleSubscribe()} onSelectUser={(u) => { setSelectedUser(u); setView("profile"); }} />)}
  <CommentBottomSheet postId={commentPostId!} isOpen={commentPostId !== null} onClose={() => setCommentPostId(null)} /><div className="rounded-[24px] border border-dashed border-border p-8 text-center"><Zap className="mx-auto mb-3 h-5 w-5 text-violet-500" /><p className="text-sm font-semibold">You are all caught up</p><p className="mt-1 text-xs text-muted-foreground">New work from your orbit will appear here.</p></div></div><aside className="hidden space-y-5 xl:block"><div className="rounded-[26px] border border-border/70 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Curated people</p><h3 className="mt-1 font-semibold">Worth following</h3></div><button className="text-xs font-semibold text-violet-500">See all</button></div>{creators.map((creator) => <div key={creator.username} className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0 last:pb-0"><Avatar src={creator.avatar} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><p className="truncate text-xs font-semibold">{creator.name}</p>{creator.verified && <VerifiedBadge />}</div><p className="truncate text-[11px] text-muted-foreground">{creator.role} · {creator.followers}</p></div><button className="rounded-full border border-border px-2.5 py-1.5 text-[10px] font-bold text-foreground transition hover:border-violet-400 hover:text-violet-600">Follow</button></div>)}</div></aside></div></> : view === "messages" ? <MessengerExperience key={`messenger-${activePeer?.id ?? "inbox"}`} onExit={() => { setActivePeer(null); setActivePeerId(null); setView("home"); }} initialPeer={activePeer} onOpenProfile={(profile) => { setSelectedUser(profile); setView("profile"); }} /> : view === "profile" ? <ProfileView profileUser={selectedUser || user} currentUser={user} isAuthenticated={isAuthenticated} onLogin={() => startLogin()} onTip={handleTip} onOpenMessage={(u) => { const peer = normalizeMessengerPeer(u); if (!peer) { toast.error("This user cannot receive messages yet."); return; } setActivePeer(peer); setActivePeerId(peer.id); setView("messages"); }} /> : ownerStudioVisible ? <AdminView onTip={handleTip} /> : <StudioView onTip={handleTip} />}</main></div><nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-background/90 px-2 py-2 backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-lg items-center justify-around">{navItems.slice(0, 4).map((item) => <button key={item.label} onClick={() => item.label === "Activity" ? setShowNotifications(true) : navigateToView(item.view)} className={`relative flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium ${item.view === view ? "text-foreground" : "text-muted-foreground"}`}><item.icon className={`h-[18px] w-[18px] ${item.view === view ? "fill-foreground/10" : ""}`} />{item.label}{item.badge ? <span className="absolute right-2 top-0 h-1.5 w-1.5 rounded-full bg-violet-500" /> : null}</button>)}<button onClick={() => setShowComposer(true)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg"><Plus className="h-5 w-5" /></button></div></nav>{showNotifications && <div className="fixed inset-0 z-50 flex items-start justify-end bg-foreground/20 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowNotifications(false)}><div className="mt-14 w-full max-w-sm rounded-[26px] border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">Your activity</p><h2 className="mt-1 text-lg font-semibold">Notifications</h2></div><button onClick={() => setShowNotifications(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div><div className="mt-5 space-y-1">{liveNotifications.length ? liveNotifications.map((row: any) => <NotificationRow key={row.notification.id} row={row} />) : <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No new activity yet. Follows, follow-backs, likes, comments, and messages will appear here.</div>}</div><button disabled={!liveNotifications.some((row: any) => !row.notification.isRead) || markNotificationsReadMutation.isPending} onClick={() => markNotificationsReadMutation.mutate({ notificationId: undefined }, { onSuccess: () => { notificationsQuery.refetch(); unreadNotificationsQuery.refetch(); toast.success("Notifications marked as read"); } })} className="mt-4 w-full rounded-2xl bg-muted py-3 text-xs font-semibold disabled:opacity-50">{markNotificationsReadMutation.isPending ? "Updating…" : "Mark all as read"}</button></div></div>}{pendingCall && <div role="alert" aria-live="assertive" className="fixed bottom-20 left-4 right-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-[24px] border border-violet-300/60 bg-foreground p-3 text-background shadow-2xl ring-2 ring-violet-400/30 animate-pulse sm:bottom-6 sm:left-auto sm:right-6"><Avatar src={pendingCall.caller?.avatarUrl} size="sm" name={pendingCall.caller?.name} /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">Live incoming {pendingCall.call.callType} call · ringing</p><p className="truncate text-sm font-semibold">{pendingCall.caller?.name || "A TanRyuGram member"} is calling</p></div><button onClick={() => globalCallUpdateMutation.mutate({ callId: pendingCall.call.id, status: "declined" })} className="rounded-full bg-background/15 px-3 py-2 text-xs font-semibold hover:bg-background/25">Decline</button><button onClick={() => { globalCallUpdateMutation.mutate({ callId: pendingCall.call.id, status: "accepted" }); const peer = normalizeMessengerPeer(pendingCall.caller); if (peer) { setActivePeer(peer); setActivePeerId(peer.id); setView("messages"); } }} className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400">Answer</button></div>}{showComposer && <MultiImageComposer onClose={() => setShowComposer(false)} />}{showSettings && <AccountSettings user={user} onClose={() => setShowSettings(false)} />}{story && <StoryViewerLive story={story} onClose={() => setStory(null)} onNext={() => { const next = storyIndex + 1; if (next < storySequence.length) { setStoryIndex(next); setStory(storySequence[next]); } else setStory(null); }} onPrevious={() => { const previous = storyIndex - 1; if (previous >= 0) { setStoryIndex(previous); setStory(storySequence[previous]); } }} />}</div>;
}

function UserSearchDropdown({ query, onClose, onSelectUser }: { query: string; onClose: () => void; onSelectUser: (user: any) => void }) {
  const searchResults = trpc.discovery.search.useQuery({ query }, { enabled: query.trim().length > 0 });
  const users = searchResults.data?.users || [];
  return (
    <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-2xl">
      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search Results</div>
      {searchResults.isLoading ? (
        <div className="p-4 text-center text-xs text-muted-foreground">Searching accounts...</div>
      ) : users.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">No accounts found for "{query}"</div>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {users.map((u: any) => (
            <div key={u.id} onClick={() => { onSelectUser(u); onClose(); }} className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted cursor-pointer transition">
              <div className="flex items-center gap-3">
                <Avatar src={u.avatarUrl} size="sm" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">{u.name || u.username}</span>
                    <ProfileBadge badgeType={u.badgeType} legacyVerified={u.isVerified} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                </div>
              </div>
              <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-bold text-background">View profile</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNotificationTime(value: Date | string | number) { const diff = Math.max(0, Date.now() - new Date(value).getTime()); const minutes = Math.floor(diff / 60000); if (minutes < 1) return "now"; if (minutes < 60) return `${minutes}m`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`; const days = Math.floor(hours / 24); return days < 7 ? `${days}d` : new Date(value).toLocaleDateString(); }
function notificationDetails(row: any) { const actor = row.actor?.name || row.actor?.username || "Someone"; switch (row.notification?.type) { case "follow": return `${actor} started following you`; case "like": return `${actor} liked your post`; case "comment": return `${actor} commented on your post`; case "message": return `${actor} ${row.notification.content || "sent you a message"}`; case "tip": return `${actor} sent you support`; case "subscribe": return `${actor} joined your community`; default: return row.notification?.content || "You have a new activity"; } }
function notificationIcon(type: string) { if (type === "like") return { icon: Heart, color: "text-rose-500" }; if (type === "comment") return { icon: MessageCircle, color: "text-blue-500" }; if (type === "follow") return { icon: Users, color: "text-violet-500" }; if (type === "message") return { icon: Mail, color: "text-sky-500" }; return { icon: Bell, color: "text-amber-500" }; }
function NotificationRow({ row }: { row: any }) { const visual = notificationIcon(row.notification?.type); const Icon = visual.icon; return <div className={`flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted ${row.notification?.isRead ? "" : "bg-violet-500/5"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-muted ${visual.color}`}><Icon className="h-4 w-4" /></span><p className="min-w-0 flex-1 text-xs leading-5"><span className="font-medium">{notificationDetails(row)}</span><span className="ml-2 text-[10px] text-muted-foreground">{formatNotificationTime(row.notification?.createdAt)}</span></p></div>; }

function MessagesView({ message, setMessage, profileAvatar, onSend }: { message: string; setMessage: (value: string) => void; profileAvatar: string; onSend: () => void }) { const thread = [{ incoming: true, text: "That studio shot is so good. The natural light is doing all the work.", time: "10:42" }, { incoming: false, text: "Right? We moved the desk three times before it felt right.", time: "10:44" }, { incoming: true, text: "The messy middle always shows. Want to send me the full edit?", time: "10:46" }]; return <div className="grid min-h-[620px] overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm lg:grid-cols-[250px_1fr]"><div className="hidden border-r border-border/70 lg:block"><div className="border-b border-border/70 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Messages</h2><button className="rounded-full p-2 hover:bg-muted"><EditIcon /></button></div><div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input placeholder="Search inbox" className="h-9 w-full rounded-xl bg-muted pl-9 text-xs outline-none" /></div></div><div className="p-3"><div className="flex items-center gap-3 rounded-2xl bg-muted p-3"><Avatar src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&q=80" size="sm" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Theo Makes</p><p className="truncate text-[10px] text-muted-foreground">The studio shot is so good...</p></div><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>{["Nadia Codes", "Aria Sol", "Mika Studio"].map((name, index) => <div key={name} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-muted"><Avatar src={fallbackStories[index + 1]?.image} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{name}</p><p className="text-[10px] text-muted-foreground">Active recently</p></div></div>)}</div></div><div className="flex min-w-0 flex-col"><div className="flex items-center gap-3 border-b border-border/70 p-4 sm:p-5"><Avatar src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&q=80" size="sm" /><div className="flex-1"><p className="text-sm font-semibold">Theo Makes</p><p className="text-[11px] text-emerald-500">Active now</p></div><button className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><CircleHelp className="h-4 w-4" /></button></div><div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{thread.map((item) => <div key={item.time} className={`flex ${item.incoming ? "justify-start" : "justify-end"}`}><div className={`max-w-[78%] ${item.incoming ? "items-start" : "items-end"} flex flex-col gap-1`}><div className={`rounded-[20px] px-4 py-3 text-sm leading-6 ${item.incoming ? "rounded-bl-md bg-muted" : "rounded-br-md bg-foreground text-background"}`}>{item.text}</div><span className="px-1 text-[10px] text-muted-foreground">{item.time} {!item.incoming && <span className="ml-1 text-blue-500">✓✓</span>}</span></div></div>)}<div className="flex justify-center"><span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">Messages are encrypted in transit</span></div></div><div className="border-t border-border/70 p-3 sm:p-4"><div className="flex items-center gap-2 rounded-2xl bg-muted p-1.5"><button className="rounded-xl p-2 text-muted-foreground hover:bg-card"><Plus className="h-4 w-4" /></button><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Write a message..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground" /><button onClick={onSend} className="rounded-xl bg-foreground p-2.5 text-background transition active:scale-90"><Send className="h-4 w-4" /></button></div></div></div></div>; }
function EditIcon() { return <span className="text-xs font-semibold">New</span>; }

function ProfileView({ profileUser, currentUser, isAuthenticated, onLogin, onTip, onOpenMessage }: { profileUser: any; currentUser: any; isAuthenticated: boolean; onLogin: () => void; onTip: () => void; onOpenMessage: (u: any) => void }) {
  const profileId = Number(profileUser?.id || 0);
  const profileQuery = trpc.profile.byId.useQuery({ userId: profileId }, { enabled: profileId > 0, refetchOnWindowFocus: true });
  const deletePostMutation = trpc.admin.deletePost.useMutation();
  const utils = trpc.useUtils();
  
  const targetUser = resolveProfileUser(profileUser, profileQuery.data?.user);
  const targetUserId = Number(targetUser?.id || profileId || 0);
  const userPosts = profileQuery.data?.posts || [];

  const stats = profileQuery.data?.stats || { followers: 0, following: 0, posts: 0 };
  const bioText = targetUser?.bio || "Creative director, occasional photographer, and believer in sharing the work before it is finished.";
  const name = targetUser?.name || targetUser?.username || "Creator";
  const handle = targetUser?.username || "creator";
  const avatar = targetUser?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80";
  const isOwnProfile = currentUser?.id === targetUser?.id;

  const [activeListModal, setActiveListModal] = useState<"followers" | "following" | null>(null);
  const canViewFollowers = isOwnProfile || targetUser?.showFollowersList !== false;
  const canViewFollowing = isOwnProfile || targetUser?.showFollowingList !== false;
  const followersQuery = trpc.follows.followers.useQuery({ userId: targetUserId }, { enabled: canViewFollowers && activeListModal === "followers" && targetUserId > 0 });
  const followingQuery = trpc.follows.following.useQuery({ userId: targetUserId }, { enabled: canViewFollowing && activeListModal === "following" && targetUserId > 0 });
  const followStateQuery = trpc.follows.state.useQuery({ userId: targetUserId }, { enabled: isAuthenticated && !isOwnProfile && targetUserId > 0 });
  const toggleFollowMutation = trpc.follows.toggle.useMutation();
  const isFollowing = Boolean(followStateQuery.data);

  const handleFollow = () => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    if (targetUserId <= 0 || toggleFollowMutation.isPending) return;
    toggleFollowMutation.mutate({ userId: targetUserId }, {
      onSuccess: (result) => {
        followStateQuery.refetch();
        utils.profile.byId.invalidate({ userId: targetUserId });
        utils.follows.followers.invalidate({ userId: targetUserId });
        utils.follows.following.invalidate({ userId: targetUserId });
        toast.success(result.following ? `You are now following @${handle}` : `You unfollowed @${handle}`);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate({ postId }, {
        onSuccess: () => {
          toast.success("Post deleted successfully");
          utils.profile.byId.invalidate();
          utils.discovery.feed.invalidate();
          utils.discovery.explore.invalidate();
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar src={avatar} size="lg" ring />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold">{name}</h2>
              {targetUser?.showBadge !== false && <ProfileBadge badgeType={targetUser?.badgeType} legacyVerified={targetUser?.isVerified} label={targetUser?.badgeLabel} />}
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${targetUser?.isCreator ? "bg-violet-500/10 text-violet-500" : "bg-muted text-muted-foreground"}`}>
                {targetUser?.badgeLabel || (targetUser?.isCreator ? "Creator" : "Member")}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">@{handle}</p>
            <p className="mt-4 max-w-xl text-sm leading-6 whitespace-pre-wrap">{bioText}</p>
            <div className="mt-5 flex gap-6">
              <Stat label="Posts" value={String(stats.posts || userPosts.length)} />
              {canViewFollowers ? <button onClick={() => setActiveListModal("followers")} className="text-left transition hover:opacity-80"><Stat label="Followers" value={String(stats.followers)} /></button> : <div title="Followers list is private"><Stat label="Followers" value={String(stats.followers)} /></div>}
              {canViewFollowing ? <button onClick={() => setActiveListModal("following")} className="text-left transition hover:opacity-80"><Stat label="Following" value={String(stats.following)} /></button> : <div title="Following list is private"><Stat label="Following" value={String(stats.following)} /></div>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isOwnProfile && <ProfileFollowButton isAuthenticated={isAuthenticated} isFollowing={isFollowing} isPending={toggleFollowMutation.isPending} onFollow={handleFollow} onLogin={onLogin} />}
            {!isOwnProfile && isAuthenticated && <ProfileMessageButton user={targetUser} onOpen={onOpenMessage} />}
            <button onClick={onTip} className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold">Tip creator</button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 border-b border-border/70 pb-3">
        <button className="border-b-2 border-foreground pb-3 text-xs font-bold">Posts</button>
        <button className="pb-3 text-xs font-semibold text-muted-foreground">Premium</button>
        <button className="pb-3 text-xs font-semibold text-muted-foreground">Tagged</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {userPosts.length === 0 ? (
          <div className="col-span-full rounded-[24px] border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No posts published yet. Use the Create button above to share your first visual.
          </div>
        ) : (
          userPosts.map((p: any) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
              <SafeImage src={p.mediaUrl} fallbackName={p.title} alt={p.title || "Explore video"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDeletePost(p.id)}
                  className="rounded-full bg-rose-600 p-2 text-white shadow-lg transition hover:scale-110"
                  title="Delete post"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {p.isPremium && (
                <span className="absolute right-3 top-3 rounded-full bg-background/85 p-1.5 text-violet-500 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) { return <div><p className="text-lg font-bold">{value}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p></div>; }

function StudioView({ onTip }: { onTip: () => void }) { return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3"><StudioMetric label="Audience growth" value="+18.6%" detail="vs. last month" trend="up" /><StudioMetric label="Creator revenue" value="$2,840" detail="this month" trend="up" /><StudioMetric label="Premium members" value="184" detail="98% retention" trend="up" /></div><div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Audience momentum</p><h2 className="mt-1 text-lg font-semibold">Your work is traveling</h2></div><button className="rounded-xl bg-muted px-3 py-2 text-[10px] font-semibold">Last 30 days</button></div><div className="mt-7 flex h-44 items-end gap-2">{[30, 38, 35, 48, 42, 66, 60, 72, 64, 84, 78, 96, 88, 100, 94, 110, 100, 118, 112, 126, 122].map((height, index) => <div key={index} className="group relative flex flex-1 items-end"><div style={{ height: `${height}px` }} className={`w-full rounded-t-lg transition-colors ${index > 14 ? "bg-violet-500" : "bg-violet-500/20 group-hover:bg-violet-500/50"}`} /></div>)}</div><div className="mt-4 flex justify-between text-[10px] text-muted-foreground"><span>May 12</span><span>May 27</span><span>Jun 11</span></div></div><div className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500">Monetization</p><h2 className="mt-1 text-lg font-semibold">Give your people more</h2></div><CreditCard className="h-5 w-5 text-muted-foreground" /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">Premium posts, subscriber-only stories, and direct support with tips. Your audience can choose how they show up for your work.</p><button onClick={onTip} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-foreground px-4 py-3 text-xs font-semibold text-background"><span>Open monetization settings</span><ChevronRight className="h-4 w-4" /></button></div></div><div className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Creator checklist</p><h2 className="mt-1 text-lg font-semibold">Build the habit</h2></div><span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">3 / 4 complete</span></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><Checklist done label="Profile shaped" /><Checklist done label="First post" /><Checklist done label="Premium tier" /><Checklist label="Invite 5 people" /></div></div></div>; }
function StudioMetric({ label, value, detail, trend }: { label: string; value: string; detail: string; trend: string }) { return <div className="rounded-[24px] border border-border/70 bg-card p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-3 font-display text-2xl font-bold">{value}</p><p className="mt-1 text-[11px] text-emerald-500">{trend === "up" ? "↗" : ""} {detail}</p></div>; }
function Checklist({ done, label }: { done?: boolean; label: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "border border-border text-muted-foreground"}`}>{done ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}</span><span className="text-xs font-medium">{label}</span></div>; }

function Composer({ onClose, onPublish }: { onClose: () => void; onPublish: () => void }) { const [caption, setCaption] = useState(""); const [premium, setPremium] = useState(false); return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}><div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-5 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">New work</p><h2 className="mt-1 text-xl font-semibold">Share with your audience</h2></div><button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div><div className="mt-5 flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-muted/60"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-sm"><ImagePlus className="h-5 w-5 text-violet-500" /></div><p className="mt-3 text-sm font-semibold">Drop your visual here</p><p className="mt-1 text-xs text-muted-foreground">Images and video up to 50MB</p></div></div><textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What are you making?" className="mt-4 min-h-24 w-full resize-none rounded-2xl bg-muted p-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/20" /><div className="mt-4 flex items-center justify-between rounded-2xl bg-violet-500/10 p-3"><div className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-violet-500" /><div><p className="text-xs font-semibold">Make this premium</p><p className="text-[10px] text-muted-foreground">Only subscribers can unlock it</p></div></div><button onClick={() => setPremium(!premium)} className={`h-6 w-11 rounded-full p-1 transition-colors ${premium ? "bg-violet-500" : "bg-muted-foreground/30"}`}><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${premium ? "translate-x-5" : ""}`} /></button></div><button onClick={onPublish} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background transition hover:opacity-90">Publish post <Sparkles className="h-4 w-4" /></button></div></div>; }

function StoryViewer({ story, onClose }: { story: typeof fallbackStories[number]; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}><div className="relative h-[min(760px,90vh)] w-full max-w-[420px] overflow-hidden rounded-[28px] bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}><SafeImage src={story.image} fallbackName={story.name} alt="Story" className="h-full w-full object-cover opacity-90" /><div className="absolute inset-x-0 top-0 p-4"><div className="mb-4 h-1 overflow-hidden rounded-full bg-white/30"><div className="h-full w-2/3 rounded-full bg-white" /></div><div className="flex items-center gap-3"><Avatar src={story.image} size="sm" /><div><p className="text-sm font-semibold text-white">{story.name}</p><p className="text-[10px] text-white/70">18h left</p></div><button onClick={onClose} className="ml-auto rounded-full bg-black/20 p-2 text-white"><X className="h-4 w-4" /></button></div></div><div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/25 p-4 text-sm text-white backdrop-blur"><span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Today’s story</span><p className="mt-2 leading-6">The process is part of the product. Keep showing up.</p></div></div></div>; }
