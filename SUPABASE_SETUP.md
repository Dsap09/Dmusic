# Panduan Setup Supabase untuk Dmusic

## 1. Buat Project Supabase

1. Kunjungi [Supabase Dashboard](https://app.supabase.com)
2. Klik **"New Project"**
3. Isi informasi project:
   - **Name**: Dmusic
   - **Database Password**: (simpan password ini dengan aman)
   - **Region**: Pilih region terdekat (contoh: Southeast Asia)
4. Klik **"Create new project"** dan tunggu beberapa menit

## 2. Jalankan SQL Schema

1. Di Supabase Dashboard, buka **SQL Editor** (di sidebar kiri)
2. Klik **"New query"**
3. Copy dan paste isi file `supabase-schema.sql`
4. Klik **"Run"** atau tekan `Ctrl+Enter`
5. Verifikasi tabel berhasil dibuat dengan membuka **Table Editor** → `track_mappings`

## 3. Dapatkan Kredensial Supabase

1. Di Supabase Dashboard, buka **Settings** → **API**
2. Copy nilai berikut:
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon public** key (di bagian "Project API keys")

## 4. Update Environment Variables

Edit file `.env.local` di folder `frontend/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSy...
```

> **Note**: Jika belum punya YouTube API Key, ikuti panduan di bawah.

## 5. Setup YouTube Data API v3

1. Kunjungi [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih project yang sudah ada
3. Enable **YouTube Data API v3**:
   - Buka **APIs & Services** → **Library**
   - Cari "YouTube Data API v3"
   - Klik **"Enable"**
4. Buat API Key:
   - Buka **APIs & Services** → **Credentials**
   - Klik **"Create Credentials"** → **"API Key"**
   - Copy API Key yang dihasilkan
5. (Opsional) Restrict API Key:
   - Klik API Key yang baru dibuat
   - Di **API restrictions**, pilih "Restrict key"
   - Centang hanya **YouTube Data API v3**
   - Save

## 6. Verifikasi Setup

Jalankan aplikasi Next.js:

```bash
cd frontend
npm run dev
```

Buka browser dan test:
1. Cari lagu di aplikasi
2. Buka **Developer Tools** → **Network** tab
3. Verifikasi request menuju `/api/music/youtube` (bukan `localhost:8000`)
4. Cek **Supabase Table Editor** untuk melihat data yang tersimpan

## Troubleshooting

### Error: "Missing NEXT_PUBLIC_SUPABASE_URL"
- Pastikan `.env.local` sudah diisi dengan benar
- Restart development server (`npm run dev`)

### Error: "YouTube API error: 403"
- API Key tidak valid atau belum enable YouTube Data API v3
- Cek quota di Google Cloud Console

### Error: "Database error"
- Verifikasi tabel `track_mappings` sudah dibuat di Supabase
- Cek SQL Editor untuk error messages
