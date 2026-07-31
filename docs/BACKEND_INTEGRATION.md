# Backend Integration Guide

## Overview
Aplikasi sudah terintegrasi dengan Retrofit untuk komunikasi dengan backend API. Data disimpan di Room database (offline-first) dan disync dengan backend.

## Setup Awal

### 1. Update Backend URL
Edit `BackendConfig.kt` atau update di Settings:

```kotlin
// Di MainActivity.kt
BackendConfig.updateBackendUrl(this, "https://your-api-domain.com/api/v1/")
```

### 2. Authentication
Token disimpan otomatis di SharedPreferences setelah login berhasil:
- Login endpoint: `POST /auth/login`
- Token disimpan dan otomatis ditambahkan ke setiap request via `AuthInterceptor`

## API Endpoints Structure

### Authentication
- `POST /auth/login` - Login admin
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token

### Periods
- `GET /periods` - Semua periode
- `GET /periods/{id}` - Detail periode
- `POST /periods` - Buat periode
- `PUT /periods/{id}` - Update periode
- `PUT /periods/{id}/active` - Set periode aktif
- `DELETE /periods/{id}` - Hapus periode

### Students
- `GET /students` - Semua santri
- `GET /students/search?q=query` - Cari santri
- `GET /students/{id}` - Detail santri
- `POST /students` - Buat santri
- `PUT /students/{id}` - Update santri
- `DELETE /students/{id}` - Archive santri

### Payments
- `GET /payments` - Semua pembayaran
- `GET /payments/student/{studentId}` - Pembayaran santri
- `POST /payments` - Catat pembayaran
- `DELETE /payments/{id}` - Archive pembayaran

### Homecomings
- `GET /homecomings` - Semua rencana pulang
- `GET /homecomings/student/{studentId}` - Rencana santri
- `POST /homecomings` - Buat rencana
- `PUT /homecomings/{id}` - Update rencana

### Finance
- `GET /finance/summary?periodId={id}` - Ringkasan keuangan
- `GET /incomes?periodId={id}` - Pemasukan
- `POST /incomes` - Buat pemasukan
- `GET /expenses?periodId={id}` - Pengeluaran
- `POST /expenses` - Buat pengeluaran

### Public Access
- `POST /public/santri/search` - Cari santri (publik)

## Sync Strategy

### Full Sync
```kotlin
val syncManager = SyncManager(context, repository)
val result = syncManager.syncAllData()
```

### Sync Specific Data
```kotlin
syncManager.syncPeriods()
syncManager.syncStudents()
```

## Error Handling

Semua remote calls mengembalikan `NetworkResult<T>`:
```kotlin
when (result) {
    is NetworkResult.Success -> {
        // Gunakan result.data
    }
    is NetworkResult.Error -> {
        // Fallback ke local data atau tampilkan error
        Log.e("Error", result.message)
    }
    is NetworkResult.Loading -> {
        // Show loading state
    }
}
```

## Offline Mode
Aplikasi akan fallback ke local database jika backend tidak tersedia. Data akan disync otomatis ketika koneksi kembali.

## Token Management
- Token tersimpan di SharedPreferences
- Interceptor otomatis tambahkan token ke header
- On 401 (Unauthorized), interceptor coba refresh token
- Jika refresh gagal, user di-logout

## Request/Response Models
Semua models untuk API ada di `com.example.data.remote.models.ApiModels.kt`

Contoh:
- `StudentRequest` / `StudentResponse`
- `PaymentRequest` / `PaymentResponse`
- `PeriodRequest` / `PeriodResponse`
