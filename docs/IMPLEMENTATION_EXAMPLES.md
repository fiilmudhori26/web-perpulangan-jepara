# Backend Integration - Implementation Examples

## 1. Login Screen Integration

### Before (Local Auth Only)
```kotlin
// Old approach - hanya local auth
fun loginAdmin(email: String, pass: String): Boolean {
    val storedPass = prefs.getString("admin_password", "admin123") ?: "admin123"
    if (pass == storedPass) {
        prefs.edit().putBoolean("is_admin_logged_in", true).apply()
        return true
    }
    return false
}
```

### After (With Backend)
```kotlin
// Updated AdminLoginScreen.kt
suspend fun handleLogin(email: String, password: String) {
    viewModelScope.launch {
        _loginState.value = UiState.Loading
        
        try {
            // Try backend login first
            val success = repository.loginAdmin(email, password)
            
            if (success) {
                _loginState.value = UiState.Success("Login berhasil")
                // Navigate to dashboard
                navController.navigate(AppRoute.AdminDashboard.route)
            } else {
                _loginState.value = UiState.Error("Email atau password salah")
            }
        } catch (e: Exception) {
            _loginState.value = UiState.Error(e.message ?: "Login gagal")
        }
    }
}
```

## 2. Admin Dashboard - Sync Data

### Add Sync Button
```kotlin
@Composable
fun AdminDashboardScreen(
    viewModel: MainViewModel,
    syncManager: SyncManager
) {
    var isSyncing by remember { mutableStateOf(false) }
    var syncMessage by remember { mutableStateOf("") }

    Column {
        // Top bar dengan sync button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Admin Dashboard", style = MaterialTheme.typography.headlineSmall)
            
            Button(
                onClick = {
                    isSyncing = true
                    syncManager.syncAllData() { result ->
                        syncMessage = when (result) {
                            is SyncResult.Success -> result.message
                            is SyncResult.Error -> "Error: ${result.message}"
                            is SyncResult.PartialSuccess -> result.message
                        }
                        isSyncing = false
                    }
                },
                enabled = !isSyncing
            ) {
                if (isSyncing) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                }
                Text(if (isSyncing) "Syncing..." else "Sync Data")
            }
        }

        // Show sync status
        if (syncMessage.isNotEmpty()) {
            Text(
                syncMessage,
                modifier = Modifier.padding(16.dp),
                style = MaterialTheme.typography.bodySmall
            )
        }

        // Dashboard content
        // ... rest of content
    }
}
```

## 3. Student List - Auto Sync

### Update StudentListScreen
```kotlin
@Composable
fun StudentListScreen(
    viewModel: MainViewModel,
    syncManager: SyncManager,
    repository: AppRepository
) {
    var students by remember { mutableStateOf<List<StudentEntity>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    // Auto-sync saat screen load
    LaunchedEffect(Unit) {
        isLoading = true
        syncManager.syncStudents()
        isLoading = false
    }

    // Collect students dari local DB (sudah disync)
    LaunchedEffect(Unit) {
        repository.allStudents.collect { studentList ->
            students = studentList
        }
    }

    Column {
        if (isLoading) {
            CircularProgressIndicator()
        } else {
            LazyColumn {
                items(students) { student ->
                    StudentCard(student)
                }
            }
        }
    }
}
```

## 4. Payment Recording - With Backend

### Update recordPayment flow
```kotlin
suspend fun recordPaymentWithBackend(
    payment: PaymentEntity,
    studentName: String
) {
    viewModelScope.launch {
        _paymentState.value = UiState.Loading
        
        try {
            // Repository handle backend call internally
            repository.recordPayment(payment, studentName)
            
            _paymentState.value = UiState.Success("Pembayaran tercatat")
            // Auto-sync finance data
            syncManager.syncPayments()
            
        } catch (e: Exception) {
            _paymentState.value = UiState.Error(e.message ?: "Gagal catat pembayaran")
        }
    }
}
```

## 5. Finance Dashboard - With Network Check

### Conditional Sync Based on Network
```kotlin
@Composable
fun FinanceScreen(
    viewModel: MainViewModel,
    syncManager: SyncManager,
    connectivityManager: NetworkConnectivityManager
) {
    var isOnline by remember { mutableStateOf(true) }
    var financialData by remember { mutableStateOf<FinancialSummary?>(null) }

    // Monitor network connectivity
    LaunchedEffect(Unit) {
        connectivityManager.isOnline.collect { online ->
            isOnline = online
            if (online) {
                // Auto sync saat online
                syncManager.syncAllData()
            }
        }
    }

    Column {
        // Show connectivity status
        if (!isOnline) {
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    "Offline Mode - Showing cached data",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }

        // Display financial data from local DB
        financialData?.let { data ->
            FinancialSummaryCard(data)
        }
    }
}
```

## 6. Error Handling Pattern

```kotlin
// Reusable error handling
@Composable
fun ErrorDialog(
    message: String,
    onDismiss: () -> Unit,
    onRetry: (() -> Unit)? = null
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Error") },
        text = { Text(message) },
        confirmButton = {
            if (onRetry != null) {
                Button(onClick = onRetry) {
                    Text("Retry")
                }
            } else {
                Button(onClick = onDismiss) {
                    Text("OK")
                }
            }
        }
    )
}

// Usage
when (val state = uiState.value) {
    is UiState.Error -> {
        ErrorDialog(
            message = state.message,
            onDismiss = { /* clear error */ },
            onRetry = { /* retry operation */ }
        )
    }
    // ... other states
}
```

## 7. AndroidManifest.xml Updates

Tambah ke `app/src/main/AndroidManifest.xml`:

```xml
<!-- Network permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Optional: untuk better network detection -->
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

## 8. Build Integration

Update `build.gradle.kts` (sudah ada, tapi verify):

```gradle
dependencies {
    // Retrofit & networking (sudah ada)
    implementation(libs.retrofit)
    implementation(libs.converter.moshi)
    implementation(libs.okhttp)
    implementation(libs.logging.interceptor)
    
    // Coroutines (sudah ada)
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)
}
```

## Quick Reference

### Login with backend:
```kotlin
val success = repository.loginAdmin(email, password)
```

### Sync all data:
```kotlin
val result = syncManager.syncAllData()
```

### Record payment:
```kotlin
repository.recordPayment(payment, studentName)
```

### Search santri:
```kotlin
val info = repository.searchPublicSantri(name, phone)
```

### Check network:
```kotlin
val isOnline = connectivityManager.isNetworkAvailable()
```

### Handle result:
```kotlin
when (result) {
    is NetworkResult.Success -> { /* use result.data */ }
    is NetworkResult.Error -> { /* show result.message */ }
    is NetworkResult.Loading -> { /* show spinner */ }
}
```
