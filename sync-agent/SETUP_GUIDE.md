# Panduan Setup Sync Agent — SAHARAMART

Sync Agent membaca data dari **iPOS 4** (PC kasir) dan mengirimnya ke **Supabase** (cloud).
Agent ini harus dijalankan di **PC kasir** yang terpasang iPOS.

---

## Langkah 1: Cek Info Database iPOS

Buka PC kasir, lalu cari info berikut:

### A. Nama Database
1. Buka **pgAdmin** (biasanya sudah terinstall bersama iPOS)
2. Di panel kiri, expand **Servers** → **PostgreSQL 8.4** → **Databases**
3. Catat nama database yang dipakai iPOS (biasanya `i4_xxx` atau nama toko)

**Alternatif:** Cek file konfigurasi iPOS, biasanya ada di folder instalasi iPOS 4.

### B. Kode Kantor
Buka pgAdmin → klik database iPOS → Tools → Query Tool, lalu jalankan:
```sql
SELECT kodekantor, namakantor FROM tbl_kantor;
```
Catat `kodekantor` untuk SAHARAMART.

### C. Username & Password PostgreSQL
- Default iPOS biasanya: username `admin` atau `postgres`
- Password: tanya ke teknisi iPOS atau cek konfigurasi iPOS

---

## Langkah 2: Install Python

1. Download Python 3.8+ dari https://www.python.org/downloads/
2. Saat install, **centang "Add Python to PATH"**
3. Restart PC setelah install

Cek instalasi:
```cmd
python --version
```

---

## Langkah 3: Setup Sync Agent

1. Copy folder `sync-agent` ke PC kasir (misal: `C:\sync-agent\`)
2. Buka Command Prompt, masuk ke folder:
   ```cmd
   cd C:\sync-agent
   ```
3. Jalankan installer:
   ```cmd
   install.bat
   ```

---

## Langkah 4: Edit File .env

Buka file `.env` dengan Notepad, isi nilai yang benar:

```env
IPOS_DB_NAME=nama_database_dari_langkah_1A
IPOS_DB_USER=username_dari_langkah_1C
IPOS_DB_PASS=password_dari_langkah_1C
```

Simpan file.

---

## Langkah 5: Update Data Toko di Supabase

Buka https://supabase.com/dashboard → pilih project → SQL Editor.
Jalankan query ini (ganti nilai sesuai info dari Langkah 1):

```sql
UPDATE stores
SET
  ipos_kodekantor = 'KODE_KANTOR_DARI_LANGKAH_1B',
  ipos_db_name = 'NAMA_DATABASE_DARI_LANGKAH_1A'
WHERE code = 'SM01';
```

---

## Langkah 6: Test Sync

Jalankan sync sekali untuk test:
```cmd
python sync_agent.py --type full
```

**Jika berhasil**, akan muncul:
```
✓ Store SM01: synced XXX records
Sync completed
```

**Jika error "Connection refused":**
- Pastikan PostgreSQL iPOS sedang running
- Cek port di `.env` (default 5432)
- Cek apakah PostgreSQL menerima koneksi TCP/IP

**Jika error "authentication failed":**
- Username atau password salah, cek lagi di `.env`

**Jika error "database does not exist":**
- Nama database salah, cek lagi di pgAdmin

---

## Langkah 7: Setup Auto-Start

Supaya sync agent otomatis jalan saat PC kasir dinyalakan:

```cmd
setup_autostart.bat
```

Ini akan membuat shortcut di folder Windows Startup.

---

## Cara Menjalankan Manual

| Perintah | Fungsi |
|----------|--------|
| `run_once.bat` | Sync sekali lalu selesai |
| `run_daemon.bat` | Sync terus-menerus (tiap 15 menit) |
| `python sync_agent.py --type products` | Sync produk saja |
| `python sync_agent.py --type stock` | Sync stok saja |
| `python sync_agent.py --type sales` | Sync penjualan saja |

---

## Monitoring

Setelah sync berjalan, bisa dipantau di web app:
- Buka **Sync Monitor** (menu Global → Sync Monitor)
- Lihat status sync terakhir, jumlah record, dan error

Log file tersimpan di: `sync_agent.log`
