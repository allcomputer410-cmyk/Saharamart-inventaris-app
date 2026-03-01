"""
test_koneksi.py
===============
Test koneksi ke iPOS PostgreSQL dan Supabase.
Jalankan script ini sebelum sync untuk memastikan semua terhubung.

Cara pakai:
  python test_koneksi.py
  atau double-click: 2_TEST_KONEKSI.bat
"""

import sys
import os

print()
print("=" * 60)
print("  TEST KONEKSI -- iPOS & Supabase")
print("=" * 60)

# ── [1] Cek library ───────────────────────────────────────────
print()
print("[1/4] Cek library Python...")

try:
    import psycopg2
    print("  OK  psycopg2 (koneksi PostgreSQL)")
except ImportError:
    print("  GAGAL  psycopg2 belum terinstall")
    print("         Jalankan dulu: 1_INSTALL.bat")
    input("\nTekan Enter untuk keluar...")
    sys.exit(1)

try:
    import requests
    print("  OK  requests (koneksi internet)")
except ImportError:
    print("  GAGAL  requests belum terinstall")
    print("         Jalankan dulu: 1_INSTALL.bat")
    input("\nTekan Enter untuk keluar...")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    print("  OK  python-dotenv (baca file .env)")
except ImportError:
    print("  GAGAL  python-dotenv belum terinstall")
    print("         Jalankan dulu: 1_INSTALL.bat")
    input("\nTekan Enter untuk keluar...")
    sys.exit(1)

# ── [2] Baca konfigurasi dari .env ────────────────────────────
print()
print("[2/4] Baca konfigurasi dari .env...")

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if not os.path.exists(env_path):
    print("  GAGAL  File .env tidak ditemukan!")
    print("         Jalankan dulu: 1_INSTALL.bat")
    input("\nTekan Enter untuk keluar...")
    sys.exit(1)

load_dotenv(env_path)

DB_HOST = os.getenv("IPOS_DB_HOST", "localhost")
DB_PORT = int(os.getenv("IPOS_DB_PORT", "5444"))
DB_NAME = os.getenv("IPOS_DB_NAME", "")
DB_USER = os.getenv("IPOS_DB_USER", "admin")
DB_PASS = os.getenv("IPOS_DB_PASS", "admin")
SB_URL  = os.getenv("SUPABASE_URL", "")
SB_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")

if not DB_NAME or DB_NAME == "i4_NAMATOKO":
    print("  GAGAL  IPOS_DB_NAME belum diisi di file .env!")
    print("         Buka file .env dan ganti 'i4_NAMATOKO' dengan")
    print("         nama database iPOS di PC ini.")
    print("         Contoh: i4_SAHARAMART")
    input("\nTekan Enter untuk keluar...")
    sys.exit(1)

print(f"  OK  Database : {DB_HOST}:{DB_PORT}/{DB_NAME}")
print(f"  OK  User     : {DB_USER}")
print(f"  OK  Supabase : {SB_URL[:40]}..." if len(SB_URL) > 40 else f"  OK  Supabase : {SB_URL}")

# ── [3] Koneksi ke iPOS ───────────────────────────────────────
print()
print("[3/4] Koneksi ke iPOS PostgreSQL...")
print(f"  Host   : {DB_HOST}:{DB_PORT}")
print(f"  Database : {DB_NAME}")
print(f"  User   : {DB_USER}")
print()

connected = False
working_user = DB_USER
working_pass = DB_PASS

# Coba dengan kredensial dari .env dulu
try:
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASS, connect_timeout=5,
    )
    conn.close()
    connected = True
except psycopg2.OperationalError as e:
    err_str = str(e).lower()
    if "does not exist" in err_str or "database" in err_str:
        print(f"  GAGAL  Database '{DB_NAME}' tidak ditemukan!")
        print()
        print("  Kemungkinan penyebab:")
        print("  1. Nama database salah di file .env")
        print("     Buka .env dan periksa IPOS_DB_NAME")
        print("  2. iPOS belum dijalankan / service PostgreSQL mati")
        print()
        print("  Coba cek nama database yang tersedia:")
        # Coba konek ke database 'postgres' untuk list semua db
        try:
            conn2 = psycopg2.connect(
                host=DB_HOST, port=DB_PORT, dbname="postgres",
                user=DB_USER, password=DB_PASS, connect_timeout=5,
            )
            cur2 = conn2.cursor()
            cur2.execute("SELECT datname FROM pg_database WHERE datname LIKE 'i4_%' ORDER BY datname")
            dbs = [row[0] for row in cur2.fetchall()]
            cur2.close()
            conn2.close()
            if dbs:
                print(f"  Database iPOS yang ditemukan di PC ini:")
                for db in dbs:
                    print(f"    - {db}")
                print()
                print(f"  Ganti IPOS_DB_NAME di .env dengan salah satu di atas.")
            else:
                print("  Tidak ada database iPOS (i4_*) yang ditemukan.")
                print("  Pastikan iPOS sudah terinstall dan pernah dijalankan.")
        except Exception:
            pass
        input("\nTekan Enter untuk keluar...")
        sys.exit(1)
    elif "password" in err_str or "authentication" in err_str:
        print(f"  GAGAL  Password salah untuk user '{DB_USER}'")
        print()
        print("  Coba cari password yang benar:")
        PASSWORDS_TO_TRY = ["admin", "postgres", "123456", "ipos", ""]
        for pwd in PASSWORDS_TO_TRY:
            if pwd == DB_PASS:
                continue
            try:
                conn = psycopg2.connect(
                    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
                    user=DB_USER, password=pwd, connect_timeout=3,
                )
                conn.close()
                connected = True
                working_pass = pwd
                print(f"  Password yang benar: '{pwd}'")
                print(f"  Update IPOS_DB_PASS di file .env menjadi: {pwd}")
                break
            except Exception:
                continue
        if not connected:
            print("  Tidak bisa menebak password.")
            print("  Tanyakan password ke teknisi iPOS atau lihat di pgAdmin.")
            input("\nTekan Enter untuk keluar...")
            sys.exit(1)
    else:
        print(f"  GAGAL  {e}")
        print()
        print("  Kemungkinan penyebab:")
        print("  - Service PostgreSQL iPOS tidak berjalan")
        print("  - Port yang salah (seharusnya 5444)")
        print()
        print("  Solusi:")
        print("  1. Pastikan aplikasi iPOS sedang terbuka")
        print("  2. Atau start service: Win+R -> services.msc")
        print("     Cari 'postgresql' -> Start")
        input("\nTekan Enter untuk keluar...")
        sys.exit(1)

