# 📋 VKU Field Survey — Offline Data Collection (PWA + Capacitor)

> **Mini-Project 1 | Cross-Platform Mobile App Development (VKU)

Offline-first Progressive Web App (PWA) for **VKU campus facility inspectors and student auditors** to audit classroom equipment, projectors, AC units, and electrical systems **with zero network availability (basements / remote buildings)**. Data is persisted locally using **IndexedDB** and automatically synced to the server when connectivity is restored, with a native Android APK wrapper powered by **Capacitor Bridge**.

---

## ✨ Features

| # | Feature | Detail |
|---|---|---|
| 1 | 📱 **Responsive Mobile-first PWA | `viewport-fit=cover`, iOS safe-areas, Dark/Light mode, standalone installable |
| 2 | 🗂 **Multi-step Form Wizard** | 4 steps: Location → Category → 1–5 Star Rating → Notes + Camera Photo |
| 3 | 💾 **IndexedDB Persistence** | 3 stores (surveys, syncQueue, drafts) with debounced auto-save every 500ms |
| 4 | 🚫 **100% Offline Capable** | Service Worker **Cache-First** strategy → sub-second offline boot |
| 5 | 🔁 **Offline Sync Queue** | UUID + timestamp + `PENDING_SYNC` status; FIFO sequential dispatch |
| 6 | ⚡ **Background Sync** | `window.ononline` + SyncManager API + 30s daemon + 3× exponential back-off |
| 7 | 📷 **Native Camera (Capacitor)** | `@capacitor/camera` on Android, `input[capture=environment]` fallback for web |
| 8 | 📶 **Network Status** | `@capacitor/network` (native) + `navigator.onLine` (web) |
| 9 | 🤖 **Android APK Build** | Capacitor 6 + Gradle wrapper, debug/release signing ready |
| 10 | 🏷 **Dashboard & Filters** | Tabs (All / Drafts / Pending / Synced), badges & retry actions |

---

## 🧱 Tech Stack

| Layer | Library |
|---|---|
| Language | **TypeScript 5.4 (strict) |
| UI Framework | **React 18** (JSX runtime, hooks) |
| Router | **React Router v6** |
| Build Tool | **Vite 5** |
| PWA | **vite-plugin-pwa** (Workbox, manifest, auto-update) |
| Local DB | **IndexedDB** via `idb@8` wrapper |
| Native Bridge | **Capacitor 6** |
| Native Plugins | `@capacitor/camera`, `@capacitor/network` |
| UUID | `uuid@9` (uuid/v4) |

---

## 📦 Project Structure

```
vku-field-survey/
├── public/
│   ├── icons/
│   │   ├── icon-192x192.svg     # PWA icon (maskable, any)
│   │   └── icon-512x512.svg
│   ├── manifest.webmanifest     # PWA manifest (display: standalone, #0284c7)
│   ├── sw-custom.js            # SW custom: background sync + fetch handlers
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── AppLayout.tsx        # Header (network + sync status), FAB, outlet
│   │   └── UI.tsx              # Reusable: StatusBadge, RatingStars, StepsIndicator…
│   ├── pages/
│   │   ├── Dashboard.tsx       # Survey list + filter tabs
│   │   ├── SurveyForm.tsx    # 4-step wizard with debounced autosave
│   │   └── SurveyDetail.tsx  # View/Edit/Retry/Delete
│   ├── services/
│   │   ├── database.ts       # IndexedDB: surveys / syncQueue / drafts CRUD
│   │   ├── sync.ts         # Queue engine + retry policy + Background Sync
│   │   ├── surveys.ts      # Domain logic (submit / CRUD helpers
│   │   └── native.ts       # takePhoto() / isOnline() abstraction layer with Capacitor ↔ Web fallback
│   ├── styles/global.css      # Theme, responsive, skeleton shimmer
│   ├── types/index.ts         # Category, SyncStatus, SurveyRecord…
│   ├── App.tsx                # Routes
│   └── main.tsx               # Bootstrap + Sync daemon start
├── capacitor.config.ts
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | ≥ 18.17 | Vite 5 runtime |
| **npm** / **pnpm** / **yarn** | latest | Package manager |
| **Android Studio** (optional, for APK) | ≥ Hedgehog | Capacitor Android build |
| **Java JDK** (optional) | ≥ 17 | Gradle |
| **Android SDK** (optional) | 34 | Platform 34 |

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/vku-field-survey.git
cd vku-field-survey

# Install dependencies (choose one)
npm install
# or: pnpm install
# or: yarn install
```

