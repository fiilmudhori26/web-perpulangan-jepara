# Backend Integration Setup Guide

## ✅ Apa yang Sudah Dibuat

Backend integration sudah sepenuhnya diimplementasikan dengan struktur berikut:

### Core Components
- **ApiClient.kt** - Retrofit setup dengan OkHttp interceptors
- **ApiService.kt** - Semua endpoint definitions
- **RemoteDataSource.kt** - API calls wrapper
- **AuthInterceptor.kt** - Automatic token management
- **NetworkResult.kt** - Type-safe result handling

### Data Management
- **AppRepository.kt** - Updated dengan remote integration
- **EntityMappers.kt** - Conversion utilities antara API models dan local entities
- **BackendConfig.kt** - Configuration management

### UI & State Management
- **BackendSyncViewModel.kt** - Example ViewModel untuk sync operations
- **UiState.kt** - UI state wrapper
- **SyncManager.kt** - Orchestrate sync operations
- **NetworkConnectivityManager.kt** - Network connectivity checks

### Utilities
- **RetryUtils.kt** - Retry logic dengan exponential backoff
- **BACKEND_INTEGRATION.md** - API documentation

## 🚀 Quick Start

### 1. Update Backend URL
Edit di `BackendConfig.kt` atau runtime:

```kotlin
BackendConfig.updateBackendUrl(context, "https://your-api-domain.com/api/v1/")
```

### 2. Login & Token Management
```kotlin
// Login akan otomatis menyimpan token
val success = repository.loginAdmin(email, password)

// Token otomatis ditambahkan ke setiap request
// Intercept 401 dan refresh token otomatis
```

### 3. Sync Data dari Backend
```kotlin
val syncManager = SyncManager(context, repository)

// Full sync
syncManager.syncAllData()

// Atau sync per entity
syncManager.syncPeriods()
syncManager.syncStudents()
```

### 4. Handle Online/Offline
```kotlin
val connectivityManager = NetworkConnectivityManager(context)

connectivityManager.isOnline.collect { isOnline ->
    if (isOnline) {
        syncManager.syncAllData()
    } else {
        // Use local data
    }
}
```

## 📋 Implementasi Checklist

### Backend Setup
- [ ] Update `BACKEND_URL` di `BackendConfig.kt`
- [ ] Verify backend API tersedia dan respond
- [ ] Configure authentication (JWT, API key, etc)
- [ ] Update `.env` file dengan backend URL

### Android App Setup
- [ ] Add necessary permissions ke `AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  ```
- [ ] Verify Retrofit & OkHttp dependencies sudah tersedia
- [ ] Test network calls dari emulator/device

### Integration Points
- [ ] Update login screen untuk call `loginAdmin()` dari backend
- [ ] Add sync button di admin dashboard
- [ ] Integrate `NetworkConnectivityManager` untuk offline detection
- [ ] Add error handling UI untuk network errors
- [ ] Add loading indicators saat sync

### Testing
- [ ] Test login dengan valid credentials
- [ ] Test sync data dari backend
- [ ] Test offline mode (turn off network)
- [ ] Test token refresh on 401
- [ ] Test retry logic dengan network interruption

## 🔗 API Integration Points

### Login Screen
```kotlin
suspend fun loginFromBackend(email: String, password: String) {
    val result = repository.loginAdmin(email, password)
    if (result) {
        // Navigate to dashboard
    } else {
        // Show error
    }
}
```

### Admin Dashboard
```kotlin
// Add sync button
Button(onClick = {
    viewModelScope.launch {
        val result = syncManager.syncAllData()
        when (result) {
            is SyncResult.Success -> showToast(result.message)
            is SyncResult.Error -> showError(result.message)
            is SyncResult.PartialSuccess -> showWarning(result.message)
        }
    }
}) {
    Text("Sync Data")
}
```

### Student List Screen
```kotlin
// Auto-sync saat screen load
LaunchedEffect(Unit) {
    syncManager.syncStudents()
}

// Show students dari local database (sudah disync)
repository.allStudents.collect { students ->
    // Display students
}
```

## 🛠️ Customization

### Custom Endpoints
Tambah ke `ApiService.kt`:
```kotlin
@GET("custom-endpoint")
suspend fun customCall(): Response<CustomResponse>
```

Tambah wrapper di `RemoteDataSource.kt`:
```kotlin
suspend fun customCall(): NetworkResult<CustomResponse> {
    return safeApiCall { apiService.customCall() }
}
```

### Custom Headers
Edit `AuthInterceptor.kt`:
```kotlin
val requestWithHeaders = originalRequest.newBuilder()
    .header("Authorization", "Bearer $token")
    .header("X-Custom-Header", "value")
    .build()
```

### Custom Retry Logic
```kotlin
val result = networkCallWithRetry(
    config = RetryConfig(maxRetries = 5, initialDelayMs = 200)
) {
    remoteDataSource.someCall()
}
```

## 📦 Dependencies Already Included

```gradle
implementation libs.retrofit                    // Retrofit
implementation libs.converter.moshi            // Moshi JSON
implementation libs.okhttp                     // OkHttp
implementation libs.logging.interceptor        // OkHttp Logging
implementation libs.kotlinx.coroutines.android // Coroutines
```

## ❓ Troubleshooting

### Network calls tidak bekerja
1. Verify backend URL benar
2. Check internet permission di manifest
3. Enable HTTP logging di `ApiClient.kt` (atur level ke BODY)
4. Test endpoint dengan Postman

### Token tidak disimpan
1. Verify `AuthInterceptor.saveAuthToken()` dipanggil
2. Check SharedPreferences key: `lp3ia_auth` / `auth_token`
3. Verify login response memiliki token field

### Sync data tidak update
1. Check if remote call successful
2. Verify mapper functions convert correctly
3. Check local database insert operations
4. Enable debug logging

## 📞 Next Steps

1. **Integrate dengan existing screens** - Update login & dashboard screens
2. **Add error handling UI** - Toast/Snackbar untuk network errors
3. **Add sync indicators** - Progress bars saat syncing
4. **Implement background sync** - WorkManager untuk periodic sync
5. **Add conflict resolution** - Handle local vs remote data conflicts