print(f"  BERHASIL terhubung ke iPOS!")

# ── Cek tabel iPOS ────────────────────────────────────────────
print()
print("  Cek tabel-tabel iPOS yang diperlukan:")

conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
    user=working_user, password=working_pass, connect_timeout=5,
)
conn.set_client_encoding("UTF8")
cur = conn.cursor()

REQUIRED_TABLES = [
    ("tbl_item",     "Master produk"),
    ("tbl_itemstok", "Stok produk"),
    ("tbl_supel",    "Supplier"),
    ("tbl_kantor",   "Data kantor/toko"),
    ("tbl_ikhd",     "Header penjualan"),
    ("tbl_ikdt",     "Detail penjualan"),
    ("tbl_imhd",     "Header pembelian"),
    ("tbl_imdt",     "Detail pembelian"),
]

missing = []
for tbl, label in REQUIRED_TABLES:
    cur.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = %s)",
        (tbl,)
    )
    exists = cur.fetchone()[0]
    status = "OK " if exists else "!!!"
    print(f"    [{status}] {tbl:<18} - {label}")
    if not exists:
        missing.append(tbl)

# Info tambahan
cur.execute("SELECT COUNT(*) FROM tbl_item WHERE statushapus='0' OR statushapus IS NULL")
total_produk = cur.fetchone()[0]

cur.execute("SELECT kodekantor, namakantor FROM tbl_kantor ORDER BY kodekantor")
kantors = cur.fetchall()

cur.close()
conn.close()

print()
print(f"  Total produk aktif  : {total_produk:,} item")
print(f"  Kantor di iPOS      : {len(kantors)}")
for kode, nama in kantors:
    print(f"    - {kode}: {nama}")

if missing:
    print()
    print(f"  PERINGATAN: {len(missing)} tabel tidak ditemukan!")
    print("  Pastikan database iPOS yang dipilih sudah benar.")

# ── [4] Test Supabase ─────────────────────────────────────────
print()
print("[4/4] Cek koneksi Supabase (internet)...")

if not SB_URL or not SB_KEY or "NAMATOKO" in SB_KEY:
    print("  Lewati -- SUPABASE_SERVICE_KEY belum diisi di .env")
else:
    try:
        resp = requests.get(
            f"{SB_URL.rstrip('/')}/rest/v1/stores?select=count",
            headers={
                "apikey": SB_KEY,
                "Authorization": f"Bearer {SB_KEY}",
                "Prefer": "count=exact",
            },
            timeout=15,
        )
        if resp.status_code in (200, 206):
            print("  BERHASIL terhubung ke Supabase!")
            # Hitung toko aktif
            cr = resp.headers.get("Content-Range", "")
            try:
                total_toko = cr.split("/")[-1]
                print(f"  Toko di database   : {total_toko}")
            except Exception:
                pass
        else:
            print(f"  GAGAL -- HTTP {resp.status_code}")
            print(f"  Pesan: {resp.text[:200]}")
    except requests.exceptions.ConnectionError:
        print("  GAGAL -- Tidak ada koneksi internet")
        print("  Pastikan PC kasir terhubung ke internet saat sync.")
    except Exception as e:
        print(f"  GAGAL -- {e}")

# ── Ringkasan ─────────────────────────────────────────────────
print()
print("=" * 60)
print("  HASIL TEST")
print("=" * 60)

if connected and not missing:
    print(f"""
  iPOS PostgreSQL : TERHUBUNG
  Database        : {DB_NAME}
  Total Produk    : {total_produk:,} item
  Semua Tabel     : LENGKAP

  Lanjut ke langkah berikutnya:
  -> Jalankan: 3_SYNC_SEKARANG.bat
""")
elif connected and missing:
    print(f"""
  iPOS PostgreSQL : TERHUBUNG
  Database        : {DB_NAME}
  Total Produk    : {total_produk:,} item
  Tabel Missing   : {missing}

  PERINGATAN: Ada tabel yang tidak ditemukan.
  Pastikan database iPOS yang benar sudah dipilih.
""")
else:
    print("""
  Ada masalah koneksi. Baca pesan error di atas.
""")

print("=" * 60)
print()
input("Tekan Enter untuk keluar...")
