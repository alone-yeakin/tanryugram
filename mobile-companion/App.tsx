import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  PermissionsAndroid,
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

async function requestCallMediaPermissions(callType: "audio" | "video") {
  if (Platform.OS !== "android") return true;
  const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (callType === "video") permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

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
    await Notifications.setNotificationCategoryAsync("incoming_call", [
      { identifier: "answer", buttonTitle: "Answer", options: { opensAppToForeground: true } },
      { identifier: "decline", buttonTitle: "Decline", options: { isDestructive: true } },
    ]).catch(() => undefined);
    
    await Notifications.setNotificationChannelAsync("calls_default", {
      name: "TanRyuGram incoming calls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300, 200, 300],
      sound: "default",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
      enableVibrate: true,
    });
    for (const ringtone of ["soft", "bright"] as RingtoneId[]) {
      await Notifications.setNotificationChannelAsync(ringtoneChannel(ringtone), {
        name: `TanRyuGram ${ringtone} calls`,
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
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (mounted && response) dispatchNativeCall(response.notification.request.content.data as Record<string, unknown>);
    }).catch(() => undefined);

    const handleDeepLink = (event: { url: string }) => {
      if (event.url.includes("tanryugram://call") || event.url.includes("TANRYUGRAM_CALL")) {
        // Handled via notification listeners
      }
    };
    const linkSubscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
    return () => {
      mounted = false;
      void registration;
      receivedSubscription.remove();
      responseSubscription.remove();
      linkSubscription.remove();
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

  const openIncomingCall = useCallback(async () => {
    if (!incomingCall) return;
    await requestCallMediaPermissions(incomingCall.callType).catch(() => undefined);
    const payload = JSON.stringify({ event: "incoming_call", route: "call", ...incomingCall });
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-call-open',{detail:${payload}})); true;`);
    setIncomingCall(null);
  }, [incomingCall]);

  const dismissIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    const payload = JSON.stringify({ event: "incoming_call_response", route: "call", callId: incomingCall.callId, status: "declined" });
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-call-response',{detail:${payload}})); true;`);
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
          categoryIdentifier: "incoming_call",
          data: { event: "incoming_call", route: "call", callId: message.callId, callType: message.callType || "audio", callerName: message.callerName || "A TanRyuGram member", fullScreen: "true" },
          ...(Platform.OS === "android" ? { channelId: ringtoneChannel(selectedRingtone) } : {}),
        } as any,
        trigger: null,
      });
    } catch {
      // Ignore ordinary WebView messages
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {hasError ? (
        <ErrorView message={errorMessage} onRetry={retry} />
      ) : (
        <View style={styles.webviewShell}>
          <View style={styles.sessionBar}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionLabel}>Tanryugram mobile</Text>
            <Text style={styles.sessionStatus}>{sessionStatus}</Text>
          </View>
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
            applicationNameForUserAgent="Tanryugram/1.3"
          />
          {incomingCall && (
            <View style={styles.incomingCallCard} accessibilityViewIsModal>
              <View style={styles.incomingCallGlow} />
              <Text style={styles.incomingEyebrow}>Tanryugram · incoming {incomingCall.callType} call</Text>
              <View style={styles.incomingAvatar}>
                <Text style={styles.incomingAvatarText}>{incomingCall.callerName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.incomingName}>{incomingCall.callerName}</Text>
              <Text style={styles.incomingHint}>Answer from the secure call room</Text>
              <View style={styles.incomingActions}>
                <Pressable onPress={dismissIncomingCall} style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]}>
                  <Text style={styles.declineLabel}>Decline</Text>
                </Pressable>
                <Pressable onPress={openIncomingCall} style={({ pressed }) => [styles.answerButton, pressed && styles.pressed]}>
                  <Text style={styles.answerLabel}>Answer</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  webviewShell: {
    flex: 1,
    backgroundColor: "#000000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    padding: 24,
  },
  loadingTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
  },
  sessionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
    marginRight: 8,
  },
  sessionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
    marginRight: 8,
  },
  sessionStatus: {
    fontSize: 10,
    color: "#71717a",
    flex: 1,
  },
  errorCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#09090b",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#18181b",
    alignItems: "center",
  },
  errorEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7c3aed",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  retryLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  incomingCallCard: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: "#09090b",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7c3aed44",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  incomingCallGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#7c3aed",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  incomingEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7c3aed",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 20,
  },
  incomingAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#18181b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#7c3aed",
  },
  incomingAvatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  incomingName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  incomingHint: {
    fontSize: 13,
    color: "#71717a",
    marginBottom: 24,
  },
  incomingActions: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#18181b",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  declineLabel: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
  answerButton: {
    flex: 2,
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  answerLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