### 2. Configure Environment (Optional)

```bash
# Copy the sample env file
cp .env.example .env
```

Then edit `.env`:
```env
# Your backend endpoint for syncing surveys (POST JSON payload)
# Leave unchanged to run in full demo mode (404 → treated as success for UI demo)
VITE_API_ENDPOINT=https://your-server.example.com/api/surveys
```

### 3. Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. For **mobile testing**, open the Network URL on your phone (same Wi‑Fi) — Vite prints it, e.g. `http://192.168.1.10:5173`.

> 💡 In dev mode, Service Worker is **disabled by default** (Vite serves ESM). To test the real PWA offline behaviour, run a **production build** locally (step 4).

### 4. Production Build (PWA)

```bash
# Type-check + build into ./dist/
npm run build

# Locally preview the built PWA (SW active, offline mode fully working)
npm run preview
```

Visit `http://localhost:4173` and:
- Open DevTools → **Application → Service Workers** → check "Offline".
- Refresh → the app still loads instantly 🎉 (Cache-First strategy).
- Fill & submit a form offline → IndexedDB `PENDING_SYNC` queue fills.
- Uncheck Offline → watch Background Sync fires ⏳ → status transitions to `SYNCED`.

---

## 🚢 5. Deploy (Live Demo)

### Option A: Vercel (Fastest)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel
```

Framework preset: **Vite** → accept defaults → your project → done.

### Option B: Cloudflare Pages (PWA + Custom Domain + HTTPS)

1. Push repo to GitHub / GitLab
2. Cloudflare Dashboard → Pages → **Create a project** → **Connect to Git**
3. Build configuration:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `18` or `20`
4. Environment variables: add `VITE_API_ENDPOINT` if needed
5. **Save and Deploy** → you'll get a URL like `https://vku-survey.pages.dev`

> ⚠ **HTTPS is mandatory for PWA install, Service Worker, and Camera API. Both Vercel & Cloudflare provide this automatically.

### Option C: Any static host (Netlify, GitHub Pages, S3…)
Just upload the `dist/` folder with correct MIME types (`manifest.webmanifest` → `application/manifest+json`).

---

## 🤖 Build Native Android APK (Capacitor)

### Step 1 — Build the web app first

```bash
npm run build
```

### Step 2 — Add Android platform

```bash
npx cap add android
```

