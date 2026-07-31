# Supabase Setup Guide - Santri LP3IA App

## 1️⃣ Get Supabase Credentials

### Step 1: Login ke Supabase Dashboard
- Go to https://app.supabase.com
- Login dengan akun kamu

### Step 2: Copy Project URL & Keys
1. Click project kamu
2. Go to **Settings → API**
3. Copy values berikut:

```
PROJECT_URL: https://xxxxx.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2️⃣ Update .env File

Edit `F:\Apk Perpulangan\.env`:

```
# Supabase Configuration
SUPABASE_PROJECT_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3️⃣ Update MainActivity.kt

```kotlin
private fun setupBackend() {
    // Setup Supabase configuration
    SupabaseConfig.setup(this)
    
    // Optional: Update credentials if different
    val projectUrl = BuildConfig.SUPABASE_PROJECT_URL
    val anonKey = BuildConfig.SUPABASE_ANON_KEY
    
    if (projectUrl.isNotEmpty() && anonKey.isNotEmpty()) {
        SupabaseConfig.updateCredentials(this, projectUrl, anonKey)
    }
}
```

## 4️⃣ Test Connection

```kotlin
// Di MainActivity atau debug screen
val supabaseService = SupabaseClient.getSupabaseService(this)
val periods = supabaseService.getPeriods()
Log.d("Supabase", "Connected: $periods")
```

## 5️⃣ Supabase Database Schema

Pastikan di Supabase sudah ada tables berikut:

### periods
```sql
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  return_deadline_date DATE NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  room TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  emergency_contact TEXT,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  period_id UUID REFERENCES periods(id),
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  receipt_path TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### homecomings
```sql
CREATE TABLE homecomings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  period_id UUID REFERENCES periods(id),
  plan TEXT NOT NULL,
  departure_date DATE NOT NULL,
  mandatory_return_date DATE NOT NULL,
  actual_return_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### incomes
```sql
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID REFERENCES periods(id),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### expenses
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID REFERENCES periods(id),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

## 6️⃣ Enable Row Level Security (Recommended)

Di Supabase SQL Editor, run:

```sql
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homecomings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

## 7️⃣ Create RLS Policies

Untuk anon (public access):

```sql
CREATE POLICY "Enable read access for all users" ON periods
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON students
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON payments
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON homecomings
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON incomes
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON expenses
FOR SELECT USING (true);
```

## ✅ Quick Checklist

- [ ] Get Supabase project URL & anon key
- [ ] Update .env file
- [ ] Update MainActivity.kt
- [ ] Create database tables
- [ ] Enable RLS policies
- [ ] Test connection dengan SupabaseClient
- [ ] Verify data sync dari Supabase

## 🔑 Environment Variables

Build.gradle.kts (if using BuildConfig):

```gradle
buildFeatures {
    buildConfig = true
}

buildTypes {
    debug {
        buildConfigField "String", "SUPABASE_PROJECT_URL", "\"https://xxxxx.supabase.co\""
        buildConfigField "String", "SUPABASE_ANON_KEY", "\"eyJhbGc...\""
    }
    release {
        buildConfigField "String", "SUPABASE_PROJECT_URL", "\"https://xxxxx.supabase.co\""
        buildConfigField "String", "SUPABASE_ANON_KEY", "\"eyJhbGc...\""
    }
}
```
