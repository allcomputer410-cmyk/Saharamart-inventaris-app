@echo off
title [LANGKAH 3] Sync iPOS ke Supabase
color 0A
cd /d "%~dp0"

echo.
echo  ============================================================
echo    SYNC AGENT iPOS -- SYNC PENUH
echo    Langkah 3 dari 4: Kirim semua data iPOS ke Supabase
echo  ============================================================
echo.
echo  Yang akan disync:
echo    [1] Produk, Kategori, Merek, Supplier
echo    [2] Stok semua produk
echo    [3] Penjualan 7 hari terakhir
echo    [4] Pembelian masuk 90 hari terakhir
echo    [5] Verifikasi data (bandingkan iPOS vs Supabase)
echo.
echo  Estimasi waktu: 3-10 menit (tergantung jumlah produk)
echo.

:: Cek .env sudah ada
if not exist .env (
    echo  ============================================================
    echo   FILE .env BELUM ADA!
    echo   Jalankan dulu: 1_INSTALL.bat
    echo  ============================================================
    echo.
    pause
    exit /b 1
)

echo  Tekan sembarang tombol untuk mulai sync...
pause >nul
echo.

python jalankan_semua.py

echo.
echo  ============================================================
echo   Sync selesai! Buka aplikasi inventaris dan refresh halaman.
echo   Jika ada error, lihat file: sync_agent.log
echo  ============================================================
echo.
pause
