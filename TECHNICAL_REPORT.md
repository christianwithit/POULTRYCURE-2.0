# PoultryCure 2.0 — Technical Report

**Generated:** May 14, 2026
**Prepared for:** Development Team
**Project:** PoultryCure — AI-Powered Poultry Disease Diagnosis App

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Structure](#2-architecture--structure)
3. [Dependencies](#3-dependencies)
4. [Technology Stack](#4-technology-stack)
5. [Code Quality & Standards](#5-code-quality--standards)
6. [Navigation & Routing](#6-navigation--routing)
7. [State Management](#7-state-management)
8. [API Integration & Networking](#8-api-integration--networking)
9. [Performance & Optimization](#9-performance--optimization)
10. [Testing](#10-testing)
11. [Build & Deployment](#11-build--deployment)
12. [Notable Issues & Recommendations](#12-notable-issues--recommendations)

---

## 1. Project Overview

### Purpose

PoultryCure is a mobile application designed to help poultry farmers and veterinarians diagnose diseases in poultry birds. It combines AI-powered image analysis and symptom-based diagnosis using Google's Gemini multimodal models, backed by a curated local disease database.

### Target Platforms

| Platform | Status                                                              |
| -------- | ------------------------------------------------------------------- |
| Android  | Primary target — adaptive icon, edge-to-edge, APK builds configured |
| iOS      | Supported — tablet support enabled                                  |
| Web      | Static output configured (`expo-router` web mode)                   |

### Key Features

- **Image Diagnosis** — Upload or capture a photo of a bird; Gemini Vision analyzes it for disease indicators
- **Symptom Diagnosis** — Text-based symptom input analyzed by Gemini with local fallback
- **Disease Glossary** — Searchable, filterable database of poultry diseases with detailed info, images, and offline caching
- **Diagnosis History** — Persistent history synced to Supabase with real-time updates across devices
- **Bookmarks** — Save disease entries for offline reference
- **User Profiles** — Authentication, profile photo upload, password management
- **Push Notifications** — Local notifications for diagnosis completion; push token registration for dev builds
- **Offline Support** — AsyncStorage caching for disease data and diagnosis history

### Current Version & Status

- **Version:** 1.0.0
- **Expo SDK:** ~54.0.34
- **React Native:** 0.81.5
- **React:** 19.1.0
- **Status:** Active development — core features functional, image upload pipeline recently stabilized

---

## 2. Architecture & Structure

### Folder Hierarchy

```
POULTRYCURE-2.0/
├── app/                        # Expo Router file-based routes
│   ├── (tabs)/                 # Bottom tab navigator screens
│   │   ├── index.tsx           # Home / dashboard
│   │   ├── glossary.tsx        # Disease glossary list
│   │   ├── history.tsx         # Diagnosis history
│   │   ├── profile.tsx         # User profile
│   │   └── _layout.tsx         # Tab navigator config
│   ├── auth/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── diagnosis/              # Diagnosis flow screens
│   │   ├── image-diagnosis.tsx
│   │   ├── symptom-input.tsx
│   │   ├── result.tsx
│   │   └── _layout.tsx
│   ├── glossary/[diseaseId].tsx # Dynamic disease detail route
│   ├── profile/                # Profile sub-screens
│   ├── settings/               # App settings
│   ├── _layout.tsx             # Root layout with providers
│   └── index.tsx               # Auth redirect entry point
├── components/                 # Reusable UI components
│   ├── glossary/               # Glossary-specific components
│   ├── diagnosis/              # Diagnosis-specific components
│   ├── images/                 # Image caching components
│   ├── profile/                # Profile photo components
│   └── ui/                     # Generic UI primitives
├── contexts/                   # React Context providers
│   ├── AuthContext.tsx
│   └── DiagnosisContext.tsx
├── services/                   # Business logic & API layer
├── lib/                        # Third-party client setup (Supabase)
├── data/                       # Static disease database
├── types/                      # TypeScript type definitions
├── constants/                  # Theme, colors, spacing
├── hooks/                      # Custom React hooks
├── utils/                      # Utility functions
├── supabase/                   # Supabase local dev config & migrations
├── __mocks__/                  # Jest manual mocks
└── __tests__/                  # Test suites
```

### Design Patterns

| Pattern                           | Where Used                                                                 |
| --------------------------------- | -------------------------------------------------------------------------- |
| **File-based routing**            | `app/` directory via Expo Router                                           |
| **Context API**                   | `AuthContext`, `DiagnosisContext` for global state                         |
| **Singleton services**            | `DiseaseService`, `NotificationService`, `authService`                     |
| **Repository pattern**            | `supabase-diagnoses.ts` abstracts all DB operations                        |
| **Optimistic UI updates**         | `DiagnosisContext.addDiagnosis` updates local state before server confirms |
| **Offline-first with sync queue** | Pending operations queued in AsyncStorage, synced when online              |
| **Error boundary**                | `ErrorBoundary` wraps the entire app tree                                  |
| **Guard component**               | `AuthGuard` handles route protection declaratively                         |
| **Exponential backoff**           | `RetryHandler` and `fetchWithRetry` for transient failures                 |
| **Model fallback chain**          | `fetchWithModelFallback` tries Gemini models in order on 503               |

### Architectural Approach

The app follows a **layered architecture**:

1. **Presentation layer** — `app/` screens + `components/`
2. **State layer** — React Context (`AuthContext`, `DiagnosisContext`)
3. **Service layer** — `services/` (API calls, storage, image handling)
4. **Data layer** — `lib/supabase.ts` + `services/supabase-*.ts` + `data/disease.ts`

There is no Redux or Zustand — state is managed entirely through React Context, which is appropriate for the current app scale.

---

## 3. Dependencies

### Core Runtime Dependencies

| Package                                     | Version  | Purpose                        | Notes                                |
| ------------------------------------------- | -------- | ------------------------------ | ------------------------------------ |
| `expo`                                      | ~54.0.34 | Expo SDK                       | Current stable                       |
| `react-native`                              | 0.81.5   | RN runtime                     | New Architecture enabled             |
| `react`                                     | ^19.1.0  | UI framework                   | Latest — some ecosystem libs may lag |
| `expo-router`                               | ~6.0.23  | File-based navigation          |                                      |
| `@supabase/supabase-js`                     | ^2.98.0  | Backend BaaS                   | Auth, DB, Storage, Realtime          |
| `@google/generative-ai`                     | ^0.24.1  | Gemini SDK                     | Used in `gemini-client.ts` only      |
| `expo-image-manipulator`                    | ~14.0.8  | Image resize/compress          | Used in upload pipeline              |
| `expo-image-picker`                         | ^17.0.10 | Camera/gallery access          |                                      |
| `expo-camera`                               | ~17.0.10 | Camera permissions             |                                      |
| `expo-file-system`                          | ~19.0.17 | File I/O                       | Using `/legacy` import path          |
| `expo-notifications`                        | ~0.32.17 | Push + local notifications     |                                      |
| `expo-secure-store`                         | ~15.0.8  | Secure credential storage      |                                      |
| `@react-native-async-storage/async-storage` | 2.2.0    | Persistent key-value store     |                                      |
| `@react-native-community/netinfo`           | ^11.4.1  | Network connectivity detection |                                      |
| `react-native-reanimated`                   | ~4.1.1   | Animations                     |                                      |
| `react-native-gesture-handler`              | ~2.28.0  | Gesture support                |                                      |
| `react-hook-form`                           | ^7.66.0  | Form state management          |                                      |
| `expo-crypto`                               | ~15.0.9  | UUID generation, crypto        |                                      |

### Potential Dependency Concerns

| Issue                                                 | Detail                                                                                                            | Risk                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **`expo-file-system` legacy import**                  | `expo-file-system/legacy` is used throughout — the non-legacy API has breaking changes                            | Medium — should migrate when stable         |
| **Dual Gemini clients**                               | Both `@google/generative-ai` SDK (`gemini-client.ts`) and raw REST fetch (`api.ts`) are used for the same purpose | Medium — redundant, increases bundle size   |
| **`services/auth.ts` vs `services/supabase-auth.ts`** | Two auth service implementations exist; `auth.ts` uses local AsyncStorage, `supabase-auth.ts` uses Supabase       | High — see Issues section                   |
| **`react-native-worklets`**                           | Listed as a dependency but no direct usage found in app code                                                      | Low — likely a transitive dep of reanimated |
| **`dotenv`**                                          | Listed as a runtime dependency but should be devDependency only                                                   | Low                                         |
| **`react 19.1.0`**                                    | Very new — some testing libraries and ecosystem packages may have compatibility issues                            | Low-Medium                                  |
| **`baseline-browser-mapping`**                        | Emits "data over two months old" warning at build time                                                            | Cosmetic only                               |

---

## 4. Technology Stack

### Runtime & Build

| Layer           | Technology                                     |
| --------------- | ---------------------------------------------- |
| Runtime         | React Native 0.81.5 (New Architecture enabled) |
| Framework       | Expo SDK 54                                    |
| Language        | TypeScript 5.9.2 (strict mode)                 |
| Bundler         | Metro (via Expo)                               |
| Build system    | EAS Build (Expo Application Services)          |
| Package manager | npm                                            |

### Navigation

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Router           | Expo Router 6 (file-based, wraps React Navigation) |
| Tab navigation   | `@react-navigation/bottom-tabs` 7.4.0              |
| Stack navigation | Expo Router `Stack`                                |

### State Management

| Concern           | Solution                                                     |
| ----------------- | ------------------------------------------------------------ |
| Auth state        | `AuthContext` (React Context)                                |
| Diagnosis history | `DiagnosisContext` (React Context + AsyncStorage + Supabase) |
| Form state        | `react-hook-form`                                            |
| Server state      | Direct Supabase calls (no React Query / SWR)                 |

### Backend & Services

| Service            | Provider                                                          |
| ------------------ | ----------------------------------------------------------------- |
| Authentication     | Supabase Auth                                                     |
| Database           | Supabase PostgreSQL                                               |
| File storage       | Supabase Storage                                                  |
| Real-time sync     | Supabase Realtime (postgres_changes)                              |
| AI diagnosis       | Google Gemini API (gemini-2.5-flash primary, with fallback chain) |
| Push notifications | Expo Notifications (local) + device token registration            |

### Testing

| Layer             | Technology                           |
| ----------------- | ------------------------------------ |
| Test runner       | Jest 29.7                            |
| Component testing | `@testing-library/react-native` 13.3 |
| DOM testing       | `jest-environment-jsdom`             |
| Mocking           | Manual mocks in `__mocks__/`         |
| Coverage          | Istanbul (via Jest)                  |

### UI

| Concern       | Approach                                                    |
| ------------- | ----------------------------------------------------------- |
| Styling       | React Native `StyleSheet` (no CSS-in-JS library)            |
| Design tokens | `constants/theme.ts` (colors, spacing, typography, shadows) |
| Icons         | `@expo/vector-icons` (Ionicons, MaterialIcons)              |
| Animations    | `react-native-reanimated` + `Animated` API                  |
| Safe area     | `react-native-safe-area-context`                            |

---

## 5. Code Quality & Standards

### TypeScript

- **Strict mode enabled** in `tsconfig.json` (`"strict": true`)
- Path alias configured: `@/*` maps to project root
- Types are well-defined in `types/types.ts` and `types/image.ts`
- `any` is used in several places (e.g. `diseaseInfo: any` in `generateRecommendations`, Supabase payload handlers) — these should be typed properly

### Linting

- ESLint 9.25 with `eslint-config-expo` flat config
- Configuration is minimal (`eslint.config.js`) — only ignores `dist/*`
- No custom rules beyond the Expo preset
- No Prettier configuration found — formatting consistency relies on editor settings

### Code Patterns — Strengths

- Consistent use of `async/await` throughout
- Error boundaries at the app root level
- Retry logic with exponential backoff in both the API layer and context
- Services follow single-responsibility principle
- Theme constants centralized in `constants/theme.ts` — no magic numbers in components
- `AuthGuard` cleanly separates route protection from screen logic

### Code Patterns — Weaknesses

- **Verbose console logging in production** — `console.log` calls are present throughout services and contexts without `__DEV__` guards. Only the Gemini response log is guarded. This leaks internal state info in production builds.
- **`any` type overuse** — Several service methods accept or return `any`, undermining TypeScript's value
- **Inline styles mixed with StyleSheet** — Some components use both patterns inconsistently
- **Large context files** — `DiagnosisContext.tsx` is ~500 lines and handles state, sync, real-time, image operations, and edge functions. Should be split.

---

## 6. Navigation & Routing

### Structure

```
/ (index.tsx)
  → /auth/login          (unauthenticated entry)
  → /auth/signup
  → /auth/forgot-password
  → /(tabs)              (authenticated main app)
      → /(tabs)/index    (Home)
      → /(tabs)/glossary
      → /(tabs)/history
      → /(tabs)/profile
  → /diagnosis/image-diagnosis
  → /diagnosis/symptom-input
  → /diagnosis/result
  → /glossary/[diseaseId]  (dynamic route)
  → /profile/edit
  → /profile/bookmarks
  → /profile/change-password
  → /profile/notification-settings
  → /profile/cache-settings
  → /profile/about
  → /profile/help
  → /profile/terms
  → /settings/index
  → /debug/edge-test      (development debug screen)
```

### Route Protection

`AuthGuard` component in `app/_layout.tsx` watches `useSegments()` and redirects:

- Unauthenticated users away from `(tabs)`, `profile`, `diagnosis`, `settings`
- Authenticated users away from `auth/*`

### Deep Linking

- URL scheme configured: `poultrycure://`
- Used for password reset redirect: `poultrycure://reset-password`
- Typed routes experiment enabled in `app.config.js`

### Observations

- The `/debug/edge-test` route is accessible in production builds — it should be conditionally excluded
- `gestureEnabled: false` on auth and tabs stacks prevents accidental back-navigation, which is correct

---

## 7. State Management

### AuthContext (`contexts/AuthContext.tsx`)

Manages: `user`, `isAuthenticated`, `isLoading`

- Initializes by calling `supabaseAuthService.getCurrentUser()` with retry
- Subscribes to `supabase.auth.onAuthStateChange` for session events
- Exposes: `login`, `signup`, `logout`, `refreshUser`
- Uses `RetryHandler.withRetry` for resilient session initialization

### DiagnosisContext (`contexts/DiagnosisContext.tsx`)

Manages: `history`, sync state, online/offline state, real-time subscription

**Data flow:**

1. On mount: loads from Supabase if online, falls back to AsyncStorage
2. `addDiagnosis`: optimistic local update → AsyncStorage → Supabase upsert
3. Failed Supabase operations go into a **pending queue** (AsyncStorage key `@poultrycure_pending_queue`)
4. Queue is processed when connectivity is restored
5. Real-time subscription via `supabase.channel()` keeps history in sync across devices

**Persistence keys:**

- `@poultrycure_history` — local history cache
- `@poultrycure_pending_queue` — offline operation queue
- `@poultrycure_last_sync` — last sync timestamp
- `lastDiagnosis` — most recent diagnosis for result screen fallback

### Disease Data

`DiseaseService` (singleton) loads from:

1. `cacheManager` enhanced cache (if available)
2. Legacy AsyncStorage cache
3. Static `data/disease.ts` as final fallback

Cache expiry and connectivity-aware loading is handled by `services/cacheManager.ts`.

---

## 8. API Integration & Networking

### Gemini AI Integration

Two parallel implementations exist — this is a notable inconsistency:

**`services/api.ts` — `DiagnosisAPI` class (active)**

- Uses raw `fetch` against the Gemini REST API
- Model fallback chain: `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.5-pro`
- Retry with exponential backoff for 5xx errors
- Image converted to base64 via `expo-image-manipulator` + `expo-file-system`
- Falls back to local `matchDisease()` on any API failure

**`services/gemini-client.ts` — `GeminiClient` class (unused in main flow)**

- Uses `@google/generative-ai` SDK
- More structured error handling with typed `GeminiAPIError`
- Supports `responseMimeType: "application/json"` for cleaner parsing
- Not wired into the diagnosis screens — dead code in the active flow

### Supabase Integration

- Client initialized in `lib/supabase.ts` with `AsyncStorage` session persistence
- Auth: `supabase.auth.signInWithPassword`, `signUp`, `signOut`
- Database: `diagnoses` table, `profiles` table
- Storage: `diagnosis-images` and `profile-photos` buckets
- Real-time: `postgres_changes` subscription per user

**Image upload pipeline (`services/imageService.ts`):**

1. Compress with `expo-image-manipulator` (max 1920×1080, 80% quality)
2. Read as base64 → decode to `ArrayBuffer`
3. Upload via `supabase.storage.from().upload()`
4. Generate 10-year signed URL (falls back to public URL)

### Error Handling

- `utils/errorHandling.ts` provides `ErrorHandler` and `RetryHandler`
- Errors are categorized: `VALIDATION`, `AUTHENTICATION`, `NETWORK`, `STORAGE`, `PERMISSION`, `UNKNOWN`
- User-facing messages are mapped from technical errors
- `RetryHandler.withRetry` supports configurable retries with exponential backoff

### Authentication Flow

```
User → supabaseAuthService.login()
     → supabase.auth.signInWithPassword()
     → fetch profile from `profiles` table
     → map to app User type
     → AuthContext sets user state
     → notificationService.initialize() (non-blocking)
```

---

## 9. Performance & Optimization

### Image Handling

- Images compressed before upload: max 1920×1080, 80% quality JPEG
- `convertImageToBase64` in `api.ts` resizes to max 1024px width before sending to Gemini
- `CachedImage` component in `components/images/CachedImage.tsx` for glossary images
- `ProgressiveImage` component for progressive loading in glossary
- `expo-image` package available but `Image` from `react-native` is used in most places

### Rendering Optimization

- `VirtualizedDiseaseList` component exists for the glossary list
- `usePerformanceOptimization` hook in `hooks/usePerformanceOptimization.ts`
- `utils/performanceMonitor.ts` and `utils/memoryMonitor.ts` for monitoring
- `utils/bundleOptimization.ts` for bundle analysis utilities
- Animations use `useNativeDriver: true` throughout

### Caching Strategy

- Disease data: multi-tier (enhanced cache manager → legacy AsyncStorage → static data)
- Diagnosis history: AsyncStorage with Supabase as source of truth
- Image cache: `services/imageCacheService.ts` and `services/imageCache.ts`
- Cache expiry and prioritization based on bookmarks and recently viewed diseases

### Bundle Considerations

- Both `@google/generative-ai` SDK and raw Gemini REST calls are bundled — the SDK adds ~200KB unnecessarily if only REST is used
- `react-native-worklets` is included but may not be directly used
- `dotenv` is a runtime dependency but only needed at build time

---

## 10. Testing

### Test Infrastructure

- **Runner:** Jest 29.7 with `jsdom` environment
- **Setup file:** `jest.setup.js`
- **Manual mocks:** `__mocks__/` covers all native modules (AsyncStorage, SecureStore, Crypto, FileSystem, Notifications, ImageManipulator, ReactNative, ReactNavigation)
- **Coverage collection:** `utils/**` and `services/**`
- **Separate image test config:** `jest.image.config.js` for image-specific tests

### Test Coverage Areas

| Area              | Location                                                 | Type        |
| ----------------- | -------------------------------------------------------- | ----------- |
| Auth flow         | `contexts/__tests__/AuthContext.test.ts`                 | Integration |
| Diagnosis context | `contexts/__tests__/DiagnosisContext.test.tsx`           | Integration |
| Disease card      | `components/glossary/__tests__/DiseaseCard.test.tsx`     | Unit        |
| Disease list      | `components/glossary/__tests__/DiseaseListView.test.tsx` | Unit        |
| Filter panel      | `components/glossary/__tests__/FilterPanel.test.tsx`     | Unit        |
| Image gallery     | `components/glossary/__tests__/ImageGallery.test.tsx`    | Unit        |
| Search interface  | `components/glossary/__tests__/SearchInterface.test.tsx` | Unit        |
| Cached image      | `components/images/__tests__/CachedImage.test.tsx`       | Unit        |
| Services          | `services/__tests__/`                                    | Unit        |
| Accessibility     | `__tests__/accessibility/`                               | Specialized |
| Navigation        | `__tests__/navigation/`                                  | Integration |
| Performance       | `__tests__/performance/`                                 | Specialized |

### Observations

- The `AuthContext.test.ts` tests mock `authService` and `storageManager` — they test the legacy local auth service, not the active Supabase auth service. These tests do not reflect the real authentication path.
- Glossary component tests are excluded from the default test run (`testPathIgnorePatterns`) — they likely have environment issues
- No end-to-end tests (Detox, Maestro) configured
- Coverage report exists in `coverage/` directory — services coverage appears partial

---

## 11. Build & Deployment

### EAS Build Configuration (`eas.json`)

| Profile       | Distribution | Notes                              |
| ------------- | ------------ | ---------------------------------- |
| `development` | Internal     | Dev client enabled                 |
| `preview`     | Internal     | APK output                         |
| `production`  | Internal     | APK output, auto-increment version |

**Critical Issue:** The Gemini API key is hardcoded in `eas.json` in both `development` and `production` profiles:

```json
"EXPO_PUBLIC_GEMINI_API_KEY": "AIzaSyCwAud8om_isV8yPW15DeS-_bOiudp-NzA"
```

This key is committed to the repository and exposed in the built app bundle. See Recommendations.

### Environment Variables

Required at build time:

- `EXPO_PUBLIC_GEMINI_API_KEY` — Gemini AI API key
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

The `lib/supabase.ts` and `services/gemini-client.ts` throw hard errors at startup if these are missing, which is good defensive practice.

### Supabase Local Development

- Full local Supabase stack configured via `supabase/config.toml`
- Migrations in `supabase/migrations/`
- Edge functions in `supabase/functions/` (referenced but disabled in app code)
- Database: PostgreSQL 17

### CI/CD

No CI/CD pipeline configuration found (no `.github/workflows/`, no `bitrise.yml`, no CircleCI config). Builds are triggered manually via EAS CLI.

### Web Build

- Static web output configured (`"output": "static"`)
- `test-build/` directory contains a previous web build artifact — should be gitignored

---

## 12. Notable Issues & Recommendations

### 🔴 Critical

**1. API Key Exposed in Repository**

- **File:** `eas.json`
- **Issue:** `EXPO_PUBLIC_GEMINI_API_KEY` is hardcoded with a real key value in the committed `eas.json`. `EXPO_PUBLIC_*` variables are embedded in the JS bundle and readable by anyone who downloads the app.
- **Fix:** Remove the key from `eas.json`. Use EAS Secrets: `eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value <key>`. Rotate the exposed key immediately.

**2. Dual Auth Service — Legacy Code Active in Tests**

- **Files:** `services/auth.ts` (legacy, local storage), `services/supabase-auth.ts` (active)
- **Issue:** `services/auth.ts` implements a full local auth system that is no longer used by the app (the app uses `supabase-auth.ts`). However, `AuthContext.test.ts` mocks and tests the legacy service. This means the test suite does not test the real authentication path.
- **Fix:** Delete `services/auth.ts` and `services/auth.legacy.ts`. Rewrite `AuthContext.test.ts` to mock `supabaseAuthService`.

### 🟠 High Priority

**3. Excessive Production Logging**

- **Issue:** `console.log` and `console.error` calls throughout services and contexts are not guarded by `__DEV__`. In production builds, these log internal state, API key prefixes, and user data to the device console.
- **Fix:** Wrap all non-critical logs in `if (__DEV__)` blocks. Replace production-critical error logging with a proper error reporting service (e.g., Sentry).

**4. Redundant Gemini Client**

- **Files:** `services/api.ts` (active), `services/gemini-client.ts` (unused in main flow)
- **Issue:** Two separate Gemini integration implementations exist. `gemini-client.ts` uses the `@google/generative-ai` SDK which adds bundle weight but is not used by the diagnosis screens.
- **Fix:** Either consolidate to use the SDK (better structured, supports `responseMimeType: "application/json"`) or remove the SDK and keep the REST approach. Remove the unused implementation.

**5. Debug Route Accessible in Production**

- **File:** `app/debug/edge-test.tsx`
- **Issue:** The debug screen is part of the route tree and accessible in production builds.
- **Fix:** Wrap the screen registration with `__DEV__` or remove it from the production build using EAS build profiles.

**6. `DiagnosisContext` Too Large**

- **File:** `contexts/DiagnosisContext.tsx` (~500 lines)
- **Issue:** The context handles state management, offline sync queue, real-time subscriptions, image operations, and edge function calls in a single file.
- **Fix:** Extract into: `useDiagnosisSync` hook (sync queue logic), `useDiagnosisRealtime` hook (Supabase subscription), and keep the context as a thin coordinator.

### 🟡 Medium Priority

**7. `expo-file-system/legacy` Import**

- **Files:** `services/api.ts`, `services/imageService.ts`
- **Issue:** The `/legacy` import path is a compatibility shim that may be removed in a future Expo SDK.
- **Fix:** Migrate to the new `expo-file-system` API when the breaking changes are understood and the team has capacity.

**8. No Server-Side Rate Limiting for Gemini**

- **Issue:** The Gemini API key is client-side. Any user can extract it and make unlimited API calls at the project's expense.
- **Fix:** Proxy Gemini calls through a Supabase Edge Function that validates the user's JWT before forwarding. The infrastructure for this already exists (`supabase/functions/`, `utils/edgeFunctionClient.ts`) but was disabled.

**9. Missing Pagination in Diagnosis History**

- **File:** `services/supabase-diagnoses.ts`
- **Issue:** `getDiagnoses` fetches up to 50 records. The history screen loads all of them into a `FlatList` at once. For users with large histories, this will degrade performance.
- **Fix:** Implement cursor-based pagination in `getDiagnoses` and use `FlatList`'s `onEndReached` for infinite scroll.

**10. `test-build/` Committed to Repository**

- **Issue:** The `test-build/` directory contains a full web build output committed to git, adding unnecessary repository bloat.
- **Fix:** Add `test-build/` to `.gitignore` and remove it from the repository history.

**11. No CI/CD Pipeline**

- **Issue:** There is no automated build, test, or deployment pipeline. All builds are triggered manually.
- **Fix:** Set up GitHub Actions with: lint check, Jest test run, and EAS build trigger on merge to main.

### 🟢 Low Priority / Improvements

**12. `any` Type Usage**

- Several service methods use `any` (e.g., `generateRecommendations(diseaseInfo: any)`, real-time payload handlers). Replace with proper types for better type safety.

**13. `dotenv` as Runtime Dependency**

- `dotenv` is listed under `dependencies` but is only needed at build time. Move to `devDependencies`.

**14. Supabase Type Definitions Incomplete**

- `lib/supabase.ts` defines a `Database` type but only includes the `profiles` table. The `diagnoses` and `device_tokens` tables are missing. Using the Supabase CLI to generate full types (`supabase gen types typescript`) would improve type safety across all DB operations.

**15. Form Validation Duplication**

- Email and password validation logic is duplicated across `services/auth.ts`, `services/supabase-auth.ts`, and `utils/formValidation.ts`. Consolidate to `utils/formValidation.ts`.

---

## Summary Scorecard

| Area             | Score   | Notes                                                       |
| ---------------- | ------- | ----------------------------------------------------------- |
| Architecture     | ✅ Good | Clean layering, appropriate patterns for scale              |
| TypeScript       | ✅ Good | Strict mode, well-typed — some `any` leakage                |
| Navigation       | ✅ Good | Expo Router well-configured, route protection solid         |
| State Management | ✅ Good | Context API appropriate, offline-first design               |
| API Integration  | ⚠️ Fair | Dual Gemini clients, key exposure, no server proxy          |
| Image Handling   | ✅ Good | Recently fixed, SDK-based upload, signed URLs               |
| Testing          | ⚠️ Fair | Good coverage infrastructure, but auth tests test dead code |
| Security         | 🔴 Poor | API key committed to repo — must be addressed immediately   |
| Build/Deploy     | ⚠️ Fair | EAS configured, no CI/CD, key in eas.json                   |
| Code Quality     | ⚠️ Fair | Verbose logging, large context file, dead code              |

---

_This report was generated by analyzing the full project source as of commit `551162d` (May 14, 2026)._
