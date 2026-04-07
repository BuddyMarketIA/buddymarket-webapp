import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // ── App Identity ────────────────────────────────────────────────────────────
  appId: "io.buddymarket.app",
  appName: "BuddyMarket",

  // ── Web source: point to the built dist ─────────────────────────────────────
  // In production, Capacitor loads the built web app from dist/public
  webDir: "dist/public",

  // ── Server: use live URL in dev, local in prod ──────────────────────────────
  server: {
    // Uncomment for live reload during development:
    // url: "https://buddymarketapp.com",
    // cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    hostname: "buddymarketapp.com",
    allowNavigation: ["buddymarketapp.com", "appbuddymarket.com", "*.manus.space"],
  },

  // ── iOS configuration ───────────────────────────────────────────────────────
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    preferredContentMode: "mobile",
    backgroundColor: "#FFF8F0",
    // Allow camera and photo library for profile pictures
    // These permissions are declared in Info.plist
  },

  // ── Android configuration ───────────────────────────────────────────────────
  android: {
    backgroundColor: "#FFF8F0",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true for dev builds
  },

  // ── Plugins ─────────────────────────────────────────────────────────────────
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FFF8F0",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#F97316",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "LIGHT",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#F97316",
      sound: "beep.wav",
    },
  },
};

export default config;
