# Backend Integration - Implementation Checklist

## Phase 1: Configuration (Do First)

### 1.1 Backend URL Setup
- [ ] Identify backend API domain (e.g., `https://api.yourcompany.com`)
- [ ] Update `BackendConfig.BASE_URL` atau environment variable
- [ ] Verify backend API is accessible and responds
- [ ] Test with Postman/Insomnia

### 1.2 Android Manifest
- [ ] Add to `app/src/main/AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  ```
- [ ] Verify permissions are added

### 1.3 Dependencies Verification
- [ ] Verify Retrofit is in `gradle/libs.versions.toml`
- [ ] Verify OkHttp is included
- [ ] Verify Moshi converter is included
- [ ] Run `./gradlew build` to verify no dependency issues

## Phase 2: Authentication Integration (Critical)

### 2.1 Login Screen Updates
- [ ] Update `AdminLoginScreen.kt` atau equivalent login screen
- [ ] Replace local auth dengan `repository.loginAdmin(email, password)`
- [ ] Handle `UiState.Loading`, `UiState.Success`, `UiState.Error`
- [ ] Show error messages ke user
- [ ] Add loading indicator saat login

### 2.2 Token Management
- [ ] Verify token disimpan otomatis after successful login
- [ ] Check `AuthInterceptor` automatically adds token ke requests
- [ ] Test 401 response handling (token refresh)
- [ ] Verify logout clears token

### 2.3 Authentication Testing
- [ ] Test login dengan valid credentials
- [ ] Test login dengan invalid credentials
- [ ] Test token persistence across app restart
- [ ] Test logout dan re-login flow

## Phase 3: Data Sync Implementation

### 3.1 Sync Manager Setup
- [ ] Create `SyncManager` instance di MainActivity atau App class
- [ ] Pass to ViewModels yang butuh sync
- [ ] Create sync trigger (button, scheduled, automatic)

### 3.2 Add Sync Button ke Dashboard
- [ ] Add button di admin dashboard
- [ ] Implement `syncManager.syncAllData()` onclick
- [ ] Show loading state saat syncing
- [ ] Show success/error messages
- [ ] Handle `SyncResult` (Success, Error, PartialSuccess)

### 3.3 Auto-Sync on Screen Load
- [ ] Add `LaunchedEffect { syncManager.syncPeriods() }` ke PeriodScreen
- [ ] Add `LaunchedEffect { syncManager.syncStudents() }` ke StudentListScreen
- [ ] Add sync trigger ke setiap screen yang perlu data fresh

### 3.4 Data Display from Local DB
- [ ] Verify data ditampilkan dari `repository.allStudents` (Flow)
- [ ] Verify period data dari `repository.allPeriods`
- [ ] Check data updates saat sync completes
- [ ] Verify offline mode shows cached data

## Phase 4: Network & Error Handling

### 4.1 Network Connectivity Detection
- [ ] Create `NetworkConnectivityManager` instance
- [ ] Monitor `isOnline` Flow
- [ ] Show offline indicator UI
- [ ] Auto-sync saat koneksi kembali

### 4.2 Error Handling UI
- [ ] Add error message display (Toast/Snackbar)
- [ ] Implement retry logic untuk failed operations
- [ ] Show network-specific error messages
- [ ] Log errors untuk debugging

### 4.3 Offline Mode Testing
- [ ] Turn off network → app should show cached data
- [ ] Make changes offline → should be saved locally
- [ ] Turn on network → data should sync automatically
- [ ] Verify no data loss

## Phase 5: Payment & Transaction Integration

### 5.1 Payment Recording
- [ ] Update payment recording untuk use backend
- [ ] Test `repository.recordPayment(payment, studentName)`
- [ ] Verify payment synced ke backend
- [ ] Check income entry created automatically

### 5.2 Finance Data Sync
- [ ] Add sync untuk expenses dan incomes
- [ ] Verify financial summary updates after sync
- [ ] Test transaction list displays correctly
- [ ] Check calculation accuracy (totalIncome, totalExpense, balance)

## Phase 6: Advanced Features

### 6.1 Retry Logic (Optional)
- [ ] Test retry dengan network interruption
- [ ] Verify exponential backoff delays work
- [ ] Check max retries configuration
- [ ] Monitor retry attempts di logs

### 6.2 Custom Backend URL (Optional)
- [ ] Add settings screen option untuk change backend URL
- [ ] Implement `BackendConfig.updateBackendUrl(context, newUrl)`
- [ ] Persist selection di SharedPreferences
- [ ] Reset Retrofit instance setelah URL change

