export const CALL_POLL_INTERVALS = {
  active: 500,
  incoming: 700,
  history: 2500,
} as const;

export type CallStatus = "pending" | "accepted" | "declined" | "missed" | "ended";

const allowedTransitions: Record<CallStatus, readonly CallStatus[]> = {
  pending: ["accepted", "declined", "missed", "ended"],
  accepted: ["ended"],
  declined: [],
  missed: [],
  ended: [],
};

export function canTransitionCallStatus(from: CallStatus, to: CallStatus) {
  return from === to || allowedTransitions[from].includes(to);
}
