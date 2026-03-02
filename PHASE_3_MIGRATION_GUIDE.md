# Phase 3: Image Storage Migration Guide

## Overview
This phase implements comprehensive image storage for diagnosis images and profile photos using Supabase Storage. Users will be able to capture, upload, store, and manage images with automatic optimization and caching.

## Phase 3 Objectives
- ✅ Implement Supabase Storage for image uploads
- ✅ Add image capture and upload functionality
- ✅ Implement image optimization and compression
- ✅ Add profile photo management
- ✅ Implement image caching and performance
- ✅ Add comprehensive testing for image operations

## Prerequisites
- ✅ Phase 2: Diagnosis History Migration (COMPLETE)
- ✅ Supabase project with Storage enabled
- ✅ Proper RLS policies for storage buckets
- ✅ Image processing libraries installed

## Phase 3 Breakdown

### 3.1 Supabase Storage Setup
**Priority:** Critical  
**Estimated Time:** 2 hours

#### Tasks:
- ✅ Create diagnosis-images bucket
- ✅ Create profile-photos bucket
- ✅ Set up RLS policies for image access
- ✅ Configure image transformations
- ✅ Set up CDN and caching

#### Storage Buckets:
```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diagnosis-images', 'diagnosis-images', false);
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- RLS Policies
CREATE POLICY "Users can upload their own diagnosis images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'diagnosis-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own diagnosis images" ON storage.objects
FOR SELECT USING (bucket_id = 'diagnosis-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own diagnosis images" ON storage.objects
FOR DELETE USING (bucket_id = 'diagnosis-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photo" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3.2 Image Service Implementation
**Priority:** Critical  
**Estimated Time:** 4 hours

#### Tasks:
- ✅ Create image service module
- ✅ Implement image upload functionality
- ✅ Add image compression and optimization
- ✅ Implement image deletion
- ✅ Add image URL generation
- ✅ Implement image metadata management

#### Files to Create:
- `services/imageService.ts` - Core image operations
- `services/imageCompression.ts` - Image optimization
- `services/imageCache.ts` - Image caching logic
- `types/image.ts` - Image-related types

#### Image Service API:
```typescript
interface ImageService {
  uploadDiagnosisImage: (uri: string, diagnosisId: string) => Promise<string>;
  uploadProfilePhoto: (uri: string) => Promise<string>;
  deleteImage: (path: string) => Promise<void>;
  getImageUrl: (path: string) => Promise<string>;
  compressImage: (uri: string, options?: CompressionOptions) => Promise<string>;
  getImageMetadata: (path: string) => Promise<ImageMetadata>;
}

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}
```

### 3.3 Camera & Image Picker Integration
**Priority:** High  
**Estimated Time:** 3 hours

#### Tasks:
- ✅ Enhance camera component for diagnosis
- ✅ Add image picker integration
- ✅ Implement image preview functionality
- ✅ Add image editing capabilities
- ✅ Implement image validation

#### Components to Update:
- `components/camera/CameraComponent.tsx`
- `components/diagnosis/ImageUpload.tsx` (NEW)
- `components/diagnosis/ImagePreview.tsx` (NEW)
- `components/diagnosis/ImageEditor.tsx` (NEW)

#### Features:
- **Camera Capture:** Take photos for diagnosis
- **Gallery Selection:** Choose existing images
- **Image Preview:** Review before upload
- **Basic Editing:** Crop, rotate, adjust
- **Validation:** Size, format, quality checks

### 3.4 Diagnosis Flow Integration
**Priority:** High  
**Estimated Time:** 3 hours

#### Tasks:
- ✅ Update diagnosis creation flow
- ✅ Add image upload to diagnosis form
- ✅ Implement image storage in diagnosis records
- ✅ Add image display in diagnosis history
- ✅ Update real-time sync for images

#### Files to Update:
- `contexts/DiagnosisContext.tsx` - Add image operations
- `app/(tabs)/diagnosis.tsx` - Update diagnosis flow
- `app/(tabs)/history.tsx` - Display images in history
- `components/diagnosis/DiagnosisCard.tsx` - Show images

#### Diagnosis Type Enhancement:
```typescript
interface DiagnosisResult {
  // ... existing fields
  type: 'symptom' | 'image';
  imageUri?: string;          // Local URI before upload
  imageUrl?: string;          // Supabase Storage URL after upload
  imagePath?: string;         // Storage path
  imageMetadata?: ImageMetadata;
}
```

### 3.5 Profile Photo Management
**Priority:** Medium  
**Estimated Time:** 2 hours

#### Tasks:
- ✅ Create profile photo upload component
- ✅ Add photo display components
- ✅ Update profile screen with photo upload
- ✅ Implement photo editing functionality
- ✅ Add photo caching and optimizationality
- ✅ Implement fallback to initials

#### Components to Create:
- `components/profile/PhotoUpload.tsx` (NEW)
- `components/profile/PhotoDisplay.tsx` (NEW)

#### Files to Update:
- `app/(tabs)/profile.tsx` - Profile photo management
- `components/common/Header.tsx` - Show profile photo
- `contexts/AuthContext.tsx` - Add profile photo state

### 3.6 Image Caching & Performance
**Priority:** Medium  
**Estimated Time:** 2 hours

#### Tasks:
- ✅ Implement image caching service
- ✅ Create cached image component
- ✅ Add lazy loading for images
- ✅ Optimize image loading performance
- ✅ Add cache management and cleanuplivery

#### Caching Strategy:
- **Local Cache:** Store downloaded images locally
- **Memory Cache:** Keep recent images in memory
- **Cache TTL:** Automatic cache expiration
- **Cache Size:** Limit cache storage usage
- **Background Refresh:** Update cached images

### 3.7 Error Handling & Validation
**Priority:** High  
**Estimated Time:** 2 hours

#### Tasks:
- ✅ Create image validation utilities
- ✅ Add comprehensive error handling
- ✅ Implement error boundaries for images
- ✅ Add user-friendly error messages
- ✅ Create retry mechanismsdation (size, format)
- ✅ Handle storage quota limits
- ✅ Add user-friendly error messages

#### Error Scenarios:
- **Upload Failures:** Network issues, storage errors
- **Large Files:** Size limits, compression failures
- **Invalid Formats:** Unsupported file types
- **Storage Limits:** Quota exceeded
- **Permission Errors:** Access denied

### 3.8 Testing & Validation
**Priority:** High  
**Estimated Time:** 3 hours

#### Tasks:
- ✅ Create unit tests for image service
- ✅ Create tests for validation utilities
- ✅ Create component tests
- ✅ Add integration test script
- ✅ Set up test configuration
- ✅ Test caching and performance
- ✅ Test error handling scenarios

#### Test Files to Create:
- `services/__tests__/imageService.test.ts`
- `components/__tests__/ImageUpload.test.tsx`
- `__tests__/integration/image-upload-integration.test.tsx`
- `__tests__/performance/image-performance.test.ts`

## Implementation Order

### Phase 3.1: Storage Setup (Day 1)
1. Set up Supabase Storage buckets
2. Configure RLS policies
3. Test bucket access and permissions

### Phase 3.2: Core Service (Day 1-2)
1. Create image service module
2. Implement basic upload/delete
3. Add image compression

### Phase 3.3: UI Components (Day 2-3)
1. Update camera component
2. Create image upload components
3. Add preview and editing

### Phase 3.4: Integration (Day 3-4)
1. Update diagnosis flow
2. Add image display in history
3. Update real-time sync

### Phase 3.5: Profile Photos (Day 4)
1. Add profile photo upload
2. Update header display
3. Implement photo management

### Phase 3.6: Performance (Day 4-5)
1. Implement caching
2. Add lazy loading
3. Optimize delivery

### Phase 3.7: Testing (Day 5)
1. Write comprehensive tests
2. Performance validation
3. Error handling validation

## Technical Requirements

### Dependencies to Install:
```bash
npm install expo-image-manipulator
npm install expo-file-system
npm install @react-native-async-storage/async-storage
```

### Image Specifications:
- **Max File Size:** 5MB (before compression)
- **Target Quality:** 80% (JPEG)
- **Max Dimensions:** 1920x1080
- **Supported Formats:** JPEG, PNG, WebP
- **Compression Ratio:** ~70% reduction

### Performance Targets:
- **Upload Time:** <3 seconds for 2MB image
- **Compression Time:** <1 second
- **Cache Hit Time:** <100ms
- **Preview Load Time:** <500ms

## Troubleshooting

### Issue: Image upload fails
**Solution:** Check bucket permissions, verify RLS policies, check network connectivity

### Issue: Images not displaying
**Solution:** Verify URL generation, check CDN configuration, validate cache

### Issue: Compression too slow
**Solution:** Adjust quality settings, implement background processing

### Issue: Storage quota exceeded
**Solution:** Implement cleanup, add storage monitoring, optimize compression

### Issue: Real-time sync not working for images
**Solution:** Update diagnosis schema, check image URL handling, verify subscription

## Success Criteria

### Functional Requirements:
- ✅ Users can capture/upload diagnosis images
- ✅ Images are automatically compressed and optimized
- ✅ Profile photos can be uploaded and managed
- ✅ Images display correctly in diagnosis history
- ✅ Real-time sync works with images

### Performance Requirements:
- ✅ Image uploads complete within 3 seconds
- ✅ Image compression completes within 1 second
- ✅ Cached images load within 100ms
- ✅ App remains responsive during operations

### Quality Requirements:
- ✅ Images maintain acceptable quality after compression
- ✅ No memory leaks during image operations
- ✅ Graceful handling of network failures
- ✅ Proper cleanup of temporary files

## Next Steps

After Phase 3 completion:
- **Phase 4:** Advanced Features (notifications, sharing)
- **Phase 5:** Performance Optimization (caching, CDN)
- **Phase 6:** Production Deployment (monitoring, analytics)

---

**Phase 3: Image Storage - Estimated Total Time: 5 days**
**Start Date:** Current
**Target Completion:** 5 days from start
