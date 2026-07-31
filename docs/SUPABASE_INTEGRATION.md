# Supabase Integration - Quick Start

## 🎯 What You Have

Supabase integration sudah 100% siap! Semua files sudah create dengan full error handling.

## 📦 Files Created

```
data/remote/supabase/
├── SupabaseConfig.kt           # Configuration management
├── SupabaseClient.kt           # Retrofit client setup
├── SupabaseService.kt          # REST API endpoints + models
├── SupabaseDataSource.kt       # API wrapper with error handling
└── mappers/
    └── SupabaseMappers.kt      # Entity conversion (Supabase ↔ Local)
```

## ⚡ 5-Minute Setup

### Step 1: Get Supabase Credentials
1. Go to https://app.supabase.com
2. Select project kamu
3. Go to Settings → API
4. Copy `PROJECT_URL` dan `ANON_KEY`

### Step 2: Update .env
```
SUPABASE_PROJECT_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Initialize di MainActivity
```kotlin
private fun setupBackend() {
    SupabaseConfig.setup(this)
}
```

**Done!** 🎉

## 🔄 How to Use

### Login
```kotlin
val dataSource = SupabaseDataSource(context)
val result = dataSource.loginAdmin("admin@email.com", "password")

when (result) {
    is NetworkResult.Success -> {
        val token = result.data.accessToken
        // Token auto-handled by AuthInterceptor
    }
    is NetworkResult.Error -> {
        Log.e("Login", result.message)
    }
}
```

### Fetch Data
```kotlin
val students = dataSource.getStudents()
when (students) {
    is NetworkResult.Success -> {
        // Convert to local entities
        val entities = students.data.map { it.toEntity() }
        // Save to local DB
        entities.forEach { studentDao.insertStudent(it) }
    }
    is NetworkResult.Error -> {
        // Show error or use local data
    }
}
```

### Create Data
```kotlin
val newStudent = SupabaseStudent(
    name = "Ahmad Rizki",
    room = "A-101",
    guardianName = "Bapak Rizki",
    guardianPhone = "081234567890"
)

val result = dataSource.createStudent(newStudent)
```

### Update Data
```kotlin
val updates = mapOf(
    "room" to "A-102",
    "notes" to "Moved to new room"
)
val result = dataSource.updateStudent(studentId, updates)
```

## 🗺️ REST API Endpoints

Supabase auto-generates REST endpoints dari tables. Format:

```
GET    /rest/v1/{table}
POST   /rest/v1/{table}
PATCH  /rest/v1/{table}?id=eq.{id}
DELETE /rest/v1/{table}?id=eq.{id}
```

### Available Tables
- `periods` - Periode kepulangan
- `students` - Data santri
- `payments` - Pembayaran
- `homecomings` - Rencana pulang
- `incomes` - Pemasukan
- `expenses` - Pengeluaran

## 🔐 Authentication Flow

```
Login Request
    ↓
SupabaseDataSource.loginAdmin()
    ↓
Supabase returns JWT token
    ↓
AuthInterceptor saves token
    ↓
Every subsequent request auto-adds:
  Header: Authorization: Bearer {token}
  Header: apikey: {ANON_KEY}
```

## 🔄 Data Sync Flow

```
UI → Repository → SupabaseDataSource → Supabase
                ↓
            Local DB (Cache)
                ↓
UI (displays from local DB)
```

**Offline?** App uses cached data dari Room database.

## 📋 Database Schema

Supabase tables sudah prepared dengan schema di `SUPABASE_SETUP.md`.

Minimal tables:
- `periods` (id, name, start_date, return_deadline_date, fee_amount, is_active)
- `students` (id, name, room, guardian_name, guardian_phone)
- `payments` (id, student_id, period_id, amount, date, method)
- `homecomings` (id, student_id, period_id, plan, departure_date)
- `incomes` (id, period_id, date, category, amount)
- `expenses` (id, period_id, date, category, amount)

## ✅ Integration Checklist

- [ ] Get Supabase project URL & anon key
- [ ] Update .env file
- [ ] Create database tables di Supabase
- [ ] Call `SupabaseConfig.setup(this)` di MainActivity
- [ ] Test login: `SupabaseDataSource(context).loginAdmin(...)`
- [ ] Test getStudents: `SupabaseDataSource(context).getStudents()`
- [ ] Integrate dengan AppRepository
- [ ] Update sync screens

## 🚀 Next Steps

1. **Setup Supabase** → Follow SUPABASE_SETUP.md
2. **Create Tables** → Run SQL schemas
3. **Test Connection** → Run simple login test
4. **Integrate** → Update AppRepository to use SupabaseDataSource
5. **Sync Data** → Update SyncManager to use Supabase
6. **Deploy** → Build & test on device

## 📚 Documentation

| File | Purpose |
|------|---------|
| SUPABASE_SETUP.md | Complete setup guide |
| SUPABASE_INTEGRATION.md | This file - quick reference |

## 🔗 Related

- Existing Retrofit integration: `data/remote/RemoteDataSource.kt`
- Local database: `data/AppDatabase.kt`
- Sync manager: `data/sync/SyncManager.kt`
- Repository: `data/AppRepository.kt`

## 💡 Tips

**Q: Pakai Supabase SDK atau Retrofit?**
A: Retrofit (existing setup) lebih sederhana. Supabase SDK untuk real-time subscriptions.

**Q: Bagaimana offline?**
A: Data cached di Room database. Sync saat online kembali.

**Q: Token refresh?**
A: AuthInterceptor auto-handle. No extra code needed.

**Q: Add endpoint baru?**
A: Create table di Supabase → Endpoint auto-generated.
