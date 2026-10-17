import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CINESWIPE_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.cineswipe.app",
  appName: "CineSwipe",
  webDir: "www",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        androidScheme: serverUrl.startsWith("https://") ? "https" : "http",
      }
    : undefined,
  android: {
    allowMixedContent: true,
  },
};

export default config;
