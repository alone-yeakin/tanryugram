export const RINGTONE_OPTIONS = [
  { id: "default", label: "System default" },
  { id: "soft", label: "Soft pulse" },
  { id: "bright", label: "Bright ring" },
] as const;

export type RingtoneId = typeof RINGTONE_OPTIONS[number]["id"];

type AudioContextLike = AudioContext & { close?: () => Promise<void> };

function createContext() {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  return new AudioContextCtor() as AudioContextLike;
}

function pulse(context: AudioContextLike, ringtone: RingtoneId) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequency = ringtone === "bright" ? 880 : ringtone === "soft" ? 520 : 660;
  oscillator.frequency.value = frequency;
  oscillator.type = ringtone === "bright" ? "square" : "sine";
  const now = context.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.5);
}

export function startRingtoneLoop(ringtone: RingtoneId = "default") {
  const context = createContext();
  if (!context) return () => undefined;
  let stopped = false;
  let timer: number | undefined;
  const ring = () => {
    if (stopped) return;
    void context.resume().catch(() => undefined);
    pulse(context, ringtone);
    timer = window.setTimeout(ring, ringtone === "bright" ? 1250 : 1700);
  };
  ring();
  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
    void context.close?.().catch(() => undefined);
  };
}

export function playRingtonePreview(ringtone: RingtoneId = "default") {
  const stop = startRingtoneLoop(ringtone);
  if (typeof window !== "undefined") window.setTimeout(stop, 700);
}
