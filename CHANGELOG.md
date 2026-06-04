# PoultryCure 2.0 — Changelog

## Image Diagnosis Fix Session — May 13, 2026

### Problems Reported

- Image analysis was failing entirely after selecting an image
- After a successful analysis, the "Analyzed Image" placeholder on the result screen was blank
- History screen thumbnails for image-based diagnoses were blank

---

### Fix 1 — Missing imports in `services/api.ts`

**Problem:** The `convertImageToBase64` method inside `DiagnosisAPI` called `manipulateAsync`, `SaveFormat`, `FileSystem`, and `Image.getSize` without importing any of them. This caused a `ReferenceError` at runtime the moment image analysis was triggered.

**Fix:** Added the missing imports:

- `expo-file-system/legacy` — for `FileSystem.readAsStringAsync` and `FileSystem.deleteAsync`
- `expo-image-manipulator` — for `manipulateAsync` and `SaveFormat`

---

### Fix 2 — `Image.getSize` used outside a React component (`services/api.ts`)

**Problem:** `Image.getSize` from `react-native` is unreliable when called outside of a React component context (i.e. in a plain service/class). It threw a `ReferenceError: property 'Image' doesn't exist` at runtime on device.

**Fix:** Removed the `Image` import and the dimension-check logic entirely. Replaced with a direct `manipulateAsync` call that resizes to `width: 1024` unconditionally. `expo-image-manipulator` preserves aspect ratio automatically when only one dimension is specified, so portrait and landscape images are both handled correctly.

---

### Fix 3 — Broken image upload in `services/imageService.ts`

**Problem:** `uploadDiagnosisImage` was using a raw `fetch` call with `multipart/form-data` to upload to Supabase Storage. This approach is unreliable in React Native and was silently failing, meaning no image URL was ever stored.

Additionally, `getPublicUrl` was used to generate the image URL — this only works if the Supabase Storage bucket is set to **public**. For private buckets it generates a URL that returns 403.

**Fix:** Rewrote the upload function to:

1. Use the **Supabase JS SDK's `.upload()`** method with an `ArrayBuffer` decoded from base64 — the correct approach for React Native
2. Use **`createSignedUrl`** with a 10-year expiry as the primary URL strategy (works for both public and private buckets), with `getPublicUrl` as a fallback

---

### Fix 4 — Upload failure crashing the entire analysis flow (`app/diagnosis/image-diagnosis.tsx`)

**Problem:** The image upload was not wrapped in error handling. If the upload failed for any reason (network, bucket policy, etc.), it threw an exception that cancelled the whole analysis and showed "Analysis Failed" — even though the AI analysis itself had succeeded.

**Fix:** Wrapped the upload in a `try/catch`. If upload fails, the diagnosis is still saved using the local image URI so the result screen can display the image immediately. A warning is logged but the user flow continues uninterrupted.

---

### Fix 5 — `imageUrl` not populated when reading from Supabase (`services/supabase-diagnoses.ts`)

**Problem:** `mapFromSupabaseDiagnosis` (which converts Supabase database rows back into `DiagnosisResult` objects) only mapped `image_url` → `imageUri`. It never set `imageUrl`. The history screen checks `item.imageUrl` first, found it `undefined`, and fell through to show the placeholder icon instead of the image.

**Fix:** Updated `mapFromSupabaseDiagnosis` to set **both** `imageUri` and `imageUrl` from `image_url`, so all consumers work correctly regardless of which field they check.

---

### Fix 6 — Result screen only checking `imageUri` (`app/diagnosis/result.tsx`)

**Problem:** The "Analyzed Image" section on the result screen only rendered if `result.imageUri` was set. After a session restart or when loading from Supabase history, `imageUri` may hold a stale local path that is no longer accessible.

**Fix:** Updated the condition to check `result.imageUrl || result.imageUri`, preferring the persisted Supabase Storage URL over the local URI.

---

### Fix 7 — Duplicate history entry after Supabase upsert (`contexts/DiagnosisContext.tsx`)

**Problem:** In `addDiagnosis`, the diagnosis was optimistically added to local state first, then after the Supabase upsert returned the saved record, it was prepended again — causing a duplicate entry in the history list.

**Fix:** The upsert response now **replaces** the optimistically-added entry rather than prepending a second copy. The server response is preferred because it has `imageUrl` properly populated from the database.

---

### Files Changed

| File                                | Change                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `services/api.ts`                   | Added missing imports; removed `Image.getSize`; simplified resize logic |
| `services/imageService.ts`          | Rewrote `uploadDiagnosisImage` to use Supabase SDK + signed URLs        |
| `services/supabase-diagnoses.ts`    | `mapFromSupabaseDiagnosis` now sets both `imageUri` and `imageUrl`      |
| `app/diagnosis/image-diagnosis.tsx` | Upload is now non-blocking; fallback to local URI if upload fails       |
| `app/diagnosis/result.tsx`          | Image display checks `imageUrl` first, falls back to `imageUri`         |
| `contexts/DiagnosisContext.tsx`     | Fixed duplicate history entry after Supabase upsert                     |

---

### Commits

| Hash      | Message                                                         |
| --------- | --------------------------------------------------------------- |
| `c7189b2` | fix: image analysis and display in diagnosis result and history |
| `551162d` | chore: update app config and dependencies                       |
