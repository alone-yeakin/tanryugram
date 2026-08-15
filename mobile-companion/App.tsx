import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
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
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { callId?: number; route?: string };
      if (data?.route === "call" || data?.callId) {
        const payload = JSON.stringify(data);
        webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-call-open',{detail:${payload}})); true;`);
      }
    });
    return () => {
      mounted = false;
      void registration;
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
    if (navigation.loading) setHasError(false);
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

  const injectNativePushToken = useCallback(() => {
    const token = nativePushToken.current;
    if (!token) return;
    webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('tanryugram-native-push-token',{detail:{token:${JSON.stringify(token)}}})); true;`);
  }, []);

  const handleWebMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; callId?: number; callType?: "audio" | "video"; callerName?: string; ringtone?: RingtoneId };
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
          data: { route: "call", callId: message.callId, callType: message.callType || "audio", callerName: message.callerName || "A TanRyuGram member" },
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
          applicationNameForUserAgent="Tanryugram/1.0"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7fb",
  },
  webview: {
    flex: 1,
    backgroundColor: "#f8f7fb",
  },
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