### 6.3 Token Refresh (Optional)
- [ ] Implement token refresh endpoint di backend
- [ ] Update `AuthInterceptor.refreshToken()`
- [ ] Test 401 handling dan refresh flow
- [ ] Verify user stays logged in dengan refreshed token

## Phase 7: Testing & Verification

### 7.1 Unit Tests
- [ ] Test `AuthInterceptor` adds token correctly
- [ ] Test `RetryUtils` retry logic
- [ ] Test entity mappers convert correctly
- [ ] Test `NetworkResult` handling

### 7.2 Integration Tests
- [ ] Test full login flow
- [ ] Test sync data workflow
- [ ] Test offline → online transition
- [ ] Test error scenarios

### 7.3 End-to-End Testing
- [ ] Test user login → dashboard → sync → view data
- [ ] Test payment recording → sync → finance update
- [ ] Test student search → add → sync → appears
- [ ] Test period creation → set active → sync → shows

### 7.4 Performance Testing
- [ ] Test sync speed dengan large datasets
- [ ] Monitor memory usage saat syncing
- [ ] Check for network request timeouts
- [ ] Verify no ANR (Application Not Responding)

## Phase 8: Deployment Preparation

### 8.1 Production Configuration
- [ ] Update `BACKEND_URL` untuk production domain
- [ ] Set `BACKEND_DEBUG = false`
- [ ] Disable HTTP logging di `ApiClient`
- [ ] Update ProGuard rules untuk Retrofit/Moshi

### 8.2 Security Review
- [ ] Verify token stored securely (SharedPreferences encrypted)
- [ ] Check no API credentials hardcoded
- [ ] Verify HTTPS used untuk API calls
- [ ] Check no sensitive data logged

### 8.3 Release Build Testing
- [ ] Build release APK
- [ ] Test login pada release build
- [ ] Test data sync pada release build
- [ ] Verify no errors dalam release mode

## Tracking

### Currently Completed
- ✅ ApiClient.kt - Retrofit setup
- ✅ ApiService.kt - All endpoints
- ✅ AuthInterceptor.kt - Token management
- ✅ RemoteDataSource.kt - API wrapper
- ✅ AppRepository.kt - Integration
- ✅ SyncManager.kt - Orchestration
- ✅ All utility classes
- ✅ Documentation & examples

### Still TODO
- [ ] Update login screen
- [ ] Add sync button to dashboard
- [ ] Integrate payment recording
- [ ] Add network connectivity detection UI
- [ ] Test all flows
- [ ] Deploy to production

## Quick Reference

### Files to Update
| File | Action |
|------|--------|
| AdminLoginScreen.kt | Use backend login |
| AdminDashboardScreen.kt | Add sync button |
| PaymentListScreen.kt | Use backend payment |
| MainActivity.kt | Already updated ✓ |
| AndroidManifest.xml | Add permissions |

### Key Classes
| Class | Purpose |
|-------|---------|
| `RemoteDataSource` | API calls |
| `AuthInterceptor` | Token management |
| `SyncManager` | Orchestrate sync |
| `NetworkConnectivityManager` | Network detection |
| `NetworkResult<T>` | Type-safe results |

### Important Methods
```kotlin
// Login
repository.loginAdmin(email, password) -> Boolean

// Sync
syncManager.syncAllData() -> SyncResult
syncManager.syncPeriods()
syncManager.syncStudents()

// Network
connectivityManager.isNetworkAvailable() -> Boolean

// Access local data (already synced)
repository.allStudents -> Flow<List<StudentEntity>>
repository.allPeriods -> Flow<List<PeriodEntity>>
```

## Time Estimates

| Phase | Estimated Time |
|-------|-----------------|
| Phase 1 (Config) | 30 min |
| Phase 2 (Auth) | 1-2 hours |
| Phase 3 (Sync) | 1-2 hours |
| Phase 4 (Network) | 1 hour |
| Phase 5 (Payment) | 1 hour |
| Phase 6-7 (Advanced + Testing) | 2-4 hours |
| Phase 8 (Deployment) | 1 hour |
| **Total** | **8-13 hours** |

## Support Resources

- **BACKEND_INTEGRATION.md** - API reference
- **SETUP_GUIDE.md** - Step-by-step guide
- **IMPLEMENTATION_EXAMPLES.md** - Code samples
- **PROJECT_SUMMARY.md** - Architecture overview
