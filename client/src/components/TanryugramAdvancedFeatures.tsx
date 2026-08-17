import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Phone, Video, Volume2, VolumeX, Camera, ChevronLeft, ChevronRight, ImagePlus, MoreHorizontal, Reply, Trash2, Smile, Send, X, UserRound, Search, Users, PhoneOff, PictureInPicture } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { SafeImage } from "@/components/SafeImage";
import { CALL_POLL_INTERVALS } from "@/lib/callPolling";

const storyFallback = [
  { name: "Your story", handle: "you", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&q=80", own: true },
  { name: "Nadia", handle: "nadia.codes", image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=180&q=80" },
  { name: "Mika", handle: "mika.studio", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=180&q=80" },
  { name: "Theo", handle: "theo.makes", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&q=80" },
  { name: "Lena", handle: "lena.inmotion", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=180&q=80" },
];

function dataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function StoryBarLive({ onOpen }: { onOpen: (story: any, allStories?: any[]) => void }) {
  const storyQuery = trpc.stories.list.useQuery();
  const upload = trpc.media.uploadBase64.useMutation();
  const policyQuery = trpc.media.policy.useQuery();
  const create = trpc.stories.create.useMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const rows = storyQuery.data ?? [];
  const policy = policyQuery.data || { photosEnabled: true, videosEnabled: false };
  const stories = rows.length ? rows.map((row: any) => { const owner = row.owner || {}; return { id: row.story.id, name: owner.name || "Tanryugram creator", handle: owner.username || `creator-${row.story.userId}`, image: owner.avatarUrl || null, mediaUrl: row.story.mediaUrl, mediaType: row.story.mediaType, expiresAt: row.story.expiresAt, own: false }; }) : storyFallback;
  const addStory = async (file?: File) => {
    if (!file) return;
    if (!policy.photosEnabled) { toast.error("Photo uploads are temporarily paused by the owner"); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 10 * 1024 * 1024) { toast.error("Choose a JPG, PNG, WEBP, or GIF photo up to 10 MB"); return; }
    try {
      setUploading(true);
      setUploadProgress(25);
      const base64 = await dataUrl(file);
      setUploadProgress(50);
      const uploaded = await upload.mutateAsync({ fileName: file.name, base64Data: base64, contentType: file.type || "image/jpeg" });
      setUploadProgress(80);
      const created = await create.mutateAsync({ mediaUrl: uploaded.url, mediaType: "image" });
      setUploadProgress(100);
      toast.success("Story posted", { description: "It will be visible for 24 hours." });
      storyQuery.refetch();
      onOpen({ id: created, name: "Your story", handle: "you", mediaUrl: uploaded.url, image: uploaded.url, own: true }, stories);
    } catch (error: any) {
      toast.error("Could not upload story", { description: error?.message || "Please try again." });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  return <section className="mb-8 overflow-hidden rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-500">Live from the community</p><h2 className="mt-1 font-display text-lg font-semibold">Stories <span className="text-muted-foreground">/ 24h</span></h2></div><span className="text-xs text-muted-foreground">Auto-expire enabled</span></div>
    <input ref={inputRef} type="file" accept={policy.photosEnabled ? "image/jpeg,image/png,image/webp,image/gif" : ""} disabled={!policy.photosEnabled || uploading} className="hidden" onChange={(event) => addStory(event.target.files?.[0])} />
    <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
      <button disabled={uploading} onClick={() => inputRef.current?.click()} className="group flex w-[70px] shrink-0 flex-col items-center gap-2 disabled:opacity-50"><div className="relative rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-orange-400 p-[2px]"><div className="relative rounded-full bg-card p-[2px]"><SafeImage src={stories[0]?.image || storyFallback[0].image} fallbackName={stories[0]?.name || "Your story"} alt="Your story" className={`h-11 w-11 rounded-full object-cover transition-all ${uploading ? "opacity-40 blur-[1px]" : ""}`} />{uploading && <div className="absolute inset-0 flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" /></div>}</div><span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-foreground text-background"><ImagePlus className="h-3 w-3" /></span></div><span className="max-w-[70px] truncate text-[11px] font-medium text-muted-foreground">{uploading ? `${uploadProgress}%` : "Your story"}</span></button>
      {stories.slice(1).map((story: any) => <button key={`${story.handle}-${story.id || "fallback"}`} onClick={() => onOpen(story, stories)} className="group flex w-[70px] shrink-0 flex-col items-center gap-2"><div className="rounded-full bg-gradient-to-tr from-orange-400 via-fuchsia-500 to-violet-600 p-[2px]"><div className="rounded-full bg-card p-[2px]"><SafeImage src={story.image || story.mediaUrl} fallbackName={story.name} alt={story.name || "Story"} className="h-11 w-11 rounded-full object-cover transition-transform group-hover:scale-105" /></div></div><span className="max-w-[70px] truncate text-[11px] font-medium text-foreground">{story.name}</span></button>)}
    </div>
  </section>;
}

export function StoryViewerLive({ story, onClose, onNext, onPrevious }: { story: any; onClose: () => void; onNext?: () => void; onPrevious?: () => void }) {
  const viewMutation = trpc.stories.view.useMutation();
  const viewerQuery = trpc.stories.viewers.useQuery({ storyId: Number(story?.id || 0) }, { enabled: Boolean(story?.id) });
  const [progress, setProgress] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  useEffect(() => {
    if (!story) return;
    if (story.id) viewMutation.mutate({ storyId: Number(story.id) });
    const began = Date.now();
    const ticker = window.setInterval(() => setProgress(Math.min(100, ((Date.now() - began) / 5000) * 100)), 80);
    const advance = window.setTimeout(() => (onNext || onClose)(), 5000);
    return () => { window.clearInterval(ticker); window.clearTimeout(advance); };
  }, [story, onClose, onNext]);
  if (!story) return null;
  const media = story.mediaUrl || story.image;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm" onPointerDown={(event) => { startX.current = event.clientX; startY.current = event.clientY; }} onPointerUp={(event) => { if (startY.current !== null && event.clientY - startY.current > 80) onClose(); startX.current = null; startY.current = null; }} onClick={onClose}>
    <div className="relative h-[min(780px,94vh)] w-full max-w-[430px] overflow-hidden rounded-[30px] bg-zinc-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      {story.mediaType === "video" ? <video src={media} autoPlay playsInline className="h-full w-full object-cover" /> : <SafeImage src={media} fallbackName={story.name} alt="Story" className="h-full w-full object-cover" />}
      <div className="absolute inset-x-4 top-4"><div className="h-1 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-[width]" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex items-center gap-3"><div className="rounded-full bg-white/30 p-0.5"><SafeImage src={story.image || media} fallbackName={story.name} className="h-9 w-9 rounded-full object-cover" alt={story.name || "Story"} /></div><div><p className="text-sm font-semibold text-white">{story.name}</p><p className="text-[10px] text-white/70">@{story.handle || "creator"}</p></div><button onClick={onClose} className="ml-auto rounded-full bg-black/30 p-2 text-white"><X className="h-4 w-4" /></button></div></div>
      <button aria-label="Previous story" onClick={() => (onPrevious || onClose)()} className="absolute inset-y-0 left-0 w-1/3"><ChevronLeft className="ml-2 h-7 w-7 text-white/0 hover:text-white" /></button><button aria-label="Next story" onClick={() => (onNext || onClose)()} className="absolute inset-y-0 right-0 w-1/3"><ChevronRight className="ml-auto mr-2 h-7 w-7 text-white/0 hover:text-white" /></button>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/30 p-3 text-white backdrop-blur"><div className="flex items-center justify-between"><span className="text-xs">{story.own ? `${viewerQuery.data?.count ?? 0} views` : "Reply to this story"}</span>{story.own && <span className="text-[10px] text-white/70">Viewer list</span>}</div>{story.own && <div className="mt-2 flex gap-1.5">{(viewerQuery.data?.viewers ?? []).slice(0, 8).map((entry: any) => <SafeImage key={entry.viewer.id} src={entry.viewer.avatarUrl || media} fallbackName={entry.viewer.name || "Viewer"} className="h-6 w-6 rounded-full border border-white/40 object-cover" alt={entry.viewer.name || "Viewer"} />)}</div>}</div>
    </div>
  </div>;
}

const reactions = [{ type: "like", emoji: "👍", label: "Like" }, { type: "love", emoji: "❤️", label: "Love" }, { type: "haha", emoji: "😂", label: "Haha" }, { type: "wow", emoji: "😮", label: "Wow" }, { type: "sad", emoji: "😢", label: "Sad" }, { type: "angry", emoji: "😡", label: "Angry" }] as const;

export function ReactionButton({ postId, liked, onLike }: { postId: number; liked: boolean; onLike: () => void }) {
  const mutation = trpc.posts.reaction.useMutation();
  const reactionQuery = trpc.posts.reactions.useQuery({ postId });
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const longPress = useRef(false);
  const choose = (type: typeof reactions[number]["type"]) => { mutation.mutate({ postId, reactionType: type }); setOpen(false); reactionQuery.refetch(); };
  return <div className="relative flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}><button onPointerDown={() => { longPress.current = false; timer.current = window.setTimeout(() => { longPress.current = true; setOpen(true); }, 420); }} onPointerUp={() => { if (timer.current) window.clearTimeout(timer.current); }} onClick={() => { if (!longPress.current) onLike(); }} className={`rounded-full p-2 transition-all active:scale-90 ${liked ? "text-rose-500" : "text-foreground hover:bg-rose-500/10 hover:text-rose-500"}`} aria-label="React to post"><span className="text-[19px]">{liked ? "👍" : "♡"}</span></button>{open && <div className="absolute bottom-11 left-0 z-20 min-w-[210px] rounded-2xl border border-border bg-card p-2 shadow-xl animate-in zoom-in-95"><div className="flex gap-1">{reactions.map((reaction) => <button key={reaction.type} title={reaction.label} onClick={() => choose(reaction.type)} className="text-xl transition-transform hover:scale-125">{reaction.emoji}</button>)}</div>{reactionQuery.data?.length ? <div className="mt-2 border-t border-border/60 pt-2">{reactionQuery.data.slice(0, 6).map((entry: any) => <div key={entry.reaction.id} className="flex items-center gap-2 py-1 text-[10px]"><SafeImage src={entry.user.avatarUrl} fallbackName={entry.user.name || "User"} className="h-5 w-5 rounded-full object-cover" alt={entry.user.name || "User"} /><span className="min-w-0 flex-1 truncate">{entry.user.name || "User"}</span><span>{reactions.find((reaction) => reaction.type === entry.reaction.reactionType)?.emoji || "👍"}</span></div>)}</div> : null}</div>}<button onClick={() => setDetailsOpen(true)} className="ml-1 text-xs font-semibold text-muted-foreground hover:text-foreground">{reactionQuery.data?.length ? `${reactionQuery.data.length} reactions` : ""}</button>{reactionQuery.data?.length ? <span className="ml-1 text-xs">{Array.from(new Set(reactionQuery.data.slice(0, 3).map((entry: any) => reactions.find((reaction) => reaction.type === entry.reaction.reactionType)?.emoji || "👍"))).join("")}</span> : null}{detailsOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 p-4" onClick={() => setDetailsOpen(false)}><div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Post reactions</p><h3 className="mt-1 text-lg font-semibold">Who reacted</h3></div><button onClick={() => setDetailsOpen(false)} className="rounded-full p-2 hover:bg-muted">×</button></div><div className="mt-4 space-y-2">{reactionQuery.data?.length ? reactionQuery.data.map((entry: any) => <div key={entry.reaction.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-2.5"><SafeImage src={entry.user.avatarUrl} fallbackName={entry.user.name || "User"} className="h-8 w-8 rounded-full object-cover" alt={entry.user.name || "User"} /><span className="min-w-0 flex-1 text-sm font-medium">{entry.user.name || "User"}</span><span className="text-lg">{reactions.find((reaction) => reaction.type === entry.reaction.reactionType)?.emoji || "👍"}</span></div>) : <p className="text-sm text-muted-foreground">No reactions yet.</p>}</div></div></div>}</div>;
}

export function MultiImageComposer({ onClose }: { onClose: () => void }) {
  const upload = trpc.media.uploadBase64.useMutation();
  const policyQuery = trpc.media.policy.useQuery();
  const create = trpc.posts.create.useMutation();
  const [files, setFiles] = useState<File[]>([]);
  const [active, setActive] = useState(0);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [tags, setTags] = useState("");
  const [publishing, setPublishing] = useState(false);
  const policy = policyQuery.data || { photosEnabled: true, videosEnabled: false };
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);
  const chooseFiles = (incoming: FileList | null) => {
    const selected = Array.from(incoming || []);
    const valid = selected.filter((file) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) && file.size <= 10 * 1024 * 1024);
    if (!policy.photosEnabled) { toast.error("Photo uploads are temporarily paused by the owner"); return; }
    if (selected.length > valid.length) toast.error("Use JPG, PNG, WEBP, or GIF photos up to 10 MB each");
    setFiles(valid.slice(0, 10));
    setActive(0);
  };
  const publish = async () => {
    if (!policy.photosEnabled) { toast.error("Photo uploads are temporarily paused by the owner"); return; }
    if (!files.length) { toast.error("Add at least one image"); return; }
    try {
      setPublishing(true);
      const urls: string[] = [];
      for (const file of files) {
        const uploaded = await upload.mutateAsync({ fileName: file.name, base64Data: await dataUrl(file), contentType: file.type });
        urls.push(uploaded.url);
      }
      await create.mutateAsync({ caption, mediaUrl: urls[0], mediaUrls: urls, mediaType: "image", location: location || undefined, feeling: feeling || undefined, taggedUsers: tags || undefined, isPremium: false });
      toast.success("Post published", { description: `${urls.length} image${urls.length > 1 ? "s" : ""} shared with your community.` });
      onClose();
    } catch (error: any) { toast.error("Could not publish post", { description: error?.message || "Please try again." }); } finally { setPublishing(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}><div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">New post</p><h2 className="mt-1 text-xl font-semibold">Share up to 10 images</h2></div><button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div><label className="mt-5 block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border bg-muted/60"><input type="file" accept={policy.photosEnabled ? "image/jpeg,image/png,image/webp,image/gif" : ""} multiple disabled={!policy.photosEnabled || publishing} onChange={(event) => chooseFiles(event.target.files)} className="hidden" />{files.length ? <div className="relative"><img src={previewUrls[active]} className="aspect-video w-full object-cover" alt="Preview" /><div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">{files.map((_, index) => <button type="button" key={index} onClick={(event) => { event.preventDefault(); setActive(index); }} className={`h-1.5 rounded-full ${index === active ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />)}</div><span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white">{files.length}/10</span></div> : <div className="flex aspect-video flex-col items-center justify-center gap-2"><ImagePlus className="h-6 w-6 text-violet-500" /><p className="text-sm font-semibold">Choose images</p><p className="text-xs text-muted-foreground">{policy.photosEnabled ? "Photos up to 10 MB each · up to 10 images" : "Photo uploads are temporarily paused"}</p></div>}</label><textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Write a caption..." className="mt-4 min-h-20 w-full resize-none rounded-2xl bg-muted p-4 text-sm outline-none focus:ring-2 focus:ring-violet-500/20" /><div className="mt-3 grid grid-cols-2 gap-2"><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tag usernames" className="rounded-xl bg-muted px-3 py-2.5 text-xs outline-none" /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Add location" className="rounded-xl bg-muted px-3 py-2.5 text-xs outline-none" /><input value={feeling} onChange={(event) => setFeeling(event.target.value)} placeholder="Feeling / activity" className="col-span-2 rounded-xl bg-muted px-3 py-2.5 text-xs outline-none" /></div><button disabled={publishing} onClick={publish} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50">{publishing ? "Publishing..." : "Publish post"}<Send className="h-4 w-4" /></button></div></div>;
}

export function CallOverlay({ callId, callType, isCaller, peer, onClose, onCallAgain }: { callId: number; callType: "audio" | "video"; isCaller: boolean; peer?: any; onClose: () => void; onCallAgain?: () => void }) {
  const callQuery = trpc.messages.getCall.useQuery({ callId }, { refetchInterval: CALL_POLL_INTERVALS.active, refetchOnWindowFocus: true });
  const signal = trpc.messages.signal.useMutation();
  const updateCall = trpc.messages.updateCall.useMutation();
  const [muted, setMuted] = useState(true);
  const [speaker, setSpeaker] = useState(true);
  const [ending, setEnding] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const applied = useRef<string>("");
  const streamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        const message = "Calls need Chrome or Safari with microphone access.";
        setMediaError(message);
        toast.error("Could not start call", { description: message });
        await updateCall.mutateAsync({ callId, status: "ended", durationSeconds: 0 }).catch(() => undefined);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "video" });
        if (cancelled) return;
        streamRef.current = stream;
        if (localVideo.current) localVideo.current.srcObject = stream;
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pc.ontrack = (event) => { if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0]; if (remoteAudio.current) remoteAudio.current.srcObject = event.streams[0]; };
        pc.onicecandidate = () => { /* candidates are included after ICE gathering below */ };
        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await new Promise<void>((resolve) => { if (pc.iceGatheringState === "complete") resolve(); else { const handler = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", handler); resolve(); } }; pc.addEventListener("icegatheringstatechange", handler); window.setTimeout(resolve, 4000); } });
          await signal.mutateAsync({ callId, signalData: JSON.stringify({ kind: "offer", description: pc.localDescription }), status: "pending" });
        }
      } catch (error: any) {
        const message = error?.name === "NotFoundError" ? "No microphone or camera device is available in this browser." : error?.name === "NotAllowedError" ? "Allow microphone and camera access in your browser to call." : error?.message || "Check microphone and camera permissions.";
        setMediaError(message);
        toast.error("Could not start call", { description: message });
        await updateCall.mutateAsync({ callId, status: "ended", durationSeconds: 0 }).catch(() => undefined);
      }
    };
    setup();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((track) => track.stop()); pcRef.current?.close(); };
  }, [callId, callType, isCaller]);
  useEffect(() => {
    const payload = callQuery.data?.signalData;
    if (!payload || payload === applied.current || !pcRef.current) return;
    applied.current = payload;
    const consume = async () => {
      const data = JSON.parse(payload);
      if (!isCaller && data.kind === "offer") {
        await pcRef.current?.setRemoteDescription(data.description);
        const answer = await pcRef.current?.createAnswer();
        if (!answer) return;
        await pcRef.current?.setLocalDescription(answer);
        await new Promise<void>((resolve) => { if (pcRef.current?.iceGatheringState === "complete") resolve(); else { const handler = () => { if (pcRef.current?.iceGatheringState === "complete") { pcRef.current.removeEventListener("icegatheringstatechange", handler); resolve(); } }; pcRef.current?.addEventListener("icegatheringstatechange", handler); window.setTimeout(resolve, 4000); } });
        await signal.mutateAsync({ callId, signalData: JSON.stringify({ kind: "answer", description: pcRef.current?.localDescription }), status: "accepted" });
      } else if (isCaller && data.kind === "answer") {
        await pcRef.current?.setRemoteDescription(data.description);
      }
    };
    consume().catch(() => undefined);
  }, [callQuery.data?.signalData, callId, isCaller]);
  const cleanupMedia = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); pcRef.current?.close(); streamRef.current = null; pcRef.current = null; };
  useEffect(() => { if (callQuery.data?.status === "accepted") setMuted(false); }, [callQuery.data?.status]);
  useEffect(() => { if (callQuery.data?.status !== "pending" && callQuery.data?.status !== "declined" && callQuery.data?.status !== "ended" && callQuery.data?.status !== "missed") { const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000); return () => window.clearInterval(timer); } return undefined; }, [callQuery.data?.status]);
  useEffect(() => { if (!isCaller || callQuery.data?.status !== "pending") return; const timeout = window.setTimeout(() => { updateCall.mutate({ callId, status: "missed", durationSeconds: 0 }); cleanupMedia(); setShowEnded(true); }, 30000); return () => window.clearTimeout(timeout); }, [callQuery.data?.status, callId, isCaller]);
  useEffect(() => { if (!["declined", "ended", "missed"].includes(callQuery.data?.status || "") || showEnded) return; cleanupMedia(); setShowEnded(true); }, [callQuery.data?.status, showEnded]);
  useEffect(() => { if (!showEnded) return; const timeout = window.setTimeout(onClose, 3000); return () => window.clearTimeout(timeout); }, [showEnded, onClose]);
  const flipCamera = async () => { if (callType !== "video" || !pcRef.current || !navigator.mediaDevices?.getUserMedia) return; const nextMode = facingMode === "user" ? "environment" : "user"; const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextMode }, audio: false }); const nextTrack = nextStream.getVideoTracks()[0]; const sender = pcRef.current.getSenders().find((candidate) => candidate.track?.kind === "video"); if (sender && nextTrack) await sender.replaceTrack(nextTrack); streamRef.current?.getVideoTracks().forEach((track) => track.stop()); streamRef.current?.addTrack(nextTrack); if (localVideo.current) localVideo.current.srcObject = streamRef.current; setFacingMode(nextMode); };
  const toggleSpeaker = async () => { const enabled = !speaker; const element = remoteAudio.current || remoteVideo.current; if (element) { element.volume = enabled ? 1 : 0.25; const sinkElement = element as HTMLMediaElement & { setSinkId?: (sinkId: string) => Promise<void> }; if (sinkElement.setSinkId) { try { await sinkElement.setSinkId("default"); } catch { /* Browser does not expose output-device selection. */ } } } setSpeaker(enabled); };
  const toggleVideo = () => { const next = !videoEnabled; streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = next; }); setVideoEnabled(next); };
  const togglePictureInPicture = async () => {
    if (callType !== "video") return;
    const video = remoteVideo.current?.srcObject ? remoteVideo.current : localVideo.current;
    if (!video || !document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== "function") { toast("Picture-in-picture is unavailable", { description: "Use a browser that supports video picture-in-picture." }); return; }
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch (error: any) {
      toast("Picture-in-picture could not start", { description: error?.message || "Try again after the video connects." });
    }
  };
  const end = async () => { if (ending) return; setEnding(true); try { await updateCall.mutateAsync({ callId, status: "ended", durationSeconds: elapsed }); } finally { cleanupMedia(); setShowEnded(true); setEnding(false); } };
  if (mediaError) return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950 p-6 text-center text-white"><div className="max-w-sm"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/15"><PhoneOff className="h-10 w-10 text-rose-400" /></div><h2 className="mt-6 text-2xl font-semibold">Call unavailable</h2><p className="mt-2 text-sm leading-6 text-white/60">{mediaError}</p><div className="mt-8 flex gap-3"><button onClick={() => { onClose(); onCallAgain?.(); }} className="rounded-2xl bg-white px-5 py-3 text-xs font-semibold text-zinc-950">Try again</button><button onClick={onClose} className="rounded-2xl bg-white/10 px-5 py-3 text-xs font-semibold text-white">Back to chat</button></div></div></div>;
  if (showEnded) return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950 p-6 text-center text-white"><div><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10"><PhoneOff className="h-10 w-10 text-rose-400" /></div><h2 className="mt-6 text-2xl font-semibold">Call ended</h2><p className="mt-2 text-sm text-white/60">Duration {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</p><div className="mt-8 flex gap-3"><button onClick={() => { onClose(); onCallAgain?.(); }} className="rounded-2xl bg-white px-5 py-3 text-xs font-semibold text-zinc-950">Call again</button><button onClick={onClose} className="rounded-2xl bg-white/10 px-5 py-3 text-xs font-semibold text-white">Back to chat</button></div><p className="mt-5 text-[10px] text-white/40">Returning to chat automatically…</p></div></div>;
  const peerAvatar = peer?.avatarUrl || peer?.avatar || peer?.profilePhotoUrl || peer?.photoUrl || peer?.imageUrl || null;
  const peerName = peer?.name || peer?.username || (isCaller ? "Calling" : "Incoming call");
  return <div className="safe-area-x fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950 text-white"><audio ref={remoteAudio} autoPlay playsInline className="hidden" /><div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-violet-950 via-zinc-950 to-black p-6 pb-[max(1.5rem,var(--tanry-safe-bottom))] text-center shadow-2xl">{callType === "video" && <><video ref={remoteVideo} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover opacity-80" /><video ref={localVideo} autoPlay muted playsInline className="absolute right-4 top-4 h-32 w-24 rounded-2xl border border-white/30 object-cover" /></>}<div className="relative z-10"><div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full bg-white/15 ring-8 ring-white/5"><SafeImage src={peerAvatar} fallbackName={peerName} alt={peerName} className="h-full w-full object-cover" /></div><p className="text-2xl font-semibold">{peerName}</p><p className="mt-2 text-sm text-white/60">{isCaller && callQuery.data?.status === "pending" ? "Calling…" : callQuery.data?.status === "pending" ? "Connecting…" : `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`}</p><div className="mx-auto mt-6 flex items-center justify-center gap-1.5 opacity-60"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" /><span className="h-3 w-3 animate-pulse rounded-full bg-violet-300 [animation-delay:120ms]" /><span className="h-2 w-2 animate-pulse rounded-full bg-violet-300 [animation-delay:240ms]" /></div></div><div data-mobile-call-bar className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 px-4 pt-3"><button onClick={() => setMuted((value) => { const next = !value; streamRef.current?.getAudioTracks().forEach((track) => track.enabled = !next); return next; })} className={`rounded-full p-4 ${muted ? "bg-rose-500/80" : "bg-white/15"}`} title="Mute microphone">{muted ? <VolumeX className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button><button onClick={() => void toggleSpeaker()} className="rounded-full bg-white/15 p-4" title="Toggle speaker output">{speaker ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>{callType === "video" && <><button onClick={toggleVideo} className={`rounded-full p-4 ${videoEnabled ? "bg-white/15" : "bg-rose-500/80"}`} title="Toggle video"><Video className="h-5 w-5" /></button><button onClick={flipCamera} className="rounded-full bg-white/15 p-4" title="Flip camera"><Camera className="h-5 w-5" /></button><button onClick={() => void togglePictureInPicture()} className="rounded-full bg-white/15 p-4" title="Picture in picture"><PictureInPicture className="h-5 w-5" /></button></>}<button disabled={ending} onClick={() => void end()} className="rounded-full bg-rose-500 p-4 disabled:opacity-60" title="End call"><PhoneOff className="h-5 w-5" /></button></div></div></div>;
}

export function AdvancedMessagesView() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const searchQuery = trpc.discovery.search.useQuery({ query: search }, { enabled: search.trim().length > 1 });
  const [otherUserId, setOtherUserId] = useState(2);
  const threadQuery = trpc.messages.list.useQuery({ otherUserId }, { enabled: Boolean(user) });
  const callsQuery = trpc.messages.calls.useQuery({ otherUserId }, { enabled: Boolean(user), refetchInterval: CALL_POLL_INTERVALS.history });
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [pressedMessage, setPressedMessage] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [cancelRecording, setCancelRecording] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const recordStartX = useRef<number | null>(null);
  const [call, setCall] = useState<{ id: number; type: "audio" | "video"; caller: boolean } | null>(null);
  const send = trpc.messages.send.useMutation({ onSuccess: () => threadQuery.refetch() });
  const react = trpc.messages.react.useMutation({ onSuccess: () => threadQuery.refetch() });
  const remove = trpc.messages.delete.useMutation({ onSuccess: () => threadQuery.refetch() });
  const startCall = trpc.messages.startCall.useMutation();
  const updateCall = trpc.messages.updateCall.useMutation();
  const upload = trpc.media.uploadBase64.useMutation();
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { toast.error("Voice notes need microphone permission."); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.ondataavailable = (event) => chunks.current.push(event.data);
    mediaRecorder.onstop = async () => { stream.getTracks().forEach((track) => track.stop()); const blob = new Blob(chunks.current, { type: "audio/webm" }); const audio = await upload.mutateAsync({ fileName: `voice-${Date.now()}.webm`, base64Data: await dataUrl(blob), contentType: "audio/webm" }); await send.mutateAsync({ receiverId: otherUserId, content: "Voice note", audioUrl: audio.url, replyToId: replyTo?.id }); setReplyTo(null); };
    recorder.current = mediaRecorder; mediaRecorder.start(); setRecording(true); setRecordingMs(0); setCancelRecording(false);
  };
  useEffect(() => { if (!recording) return; const timer = window.setInterval(() => setRecordingMs((value) => value + 100), 100); return () => window.clearInterval(timer); }, [recording]);
  const handleRecordMove = (event: React.PointerEvent<HTMLButtonElement>) => { if (recordStartX.current !== null && event.clientX < recordStartX.current - 70) setCancelRecording(true); };
  const stopRecording = (cancel = false) => { if (!recorder.current) return; if (cancel) { recorder.current.onstop = null; recorder.current.stop(); setRecording(false); setRecordingMs(0); setCancelRecording(false); return; } recorder.current.stop(); setRecording(false); setRecordingMs(0); setCancelRecording(false); };
  const submit = () => { if (!draft.trim()) return; send.mutate({ receiverId: otherUserId, content: draft.trim(), replyToId: replyTo?.id }); setDraft(""); setReplyTo(null); };
  const beginCall = async (type: "audio" | "video") => { const id = await startCall.mutateAsync({ receiverId: otherUserId, callType: type }); if (id) setCall({ id: Number(id), type, caller: true }); };
  const incoming = callsQuery.data?.find((item: any) => item.callerId !== user?.id && item.receiverId === user?.id && item.status === "pending");
  const acceptIncoming = async () => { if (!incoming) return; await trpcUtilsUpdateCall(incoming.id, "accepted"); setCall({ id: incoming.id, type: incoming.callType, caller: false }); };
  const trpcUtilsUpdateCall = async (callId: number, status: "accepted" | "declined") => { await updateCall.mutateAsync({ callId, status }); callsQuery.refetch(); };
  const thread = threadQuery.data ?? [];
  return <>{call && <CallOverlay callId={call.id} callType={call.type} isCaller={call.caller} onClose={() => setCall(null)} />}{incoming && !call && <div className="mb-3 flex items-center gap-3 rounded-2xl border border-violet-300/50 bg-violet-500/10 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white"><Phone className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Incoming {incoming.callType} call</p><p className="text-[10px] text-muted-foreground">Accept to connect your microphone{incoming.callType === "video" ? " and camera" : ""}.</p></div><button onClick={acceptIncoming} className="rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-semibold text-white">Accept</button><button onClick={() => trpcUtilsUpdateCall(incoming.id, "declined")} className="rounded-xl bg-rose-500 px-3 py-2 text-[10px] font-semibold text-white">Decline</button></div>}<div className="grid min-h-[650px] overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm lg:grid-cols-[280px_1fr]"><aside className="border-b border-border/70 lg:border-b-0 lg:border-r"><div className="border-b border-border/70 p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">Messenger</p><h2 className="mt-1 font-semibold">Your conversations</h2></div><button className="rounded-xl p-2 hover:bg-muted"><Users className="h-4 w-4" /></button></div><div className="relative mt-4"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find by username" className="h-10 w-full rounded-xl bg-muted pl-9 text-xs outline-none" /></div>{searchQuery.data?.users?.length ? <div className="mt-2 space-y-1 rounded-2xl border border-border bg-card p-2">{searchQuery.data.users.slice(0, 5).map((result: any) => <button key={result.id} onClick={() => { setOtherUserId(result.id); setSearch(""); }} className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-muted"><SafeImage src={result.avatarUrl} fallbackName={result.name || result.username || "User"} className="h-8 w-8 rounded-full object-cover" alt={result.name || result.username || "User"} /><span className="min-w-0 flex-1"><b className="block truncate text-xs">{result.name || "User"}</b><span className="text-[10px] text-muted-foreground">@{result.username || "user"}</span></span></button>)}</div> : null}</div><div className="space-y-1 p-3"><button className="flex w-full items-center gap-3 rounded-2xl bg-muted p-3 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-violet-500"><UserRound className="h-4 w-4" /></span><span className="min-w-0 flex-1"><b className="block text-xs">Conversation {otherUserId}</b><span className="text-[10px] text-emerald-500">Active chat</span></span></button><div className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground">Search a username above to start another conversation.</div></div></aside><section className="flex min-w-0 flex-col"><header className="flex items-center gap-3 border-b border-border/70 p-4 sm:p-5"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-500"><UserRound className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">User {otherUserId}</p><p className="text-[11px] text-emerald-500">Active chat · blue ticks enabled</p></div><button onClick={() => beginCall("audio")} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Audio call"><Phone className="h-4 w-4" /></button><button onClick={() => beginCall("video")} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Video call"><Video className="h-4 w-4" /></button></header>{callsQuery.data?.length ? <div className="border-b border-border/70 px-4 py-2 sm:px-6"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Call history</p><div className="flex gap-2 overflow-x-auto">{callsQuery.data.slice(0, 5).map((item: any) => <span key={item.id} className="whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">{item.callType === "video" ? "Video" : "Audio"} · {item.status} · {item.durationSeconds ? `${item.durationSeconds}s` : "—"}</span>)}</div></div> : null}<div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">{thread.length ? thread.map((item: any) => { const mine = item.senderId === user?.id; return <div key={item.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`} onPointerDown={(event) => { const x = event.clientX; const timer = window.setTimeout(() => setPressedMessage(item.id), 450); (event.currentTarget as HTMLElement).dataset.pressTimer = String(timer); (event.currentTarget as HTMLElement).dataset.startX = String(x); }} onPointerUp={(event) => { const element = event.currentTarget as HTMLElement; const timer = Number(element.dataset.pressTimer); if (timer) window.clearTimeout(timer); if (Number(element.dataset.startX) && event.clientX - Number(element.dataset.startX) > 60) setReplyTo(item); }}><div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}><div className={`rounded-[20px] px-4 py-3 text-sm leading-6 ${mine ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md bg-muted"}`}>{item.replyToId && <div className="mb-2 border-l-2 border-violet-400 pl-2 text-[10px] opacity-70">Replying to a message</div>}{item.audioUrl ? <audio controls src={item.audioUrl} className="max-w-full" /> : item.content}</div><div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{mine && <span className="text-blue-500">{item.isRead ? "✓✓" : "✓"}</span>}<button onClick={() => react.mutate({ messageId: item.id, emoji: "❤️" })} className="opacity-0 transition group-hover:opacity-100">❤️</button></div>{pressedMessage === item.id && <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-lg"><button onClick={() => { react.mutate({ messageId: item.id, emoji: "👍" }); setPressedMessage(null); }} className="rounded-lg p-1.5 hover:bg-muted">👍</button><button onClick={() => { setReplyTo(item); setPressedMessage(null); }} className="rounded-lg p-1.5 hover:bg-muted"><Reply className="h-3.5 w-3.5" /></button>{mine && <><button onClick={() => { remove.mutate({ messageId: item.id, everyone: false }); setPressedMessage(null); }} className="rounded-lg p-1.5 hover:bg-muted"><Trash2 className="h-3.5 w-3.5" /></button><button onClick={() => { remove.mutate({ messageId: item.id, everyone: true }); setPressedMessage(null); }} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10">Delete all</button></>}</div>}</div></div>; }) : <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground"><div><p className="font-semibold text-foreground">Start a conversation</p><p className="mt-1">Search for a username, then send a message.</p></div></div>}<div className="flex justify-center"><span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">Messages are encrypted in transit</span></div></div><div className="border-t border-border/70 p-3 sm:p-4">{recording && <div className={`mb-2 flex items-center gap-3 rounded-2xl px-3 py-2 text-xs ${cancelRecording ? "bg-rose-500/15 text-rose-500" : "bg-violet-500/10 text-violet-500"}`}><span className="h-2 w-2 animate-pulse rounded-full bg-current" /><span className="font-semibold tabular-nums">{(recordingMs / 1000).toFixed(1)}s</span><div className="flex flex-1 items-center gap-1">{Array.from({ length: 18 }).map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < Math.min(18, Math.ceil(recordingMs / 220)) ? "bg-current" : "bg-current/20"}`} />)}</div><span className="text-[10px] font-semibold">{cancelRecording ? "Release to cancel" : "Slide left to cancel"}</span></div>}{replyTo && <div className="mb-2 flex items-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2 text-xs"><Reply className="h-3.5 w-3.5 text-violet-500" /><span className="min-w-0 flex-1 truncate">Replying to: {replyTo.content}</span><button onClick={() => setReplyTo(null)}><X className="h-3.5 w-3.5" /></button></div>}<div className="flex items-center gap-2 rounded-2xl bg-muted p-1.5"><button onPointerDown={(event) => { recordStartX.current = event.clientX; void startRecording(); }} onPointerMove={handleRecordMove} onPointerUp={() => stopRecording(cancelRecording)} onPointerLeave={() => recording && stopRecording(true)} className={`rounded-xl p-2 text-muted-foreground hover:bg-card ${recording ? "bg-rose-500 text-white" : ""}`} title="Hold to record voice note"><Mic className="h-4 w-4" /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder={recording ? "Recording voice note... release to send" : "Write a message..."} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground" /><button onClick={submit} className="rounded-xl bg-foreground p-2.5 text-background transition active:scale-90"><Send className="h-4 w-4" /></button></div></div></section></div></>;
}
