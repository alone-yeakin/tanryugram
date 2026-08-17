import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { WebView } from "react-native-webview";
import type { WebViewErrorEvent, WebViewHttpErrorEvent, WebViewNavigation } from "react-native-webview/lib/WebViewTypes";

const APP_URL = "https://tanryugram-njs4tc3o.manus.space";
const APP_HOST = new URL(APP_URL).host;
type RingtoneId = "default" | "soft" | "bright";
type IncomingCall = { callId: number; callType: "audio" | "video"; callerName: string };
let selectedRingtone: RingtoneId = "default";
const ringtoneSound = (value: RingtoneId) => value === "soft" ? "soft_ringtone.wav" : value === "bright" ? "bright_ringtone.wav" : "default";
const ringtoneChannel = (value: RingtoneId) => `calls_${value}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return null;
  if (Device.osName === "Android") {
    for (const ringtone of ["default", "soft", "bright"] as RingtoneId[]) {
      await Notifications.setNotificationChannelAsync(ringtoneChannel(ringtone), {
        name: `TanRyuGram ${ringtone === "default" ? "system" : ringtone} calls`,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300, 200, 300],
        sound: ringtoneSound(ringtone),
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }
  const token = await Notifications.getDevicePushTokenAsync();
  return token.data;
}

function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#7c3aed" />
      <Text style={styles.loadingTitle}>Opening Tanryugram</Text>
      <Text style={styles.loadingText}>Preparing your secure community session…</Text>
    </View>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centered}>
      <View style={styles.errorCard}>
        <Text style={styles.errorEyebrow}>Tanryugram</Text>
        <Text style={styles.errorTitle}>Connection problem</Text>
        <Text style={styles.errorText}>{message}</Text>
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Please check your internet connection and try again.");
  const [reloadKey, setReloadKey] = useState(0);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [sessionStatus, setSessionStatus] = useState("Connecting secure session…");
  const nativePushToken = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const registration = registerForPushNotificationsAsync()
      .then((token) => {
        if (!mounted || !token) return;
        nativePushToken.current = token;
        webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-push-token',{detail:{token:${JSON.stringify(token)}}})); true;`);
      })
      .catch(() => undefined);
    const dispatchNativeCall = (data: Record<string, unknown>) => {
      if (data?.route !== "call" && data?.event !== "incoming_call" && !data?.callId) return;
      const callId = Number(data.callId);
      if (Number.isFinite(callId) && callId > 0) {
        setIncomingCall({
          callId,
          callType: data.callType === "video" ? "video" : "audio",
          callerName: String(data.callerName || "A TanRyuGram member"),
        });
      }
      const payload = JSON.stringify(data);
      webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-call-open',{detail:${payload}})); true;`);
    };
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      dispatchNativeCall(notification.request.content.data as Record<string, unknown>);
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      dispatchNativeCall(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => {
      mounted = false;
      void registration;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const retry = useCallback(() => {
    setHasError(false);
    setErrorMessage("Please check your internet connection and try again.");
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigation = (navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
    if (navigation.loading) {
      setHasError(false);
      setSessionStatus("Connecting secure session…");
    }
  };

  const handleError = (event: WebViewErrorEvent) => {
    setHasError(true);
    setErrorMessage(event.nativeEvent.description || "Tanryugram could not reach the server.");
  };

  const handleHttpError = (event: WebViewHttpErrorEvent) => {
    if (event.nativeEvent.statusCode >= 500) {
      setHasError(true);
      setErrorMessage(`The Tanryugram server returned ${event.nativeEvent.statusCode}. Please try again shortly.`);
    }
  };

  const openIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    const payload = JSON.stringify({ event: "incoming_call", route: "call", ...incomingCall });
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-call-open',{detail:${payload}})); true;`);
    setIncomingCall(null);
  }, [incomingCall]);

  const dismissIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    const payload = JSON.stringify({ event: "incoming_call_response", route: "call", callId: incomingCall.callId, status: "declined" });
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-call-response',{detail:${payload}})); true;`);
    webViewRef.current?.postMessage(JSON.stringify({ type: "decline-incoming-call", ...incomingCall }));
    setIncomingCall(null);
  }, [incomingCall]);

  const injectNativePushToken = useCallback(() => {
    setSessionStatus("Secure session ready");
    const token = nativePushToken.current;
    if (!token) return;
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-push-token',{detail:{token:${JSON.stringify(token)}}})); true;`);
  }, []);

  const handleWebMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; callId?: number; callType?: "audio" | "video"; callerName?: string; ringtone?: RingtoneId; authenticated?: boolean; loading?: boolean; sessionExpired?: boolean; userName?: string | null };
      if (message.type === "auth-state") {
        setSessionStatus(message.loading ? "Checking account…" : message.sessionExpired ? "Session expired · sign in again" : message.authenticated ? `Signed in${message.userName ? ` as ${message.userName}` : ""}` : "Sign in required");
        return;
      }
      if (message.type === "set-ringtone" && message.ringtone && ["default", "soft", "bright"].includes(message.ringtone)) {
        selectedRingtone = message.ringtone;
        return;
      }
      if (message.type !== "incoming-call" || !message.callId) return;
      void Notifications.scheduleNotificationAsync({
        content: {
          title: `Incoming ${message.callType || "audio"} call`,
          body: `${message.callerName || "A TanRyuGram member"} is calling you on TanRyuGram`,
          sound: ringtoneSound(selectedRingtone),
          data: { event: "incoming_call", route: "call", callId: message.callId, callType: message.callType || "audio", callerName: message.callerName || "A TanRyuGram member", fullScreen: "true" },
          ...(Device.osName === "Android" ? { channelId: ringtoneChannel(selectedRingtone) } : {}),
        } as any,
        trigger: null,
      });
    } catch {
      // Ignore ordinary WebView messages and malformed page messages.
    }
  }, []);

  const handleExternalLink = (request: { url: string }) => {
    try {
      const parsed = new URL(request.url);
      if (parsed.protocol !== "https:") return false;
      const isSignedMediaHost = parsed.hostname.endsWith(".cloudfront.net") || parsed.hostname.endsWith(".amazonaws.com");
      if (parsed.host === APP_HOST || parsed.pathname.startsWith("/manus-storage/") || isSignedMediaHost) return true;
      Linking.openURL(request.url).catch(() => undefined);
      return false;
    } catch {
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f7fb" />
      {hasError ? (
        <ErrorView message={errorMessage} onRetry={retry} />
      ) : (
        <View style={styles.webviewShell}>
        <View style={styles.sessionBar}><View style={styles.sessionDot} /><Text style={styles.sessionLabel}>Tanryugram mobile</Text><Text style={styles.sessionStatus}>{sessionStatus}</Text></View>
        <WebView
          key={reloadKey}
          ref={webViewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          originWhitelist={["https://*"]}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          javaScriptCanOpenWindowsAutomatically
          setSupportMultipleWindows={false}
          mixedContentMode="never"
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          geolocationEnabled
          allowFileAccess
          allowFileAccessFromFileURLs={false}
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          pullToRefreshEnabled
          startInLoadingState
          renderLoading={() => <LoadingView />}
          onNavigationStateChange={handleNavigation}
          onLoadEnd={injectNativePushToken}
          onMessage={handleWebMessage}
          onShouldStartLoadWithRequest={handleExternalLink}
          onError={handleError}
          onHttpError={handleHttpError}
          onContentProcessDidTerminate={retry}
          onRenderProcessGone={retry}
          textZoom={100}
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          automaticallyAdjustContentInsets={false}
          applicationNameForUserAgent="Tanryugram/1.1"
        />
        {incomingCall ? (
          <View style={styles.incomingCallCard} accessibilityViewIsModal>
            <View style={styles.incomingCallGlow} />
            <Text style={styles.incomingEyebrow}>Tanryugram · incoming {incomingCall.callType} call</Text>
            <View style={styles.incomingAvatar}><Text style={styles.incomingAvatarText}>{incomingCall.callerName.slice(0, 1).toUpperCase()}</Text></View>
            <Text style={styles.incomingName}>{incomingCall.callerName}</Text>
            <Text style={styles.incomingHint}>Answer from the secure call room</Text>
            <View style={styles.incomingActions}>
              <Pressable onPress={dismissIncomingCall} style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Decline call"><Text style={styles.declineLabel}>Decline</Text></Pressable>
              <Pressable onPress={openIncomingCall} style={({ pressed }) => [styles.answerButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Answer call"><Text style={styles.answerLabel}>Answer</Text></Pressable>
            </View>
            {Platform.OS === "android" ? <Text style={styles.lockScreenHint}>Push alerts are enabled for background and lock-screen delivery.</Text> : null}
          </View>
        ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7fb",
  },
  webviewShell: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: "#f8f7fb",
  },
  sessionBar: { height: 28, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, backgroundColor: "#f8f7fb", gap: 6 },
  sessionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  sessionLabel: { color: "#27222f", fontSize: 10, fontWeight: "800" },
  sessionStatus: { marginLeft: "auto", color: "#817a8f", fontSize: 9 },
  incomingCallCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 18,
    borderRadius: 28,
    backgroundColor: "#16131f",
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  incomingCallGlow: {
    position: "absolute",
    top: -34,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#7c3aed",
    opacity: 0.18,
  },
  incomingEyebrow: {
    color: "#c4b5fd",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  incomingAvatar: {
    width: 72,
    height: 72,
    marginTop: 16,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8b5cf6",
    borderWidth: 3,
    borderColor: "#c4b5fd",
  },
  incomingAvatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  incomingName: { marginTop: 12, color: "#fff", fontSize: 20, fontWeight: "800" },
  incomingHint: { marginTop: 5, color: "#aaa3b8", fontSize: 12 },
  incomingActions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 20 },
  declineButton: { flex: 1, alignItems: "center", borderRadius: 15, backgroundColor: "#312331", paddingVertical: 13 },
  answerButton: { flex: 1, alignItems: "center", borderRadius: 15, backgroundColor: "#22c55e", paddingVertical: 13 },
  declineLabel: { color: "#fda4af", fontSize: 13, fontWeight: "800" },
  answerLabel: { color: "#052e16", fontSize: 13, fontWeight: "800" },
  lockScreenHint: { marginTop: 14, color: "#817a8f", fontSize: 10, textAlign: "center" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f7fb",
    paddingHorizontal: 24,
  },
  loadingTitle: {
    marginTop: 18,
    color: "#17151d",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 8,
    color: "#74717d",
    fontSize: 13,
    textAlign: "center",
  },
  errorCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 24,
    shadowColor: "#17151d",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  errorEyebrow: {
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  errorTitle: {
    marginTop: 8,
    color: "#17151d",
    fontSize: 22,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 10,
    color: "#74717d",
    fontSize: 14,
    lineHeight: 21,
  },
  retryButton: {
    marginTop: 20,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#17151d",
    paddingVertical: 13,
  },
  retryLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
