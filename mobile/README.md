# CineSwipe Android (Capacitor)

CineSwipe is a **full-stack Next.js app** (API routes + SQLite in `data/`). An Android build does **not** embed that server inside the APK. The usual pattern:

1. **Host** the web app somewhere reachable (your machine on LAN, a VPS, Fly.io, etc.).
2. **Wrap** that URL in a native shell (Capacitor) or ship a **PWA / Trusted Web Activity**.

This folder scaffolds option 2 with [Capacitor](https://capacitorjs.com/).

## Option A — Install as PWA (fastest)

You already have `public/manifest.webmanifest` and mobile viewport settings.

1. Deploy or run `npm run build && npm run start` over **HTTPS** (or localhost for testing).
2. Open the site in **Chrome on Android** → menu → **Install app** / **Add to Home screen**.

No Play Store, no Android Studio. Good for personal use.

## Option B — Capacitor WebView (this folder)

The APK loads your **hosted CineSwipe URL** in a full-screen WebView.

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Android Studio](https://developer.android.com/studio) (SDK, emulator or device)
- A running CineSwipe server the phone can reach

### 1. Host the backend

The phone must reach your Next server, for example:

| Where you run | URL for the app |
|---------------|-----------------|
| Emulator + `npm run dev` on same PC | `http://10.0.2.2:3000` |
| Physical device + dev on PC (same Wi‑Fi) | `http://<your-pc-lan-ip>:3000` |
| Production VPS / cloud | `https://your-domain.com` |

**Note:** SQLite lives in `data/app.db` on the **server**. Each hosted instance has its own library unless you add sync later.

Set the URL when syncing:

```bash
export CINESWIPE_SERVER_URL="https://your-domain.com"
# or for emulator:
# export CINESWIPE_SERVER_URL="http://10.0.2.2:3000"
```

For HTTP (dev only), `capacitor.config.ts` enables `cleartext` on Android.

### 2. Install and add Android

From the repo root:

```bash
cd mobile
npm install
npm run cap:sync
npm run cap:android
```

Android Studio opens the `android/` project. Run on a device or emulator.

### 3. App ID and name

Edit `mobile/capacitor.config.ts` (`appId`, `appName`) before your first store release.

## Option C — Play Store TWA (Bubblewrap)

If the site is on **HTTPS** with a valid manifest, [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) builds a Trusted Web Activity APK tied to your domain. Same server requirement as Capacitor.

## What we did *not* do (yet)

- **React Native / Expo rewrite** — large effort; duplicates all UI.
- **Offline-only APK** — would require replacing SQLite/API with on-device storage and a different architecture.
- **Bundling Next inside the APK** — Node + SQLite are not practical inside a WebView shell.

## API keys on Android

TMDB/OMDb keys stay on the **server** (env or Settings DB). The WebView never needs keys in the APK if users hit your hosted instance.

## Troubleshooting

- **White screen:** Wrong `CINESWIPE_SERVER_URL`, server not running, or device not on same network.
- **Mixed content:** Use HTTPS in production; HTTP only for dev with cleartext enabled.
- **Globe / WebGL:** Test on a real device; emulators vary in GPU support.
