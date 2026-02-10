# Backend Cleanup Guide

Setelah migrasi dari Laravel ke Next.js API Routes berhasil, file dan folder berikut di direktori `backend/` **sudah tidak digunakan lagi** dan dapat dihapus.

## File yang Dapat Dihapus

### 1. Controllers
```
backend/app/Http/Controllers/Api/TrackController.php
```
**Alasan**: Logic sudah dipindahkan ke `frontend/src/app/api/music/youtube/route.ts`

### 2. Services
```
backend/app/Services/YouTubeService.php
```
**Alasan**: YouTube search logic sudah diimplementasikan langsung di API Route Next.js

### 3. Models
```
backend/app/Models/TrackMapping.php
```
**Alasan**: Database sudah pindah ke Supabase, tidak lagi menggunakan Eloquent ORM

### 4. Migrations
```
backend/database/migrations/*_create_track_mappings_table.php
```
**Alasan**: Schema sudah dibuat di Supabase menggunakan `supabase-schema.sql`

### 5. Routes (Opsional)
Jika file `backend/routes/api.php` hanya berisi route untuk TrackController, file ini juga bisa dihapus.

## Opsi: Hapus Seluruh Folder Backend

Jika **tidak ada logic lain** yang masih digunakan di folder `backend/`, Anda dapat menghapus seluruh folder:

```bash
# PERINGATAN: Pastikan tidak ada logic penting yang masih digunakan!
rm -rf backend/
```

### Sebelum Menghapus, Verifikasi:
1. ✅ Aplikasi Next.js berjalan dengan baik tanpa Laravel backend
2. ✅ Semua fitur pencarian dan playback musik berfungsi normal
3. ✅ Data cache tersimpan di Supabase (cek Table Editor)
4. ✅ Tidak ada dependency ke Laravel backend di kode frontend

## File yang Tetap Dipertahankan

Jika Anda ingin menyimpan referensi atau dokumentasi, pertahankan:
- `backend/README.md` (jika ada)
- `backend/.env.example` (sebagai referensi konfigurasi lama)

## Langkah Aman

Jika ragu, **jangan langsung hapus**. Lakukan ini:

1. **Rename folder** terlebih dahulu:
   ```bash
   mv backend backend_deprecated
   ```

2. **Test aplikasi** selama beberapa hari

3. **Hapus permanent** setelah yakin tidak ada masalah:
   ```bash
   rm -rf backend_deprecated
   ```

## Update .gitignore

Jika Anda menghapus folder `backend/`, update `.gitignore` di root project untuk menghapus referensi ke Laravel:

```gitignore
# Hapus baris-baris ini jika ada:
/backend/vendor/
/backend/node_modules/
/backend/.env
```

## Checklist Sebelum Cleanup

- [ ] Aplikasi Next.js berjalan tanpa error
- [ ] Semua environment variables sudah dipindahkan ke `frontend/.env.local`
- [ ] Data penting sudah dimigrasikan ke Supabase (jika ada)
- [ ] Backup database MySQL lama (jika diperlukan)
- [ ] Update dokumentasi project (README.md)
- [ ] Commit perubahan ke Git sebelum menghapus file