This scaffolds `./android/` folder (Gradle wrapper, manifests, resources). First-run will:
- Read `capacitor.config.ts`
- Ask for Android package name → `vn.vku.fieldsurvey` (matches` in `capacitor.config.ts`)
- Copy Android SDK 34 + required build tools via SDK Manager when prompted

### Step 3 — Sync web assets + open in Android Studio

```bash
# Each time you change web code → sync:
npm run build
npx cap sync android

# Open Android Studio
npx cap open android
```

### Step 4 — Permissions

Capacitor auto-generates permissions. Verify `android/app/src/main/AndroidManifest.xml` includes:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

`@capacitor/camera` also adds a `FileProvider` in the manifest.

### Step 5 — Build debug APK

In Android Studio:
1. Wait for Gradle sync (bottom-right progress bar).
2. Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Locate APK: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Install on device via `adb install app-debug.apk` or email / copy.

```bash
# Or from CLI (no Android Studio UI):
cd android
./gradlew assembleDebug
# Output: ./app/build/outputs/apk/debug/app-debug.apk
```

### Step 6 — Release APK (signed for Google Play)

1. **Keystore** (once):
   ```bash
   keytool -genkey -v -keystore vku-release.keystore -alias vku -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/app/release.properties`
   ```properties
   storeFile=vku-release.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=vku
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. Build release:
   ```bash
   cd android
   ./gradlew assembleRelease
   # Signed APK: ./app/build/outputs/apk/release/app-release.apk
   ```

---

## 🔌 Server API Contract

To connect a **real backend**, set `VITE_API_ENDPOINT` to a HTTPS endpoint that accepts:

### `POST VITE_API_ENDPOINT`
**Content-Type: `application/json`

```json
{
  "id": "uuid-v4",
  "location": {
    "building": "A1 - Main Building",
    "floor": "3",
    "room": "305"
  },
  "category": "Projector",
  "rating": 2,
  "notes": "Projector lamp takes 3 minutes to warm up, color shifts to green.",
  "photos": [
    { "id": "uuid-photo-1", "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." }
  ],
  "createdAt": 1714000000000,
  "updatedAt": 1714000000500
}
```

Expected response:
- **2xx** → item marked `SYNCED` and dequeued.
- **4xx** → unrecoverable (mark `FAILED` after 3 retries).
- **5xx / network error** → retry with exponential back-off (1s, 2s, 4s, max 30s) up to 3 attempts.

---

## 🧪 Testing Offline Workflow (Demo Script)

1. Build and run `npm run preview`.
2. Open the app → create a new survey (+).
3. Fill **Location, Category, Rating, Notes + Photo**.
4. **Submit & Sync**.
5. DevTools → **Application → Service Workers →** check **Offline**.
6. Submit another survey (offline).
7. Go to Dashboard → the latest card shows **Chờ đồng bộ (PENDING_SYNC)**.
8. Open **IndexedDB → vku-field-survey-db → surveys** confirms the record with `syncStatus: "PENDING_SYNC"` and UUID.
9. Uncheck **Offline** and wait up to 5 seconds.
10. Status transitions automatically to **SYNCING → Đã đồng bộ (SYNCED)**.

---

## 🧩 Customization

| Task | File(s) |
|---|---|
| Change PWA colors / name / icons | `vite.config.ts` → `VitePWA.manifest`, `public/icons/*.svg` |
| Add building / floor presets | `src/types/index.ts` → `BUILDING_LIST`, `FLOOR_LIST` |
| Add a new Category | `src/types/index.ts` → `Category` enum + `CATEGORY_LIST` + `CategoryIcon()` in `UI.tsx` |
| Change sync retry policy | `src/services/sync.ts` → `Math.min(1000 * Math.pow(2, item.attempts), 30000)` and `item.attempts < 3` |
| Change DB schema version | `src/services/database.ts` → `DB_VERSION` (add `upgrade()` migrations) |
| Swap in Zustand / Redux / etc. | Replace `services/*.ts` layer; UI pages don't import IndexedDB directly |

---

## 📋 Available Scripts

```bash
npm run dev             # Vite dev server (no SW)

npm run build           # tsc type-check → vite build → ./dist
npm run preview         # Preview production build locally (SW active!)

# Capacitor shortcuts (defined in package.json):
npm run cap:sync                  # Sync web assets to ALL platforms
npm run cap:open:android          # Open Android Studio
npm run cap:build:android         # build → sync → open Android Studio (one command)
```

---

## 📝 License & Credits

- **VKU** — Viet–Korea University of Information and Communication Technology.
- Mini-project specification authored for the **Cross-Platform Mobile App Development** course.

---

## 🆘 Troubleshooting

| Issue | Fix |
|---|---|
| `npm install` fails behind proxy | `npm config set registry https://registry.npmmirror.com` then retry |
| Capacitor Android: "SDK not found" | Install Android Studio → SDK Manager → SDK 34 → set `ANDROID_HOME` env var |
| Camera not working in browser | Must serve over **HTTPS** (or `localhost`). `file://` protocol blocks `getUserMedia`. |
| App won't install "Add to Home Screen" | Check **Lighthouse PWA** / DevTools → Manifest: both icons 192+512 must load; start_url responds 200 offline; SW registered with fetch handler. |
| Sync fails silently | In DevTools → Application → **Background Sync** — click the record to force fire; check Network tab for the failing `/api/surveys` request. |
