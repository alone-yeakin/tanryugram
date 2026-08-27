import { z } from "zod";

const proposalSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(800),
  steps: z.array(z.string().min(1).max(240)).min(1).max(8),
  safeActions: z.array(z.enum([
    "enable_signup_verification",
    "disable_signup_verification",
    "enable_email_delivery",
    "disable_email_delivery",
    "enable_appscript_login",
    "disable_appscript_login",
    "enable_appscript_reset",
    "disable_appscript_reset",
    "enable_photo_uploads",
    "disable_photo_uploads",
    "enable_video_uploads",
    "disable_video_uploads",
  ])).max(8),
  requiresCodeChange: z.boolean(),
  warning: z.string().max(500),
});

export type GeminiFeatureProposal = z.infer<typeof proposalSchema>;

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error("Gemini returned no structured proposal");
  return JSON.parse(candidate);
}

export async function generateGeminiFeatureProposal(request: string, currentSettings: Record<string, unknown>): Promise<GeminiFeatureProposal> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured");
  const prompt = `You are the owner-only feature planning assistant for TanRyuGram, a creator social platform.\n\nThe owner request is:\n${request}\n\nCurrent owner settings:\n${JSON.stringify(currentSettings)}\n\nReturn ONLY valid JSON with this exact shape:\n{"title":"short title","summary":"concise explanation","steps":["step"],"safeActions":["action"],"requiresCodeChange":true,"warning":"security or limitation warning"}\n\nAllowed safeActions are only: enable_signup_verification, disable_signup_verification, enable_email_delivery, disable_email_delivery, enable_appscript_login, disable_appscript_login, enable_appscript_reset, disable_appscript_reset, enable_photo_uploads, disable_photo_uploads, enable_video_uploads, disable_video_uploads.\n\nNever propose changing passwords, authentication ownership, user permissions, media storage paths, database records, payment settings, private messages, or security secrets through this assistant. If the request needs source-code work, set requiresCodeChange to true, leave safeActions empty unless a listed setting is independently safe, and explain that a code review and new deployment are required. Do not invent that code was changed or deployed.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json" } }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Gemini request failed (${response.status})`);
  const payload = JSON.parse(body) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return proposalSchema.parse(extractJson(text));
}

const chatMessageSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) });

export async function generateGeminiChatReply(messages: Array<{ role: "user" | "assistant"; content: string }>, currentSettings: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured");
  const boundedMessages = messages.slice(-18).map((message) => chatMessageSchema.parse(message));
  const contents = boundedMessages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
  const systemInstruction = `You are the private owner-only Gemini assistant inside TanRyuGram Creator Studio. Help the owner understand the platform, plan features, troubleshoot, and use existing safe controls. Current safe settings: ${JSON.stringify(currentSettings)}. Be clear about what is only a proposal versus what was actually changed. Never claim to edit or deploy source code. Never reveal API keys, passwords, private messages, user exports, session data, or hidden security settings. Never recommend changing the working photo/media rendering or storage system without a reviewed engineering change. If the owner asks to apply an existing safe setting, explain that the separate confirmation control must be used. Keep replies concise, practical, and honest.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents, generationConfig: { temperature: 0.35, maxOutputTokens: 1200 } }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Gemini chat request failed (${response.status})`);
  const payload = JSON.parse(body) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty chat response");
  return text;
}

export function applySafeGeminiActions(actions: GeminiFeatureProposal["safeActions"], current: { emailDeliveryEnabled: boolean; signupVerificationEnabled: boolean; appScriptLoginEnabled: boolean; appScriptResetEnabled: boolean; photosEnabled: boolean; profilePhotosEnabled: boolean; videosEnabled: boolean }) {
  const next = { ...current };
  for (const action of actions) {
    if (action === "enable_signup_verification") next.signupVerificationEnabled = true;
    if (action === "disable_signup_verification") next.signupVerificationEnabled = false;
    if (action === "enable_email_delivery") next.emailDeliveryEnabled = true;
    if (action === "disable_email_delivery") next.emailDeliveryEnabled = false;
    if (action === "enable_appscript_login") next.appScriptLoginEnabled = true;
    if (action === "disable_appscript_login") next.appScriptLoginEnabled = false;
    if (action === "enable_appscript_reset") next.appScriptResetEnabled = true;
    if (action === "disable_appscript_reset") next.appScriptResetEnabled = false;
    if (action === "enable_photo_uploads") {
      next.photosEnabled = true;
      next.profilePhotosEnabled = true;
    }
    if (action === "disable_photo_uploads") {
      next.photosEnabled = false;
      next.profilePhotosEnabled = false;
    }
    if (action === "enable_video_uploads") next.videosEnabled = true;
    if (action === "disable_video_uploads") next.videosEnabled = false;
  }
  if (next.signupVerificationEnabled && !next.emailDeliveryEnabled) throw new Error("Signup verification cannot be enabled while email delivery is disabled");
  return next;
}
