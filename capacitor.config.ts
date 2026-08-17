import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tanryugram",
  appName: "TanRyuGram",
  webDir: "dist/public",
  bundledWebRuntime: false,
  android: {
    backgroundColor: "#0f0b1a",
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
