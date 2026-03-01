"""
jalankan_semua.py
=================
Script satu klik yang menjalankan sync lengkap:
  1. Sync produk + kategori + merek + supplier
  2. Sync stok semua produk
  3. Sync penjualan (7 hari terakhir)
  4. Sync pembelian masuk (90 hari terakhir)
  5. Verifikasi data (bandingkan iPOS vs Supabase)

Cara pakai:
  python jalankan_semua.py
  atau double-click: 3_SYNC_SEKARANG.bat

Estimasi waktu: 3-10 menit tergantung jumlah produk & kecepatan internet.
"""

import subprocess
import sys
import time
from datetime import datetime

PYTHON = sys.executable


def run(label: str, args: list) -> bool:
    """Jalankan perintah, tampilkan output langsung, return True jika sukses."""
    print()
    print("─" * 60)
    print(f"  >>  {label}")
    print("─" * 60)
    start = time.time()

    result = subprocess.run([PYTHON] + args)

    elapsed = time.time() - start
    if result.returncode == 0:
        print(f"  Selesai dalam {elapsed:.0f} detik")
        return True
    else:
        print(f"  GAGAL (kode error: {result.returncode})")
        return False


def main():
    print()
    print("=" * 60)
    print("   SYNC PENUH iPOS ke SUPABASE")
    print(f"   Dimulai: {datetime.now().strftime('%d %b %Y %H:%M:%S')}")
    print("=" * 60)
    print()
    print("  Yang akan dijalankan:")
    print("    [1] Sync produk, supplier, kategori, merek")
    print("    [2] Sync stok semua produk")
    print("    [3] Sync penjualan 7 hari terakhir")
    print("    [4] Sync pembelian masuk 90 hari terakhir")
    print("    [5] Verifikasi & laporan perbandingan")
    print()

    results = {}

    # ── [1] Sync produk + supplier + kategori + merek ─────────────
    results["Produk & Supplier"] = run(
        "[1/5] Sync Produk, Supplier, Kategori, Merek",
        ["sync_agent.py", "--type", "products"]
    )

    # ── [2] Sync stok ─────────────────────────────────────────────
    results["Stok"] = run(
        "[2/5] Sync Stok",
        ["sync_agent.py", "--type", "stock"]
    )

    # ── [3] Sync penjualan ────────────────────────────────────────
    results["Penjualan"] = run(
        "[3/5] Sync Penjualan (7 hari terakhir)",
        ["sync_agent.py", "--type", "sales"]
    )

    # ── [4] Sync pembelian masuk ──────────────────────────────────
    results["Pembelian"] = run(
        "[4/5] Sync Pembelian Masuk (90 hari terakhir)",
        ["sync_agent.py", "--type", "purchases"]
    )

    # ── [5] Verifikasi ────────────────────────────────────────────
    print()
    print("─" * 60)
    print("  >>  [5/5] Verifikasi Data iPOS vs Supabase")
    print("─" * 60)
    subprocess.run([PYTHON, "verify.py"])

    # ── Laporan akhir ─────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"   SELESAI — {datetime.now().strftime('%d %b %Y %H:%M:%S')}")
    print()

    all_ok = all(results.values())
    for step, ok in results.items():
        status = "OK   " if ok else "GAGAL"
        print(f"   [{status}]  {step}")

    print()
    if all_ok:
        print("   Semua sync berhasil!")
        print("   Buka aplikasi inventaris dan refresh halaman.")
    else:
        print("   Ada yang gagal. Lihat file sync_agent.log untuk detail.")
        print("   Atau jalankan ulang: 3_SYNC_SEKARANG.bat")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
