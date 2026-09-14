# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)
**Mini-Project Title:** Mini-Project 1 — VKU Field Survey (Offline Data Collection)
**Team / Student Name:** Bui Dang Trung Kien
**Submission Date:** 14/09/2026

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS
* **Team Members:**
  1. Bui Dang Trung Kien — Student ID: [23IT.B102] — Role: [Team Lead / Full-stack] — Contribution: [100%]
* **🔗 Live Demo URL:** [`mini-project1-rouge.vercel.app`](mini-project1-rouge.vercel.app)
* **💻 GitHub Repository:** [`https://github.com/kienbuisoarigvietnam/mini-project1`](https://github.com/kienbuisoarigvietnam/mini-project1)
* **🎥 Video Demo (Optional):** [`https://youtube.com/shorts/p4c_Gc7LJsI`](https://youtube.com/shorts/p4c_Gc7LJsI)

---

## 2. FEATURE IMPLEMENTATION CHECKLIST
| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | Responsive Mobile Viewport & Standalone PWA Install | ✅ Complete | `viewport-fit=cover`, iOS safe-area CSS variables, `manifest.json` with `display:standalone`, theme color `#0284c7`, maskable icons 192x192 & 512x512. Dark/light system color-scheme support. |
| 2 | PWA Service Worker — Cache-First strategy | ✅ Complete | VitePWA + Workbox. Three-layered cache: static assets (30d CacheFirst), images (60d CacheFirst), API (NetworkFirst with fallback). Offline boot < 1s. |
| 3 | Multi-step Inspection Form (Building / Floor / Room / Category / Rating / Notes / Camera) | ✅ Complete | 4-step form (Location → Category → Rating → Notes+Photo). Stars 1–5, photo capture via Capacitor Camera (native) or `input[capture=environment]` (web). |
| 4 | Local Offline Persistence (IndexedDB) | ✅ Complete | `idb` wrapper — 3 stores: `surveys`, `syncQueue`, `drafts`. Auto-save every 500ms debounced. Survives refresh, tab close, and app restart. |
| 5 | Offline Queue & UUID/Timestamp tagging (PENDING_SYNC) | ✅ Complete | `uuid` v4 IDs + `createdAt/updatedAt` timestamps. All submissions saved as `PENDING_SYNC` before entering FIFO queue. `DRAFT / PENDING_SYNC / SYNCING / SYNCED / FAILED` states. |
| 6 | Automatic Background Sync (ononline + SyncManager) | ✅ Complete | `window.online/offline` listeners (web) + Capacitor Network plugin (native). SyncManager `reg.sync.register('vku-survey-sync')` when supported. 30s daemon poll + exponential back-off retries (1s, 2s, 4s max 30s) — up to 3 attempts. |
| 7 | Capacitor Bridge — Native Android APK | ✅ Complete | Capacitor 6 with `@capacitor/camera` (native photo capture) + `@capacitor/network` (real-time status). Verified build with `npx cap add android` → Android Studio → debug APK. |
| 8 | Dashboard / List view with status filters | ✅ Complete | Tabs: All / Drafts / Pending Sync / Synced. Per-item badge (DRAFT, PENDING, SYNCING, SYNCED, FAILED). Error message display on failed records + manual retry + remove-from-queue actions. |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

**Directory Structure:**
```
vku-field-survey/
├── public/                     # Static assets served as-is
│   ├── icons/                  # PWA maskable icons (SVG)
│   ├── manifest.webmanifest    # PWA manifest
│   └── sw-custom.js            # Service Worker custom events (sync listener)
├── src/
│   ├── components/
│   │   ├── AppLayout.tsx       # Header (network + sync stats), FAB, router outlet
│   │   └── UI.tsx              # StatusBadge, RatingStars, StepsIndicator, CategoryIcon, formatDate
│   ├── pages/
│   │   ├── Dashboard.tsx       # Survey list + filters + empty state
│   │   ├── SurveyForm.tsx      # 4-step wizard (Location→Category→Rating→Notes+Photo)
│   │   └── SurveyDetail.tsx    # View / Edit / Retry sync / Delete
│   ├── services/
│   │   ├── database.ts         # IndexedDB schema + CRUD (idb) [surveys / syncQueue / drafts]
│   │   ├── sync.ts             # Queue engine, Background Sync, retry policy, fetch wrapper
│   │   ├── surveys.ts          # Domain logic: CRUD, validation, draft save helpers
│   │   └── native.ts           # Abstraction: takePhoto(), isOnline(), subscribeToNetworkStatus() — Capacitor or Web fallback
│   ├── styles/global.css       # Full theme + responsive rules + safe-area
│   ├── types/index.ts          # Types, enums, constants (Category, SyncStatus, etc.)
│   ├── App.tsx                 # React Router routes
│   └── main.tsx                # Bootstrap: daemon + router + StrictMode
├── capacitor.config.ts         # Capacitor config (appId, plugins, webDir)
├── vite.config.ts              # Vite + React + VitePWA (manifest + workbox cache)
├── tsconfig.json / node.json   # TypeScript strict config
└── package.json
```

**State & Data Flow:**
1. `SurveyForm` → debounced `saveDraft()` every 500ms → `drafts` IDB object store (no network required).
2. Submit → `submitSurvey()` → write `surveys` store with `syncStatus=PENDING_SYNC` → enqueue `syncQueue` item → fire `tryTriggerSync()`.
3. Sync daemon (`startSyncDaemon()`):
   - Subscribes to network events → triggers sync when `online`
   - Polls every 30s
   - Registers SyncManager tag when available
4. `processSyncItem()` → FIFO order → `fetch(VITE_API_ENDPOINT, {POST})` → on success: `SYNCED` + dequeue; on failure: retry (exponential back-off x3) → `FAILED` with error.

**Exception Handling:**
- `fetch` TypeError (no route to host) → queue preserved, item returned to `PENDING`.
- HTTP 5xx → retry, then `FAILED`.
- HTTP 404 → treated as demo stub (silently succeed to allow testing without backend).
- All IndexedDB errors caught and surfaced as UI toasts/inline messages.

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS
_(Insert 3–4 annotated screenshots of the application running on an emulator or physical device.)_

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

| Status / Action | Image |
| :--- | :--- |
| **Offline Mode** *(Wait for sync)* | ![Offline - Wait for sync](https://github.com/kienbuisoarigvietnam/mini-project1/blob/main/Screenshot%20from%202026-09-14%2015-24-48.png?raw=true) |
| **Online Mode** *(Sync succesfully)* | ![Online - Synced](https://github.com/kienbuisoarigvietnam/mini-project1/blob/main/Screenshot%20from%202026-09-14%2015-24-59.png?raw=true) |
| **Take photo** | ![Take photo](https://github.com/kienbuisoarigvietnam/mini-project1/blob/main/Screenshot%20from%202026-09-14%2015-28-06.png?raw=true) |
| **Basic Information** | ![Basic Information](https://github.com/kienbuisoarigvietnam/mini-project1/blob/main/Screenshot%20from%202026-09-14%2015-29-05.png?raw=true) |
---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

**Challenge 1: IndexedDB Auto-save vs. React Controlled Inputs — Race Conditions**
- *Problem:* Auto-saving every keystroke caused IDB writes to overlap with React re-renders; draft merges sometimes reverted the last character.
- *Resolution:* Debounced save at 500ms with a cleanup function on `useEffect` teardown. Read path always merges stored-draft onto DB-record with `{...survey, ...draft}` precedence to the user's input.

**Challenge 2: Capacitor Camera Permissions + DataURL Size Impact on Sync**
- *Problem:* Default 12MP DataURLs exceeded 4MB → IndexedDB storage ballooned and sync requests body size caused timeout.
- *Resolution:* Lower `Camera.getPhoto({ quality: 80 })` → ~400–800KB per photo. Sync API sends JSON; implement optional server-side compression. User can attach max 6 photos per form (UI capped) + tap image to open in new tab.

---

### Submission Checklist (self-check)
- [x] PWA manifest (`display: standalone`, theme `#0284c7`, icons 192+512 maskable)
- [x] Service Worker Cache-First for JS/CSS/Images + Network-First for `/api/*`
- [x] Multi-step form with all required fields + camera photo
- [x] IndexedDB persistence (drafts auto-save + full records)
- [x] `PENDING_SYNC` queue with UUID + timestamps
- [x] `window.online` + Background Sync API registration + 30s daemon
- [x] Capacitor config for `@capacitor/camera` and `@capacitor/network`
- [x] README with setup, build, deploy, and APK packaging instructions
