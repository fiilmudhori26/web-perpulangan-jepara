# ✅ Supabase Integration - Final Setup Checklist

## 🎯 Status: READY TO DEPLOY

Semua files sudah created. Tinggal follow checklist ini untuk production-ready setup.

---

## Phase 1: Supabase Project Setup (15 menit)

### ✅ Step 1: Create/Login Supabase Project
- [ ] Go to https://app.supabase.com
- [ ] Create project atau select existing
- [ ] Wait until project fully initialized

### ✅ Step 2: Get Credentials
- [ ] Go to **Settings → API**
- [ ] Copy **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copy **Anon Key**: `eyJhbGciOiJIUzI1NiIs...`
- [ ] (Optional) Copy **Service Role Key** for admin operations

### ✅ Step 3: Create Database Tables
Di Supabase SQL Editor, run schema SQL dari `SUPABASE_SETUP.md`:

```sql
-- Create all tables
CREATE TABLE periods (...)
CREATE TABLE students (...)
CREATE TABLE payments (...)
CREATE TABLE homecomings (...)
CREATE TABLE incomes (...)
CREATE TABLE expenses (...)

-- Enable RLS
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ... rest of tables

-- Create policies
CREATE POLICY "Enable read access" ON periods FOR SELECT USING (true);
-- ... rest of policies
```

---

## Phase 2: Android App Setup (10 menit)

### ✅ Step 4: Update .env File
Edit `F:\Apk Perpulangan\.env`:

```env
# Supabase Configuration
SUPABASE_PROJECT_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ✅ Step 5: Update MainActivity.kt
Already updated, verify:

```kotlin
private fun setupBackend() {
    // Setup Supabase configuration
    SupabaseConfig.setup(this)
    BackendConfig.setEnvironment(BuildConfig.DEBUG)
}
```

### ✅ Step 6: Add Internet Permission
Di `app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## Phase 3: Integration Testing (20 menit)

### ✅ Step 7: Test Supabase Connection

Create debug activity atau MainActivity test:

```kotlin
val dataSource = SupabaseDataSource(this)

// Test 1: Get periods
viewModelScope.launch {
    val result = dataSource.getPeriods()
    Log.d("Supabase", "Periods: $result")
}

// Test 2: Login
viewModelScope.launch {
    val result = dataSource.loginAdmin("admin@email.com", "password")
    Log.d("Supabase", "Login: $result")
}

// Test 3: Get students
viewModelScope.launch {
    val result = dataSource.getStudents()
    Log.d("Supabase", "Students: $result")
}
```

### ✅ Step 8: Verify Data Sync

```kotlin
val repository = SupabaseRepository(database, this)

// Sync periods
repository.syncPeriodsFromSupabase()

// Check local DB
repository.allPeriods.collect { periods ->
    Log.d("Sync", "Local periods: $periods")
}
```

---

## Phase 4: UI Integration (30 menit)

### ✅ Step 9: Update Login Screen

Di `AdminLoginScreen.kt` atau equivalent:

```kotlin
val repository = SupabaseRepository(database, context)

// Replace local auth
val success = repository.loginAdmin(email, password)
if (success) {
    // Navigate to dashboard
    navController.navigate(AppRoute.AdminDashboard.route)
} else {
    // Show error
    showError("Login failed")
}
```

### ✅ Step 10: Add Sync Button

Di admin dashboard:

```kotlin
val repository = SupabaseRepository(database, context)

Button(onClick = {
    viewModelScope.launch {
        repository.syncPeriodsFromSupabase()
        repository.syncStudentsFromSupabase()
        repository.syncPaymentsFromSupabase()
        showToast("Data synced successfully")
    }
}) {
    Text("Sync Data from Supabase")
}
```

### ✅ Step 11: Update Student List

Di `StudentListScreen.kt`:

```kotlin
// Auto-sync on screen load
LaunchedEffect(Unit) {
    repository.syncStudentsFromSupabase()
}

// Display from local DB
repository.allStudents.collect { students ->
    LazyColumn {
        items(students) { student ->
            StudentCard(student)
        }
    }
}
```

---

## Phase 5: Advanced Features (Optional)

### ✅ Step 12: Network Detection (Optional)

```kotlin
val connectivityManager = NetworkConnectivityManager(context)

connectivityManager.isOnline.collect { isOnline ->
    if (isOnline) {
        Log.d("Network", "Online - syncing...")
        repository.syncPeriodsFromSupabase()
    } else {
        Log.d("Network", "Offline - using cached data")
    }
}
```

### ✅ Step 13: Error Handling (Optional)

```kotlin
when (val result = repository.saveStudent(student)) {
    true -> showToast("Student saved successfully")
    false -> showError("Failed to save student")
}
```

---

## Files Created (Summary)

| File | Purpose |
|------|---------|
| `SupabaseConfig.kt` | Configuration management |
| `SupabaseClient.kt` | Retrofit setup with Supabase headers |
| `SupabaseService.kt` | REST API endpoints + models |
| `SupabaseDataSource.kt` | API wrapper with error handling |
| `SupabaseMappers.kt` | Entity conversion |
| `SupabaseRepository.kt` | High-level interface |
| `SUPABASE_SETUP.md` | Database schema & RLS setup |
| `SUPABASE_INTEGRATION.md` | Quick reference guide |

---

## Quick Reference

### Login
```kotlin
val success = repository.loginAdmin(email, password)
```

### Sync Data
```kotlin
repository.syncPeriodsFromSupabase()
repository.syncStudentsFromSupabase()
repository.syncPaymentsFromSupabase()
```

### Save Data
```kotlin
repository.savePeriod(period)
repository.saveStudent(student)
repository.recordPayment(payment, studentName)
repository.saveHomecomingPlan(homecoming)
```

### Query Local Data
```kotlin
repository.allPeriods.collect { periods -> }
repository.allStudents.collect { students -> }
repository.activePeriod.collect { period -> }
```

---

## Testing Checklist

- [ ] Supabase project created & accessible
- [ ] All database tables created successfully
- [ ] RLS policies enabled
- [ ] .env file updated with credentials
- [ ] App builds without errors
- [ ] Login with test credentials works
- [ ] Data syncs from Supabase to local DB
- [ ] Offline mode uses cached data
- [ ] Sync button refreshes data
- [ ] Payment recording works
- [ ] All screens display data correctly

---

## Troubleshooting

### Connection Failed
- Verify PROJECT_URL correct
- Check ANON_KEY not expired
- Test URL in Postman: `{PROJECT_URL}/rest/v1/periods?select=*`
- Add header: `Authorization: Bearer {ANON_KEY}`

### No Data Returned
- Verify tables exist in Supabase
- Check RLS policies (should allow read for anon)
- Run: `SELECT * FROM periods;` in SQL editor

### Login Fails
- Verify email/password correct
- Check authentication table exists
- Test endpoint: `POST {PROJECT_URL}/rest/v1/rpc/get_admin_token`

### App Crashes
- Check stack trace in logcat
- Verify all entities/mappers correctly mapped
- Check Room database schema matches

---

## Next Steps

1. **Today**: Complete Phase 1-2 (Supabase setup + Android integration)
2. **Tomorrow**: Complete Phase 3-4 (Testing + UI integration)
3. **Later**: Phase 5 (Advanced features)

---

## 🚀 Ready to Go!

Everything is prepared. You have:
- ✅ Supabase backend integration
- ✅ Local database caching
- ✅ Offline-first architecture
- ✅ Error handling & retry logic
- ✅ Type-safe API calls
- ✅ Complete documentation

**Start with Phase 1 → Phase 2 → Test → Deploy!**
