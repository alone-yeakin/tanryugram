import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let cachedApp: App | null = null;
let cachedMessaging: Messaging | null = null;

function getFirebaseMessaging() {
  if (cachedMessaging) return cachedMessaging;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  cachedApp = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  cachedMessaging = getMessaging(cachedApp);
  return cachedMessaging;
}

export async function sendIncomingCallPush(tokens: string[], payload: { callId: number; callerName: string; callType: "audio" | "video" }) {
  const messaging = getFirebaseMessaging();
  if (!messaging || tokens.length === 0) return { sent: 0, skipped: tokens.length };
  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: `Incoming ${payload.callType} call`,
      body: `${payload.callerName} is calling you on TanRyuGram`,
    },
    data: {
      event: "incoming_call",
      route: "call",
      callId: String(payload.callId),
      callType: payload.callType,
      callerName: payload.callerName,
      channelId: "calls_default",
      priority: "high",
      fullScreen: "true",
    },
    android: {
      priority: "high",
      collapseKey: `tanryugram-call-${payload.callId}`,
      ttl: 60 * 1000,
      directBootOk: true,
      notification: {
        channelId: "calls_default",
        sound: "default",
        defaultVibrateTimings: true,
        defaultSound: true,
        visibility: "public",
        priority: "max",
        tag: `tanryugram-call-${payload.callId}`,
        clickAction: "TANRYUGRAM_CALL",
      },
    },
  });
  return { sent: response.successCount, skipped: response.failureCount };
}

export function isFirebaseAdminConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
