@echo off
title [LANGKAH 1] Instalasi Sync Agent iPOS
color 0A
cd /d "%~dp0"

echo.
echo  ============================================================
echo    SYNC AGENT iPOS -- INSTALASI OTOMATIS
echo    Langkah 1 dari 4: Install library Python
echo  ============================================================
echo.
echo  Script ini akan:
echo    - Cek apakah Python sudah terinstall
echo    - Install library yang dibutuhkan
echo    - Buat file konfigurasi (.env)
echo    - Buka .env untuk diedit (ganti nama database saja)
echo.
echo  Tekan sembarang tombol untuk mulai...
pause >nul

echo.
echo ──────────────────────────────────────────────────────────────
echo  [1/3] Cek Python...
echo ──────────────────────────────────────────────────────────────

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ============================================================
    echo   PYTHON BELUM TERINSTALL!
    echo.
    echo   Silakan download dan install Python dari:
    echo   https://www.python.org/downloads/
    echo.
    echo   PENTING saat install Python:
    echo   [X] Centang "Add Python to PATH"  ^<-- wajib dicentang!
    echo.
    echo   Setelah install Python, jalankan file ini lagi.
    echo  ============================================================
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo  OK: %PYVER%

echo.
echo ──────────────────────────────────────────────────────────────
echo  [2/3] Install library Python...
echo ──────────────────────────────────────────────────────────────
echo.

pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo  ============================================================
    echo   GAGAL install library!
    echo.
    echo   Kemungkinan penyebab:
    echo   - Tidak ada koneksi internet
    echo   - Perlu dijalankan sebagai Administrator
    echo.
    echo   Coba: klik kanan file ini -> "Run as administrator"
    echo  ============================================================
    echo.
    pause
    exit /b 1
)

echo.
echo  OK: Semua library berhasil diinstall

echo.
echo ──────────────────────────────────────────────────────────────
echo  [3/3] Setup file konfigurasi (.env)...
echo ──────────────────────────────────────────────────────────────
echo.

if exist .env (
    echo  File .env sudah ada. Tidak ditimpa.
    echo.
    echo  ============================================================
    echo   INSTALASI SELESAI!
    echo.
    echo   Lanjut ke: 2_TEST_KONEKSI.bat
    echo  ============================================================
) else (
    copy .env.template .env >nul
    echo  OK: File .env berhasil dibuat dari template

    echo.
    echo  ============================================================
    echo   PENTING: Edit file .env sekarang!
    echo.
    echo   Hanya 1 baris yang perlu diubah:
    echo     IPOS_DB_NAME=i4_NAMATOKO
    echo.
    echo   Ganti "i4_NAMATOKO" dengan nama database iPOS
    echo   di PC ini. Contoh: i4_SAHARAMART
    echo.
    echo   (File .env akan terbuka otomatis di Notepad)
    echo  ============================================================
    echo.
    echo  Membuka .env dalam 3 detik...
    timeout /t 3 /nobreak >nul
    notepad .env

    echo.
    echo  Setelah selesai edit dan simpan file .env,
    echo  lanjut ke: 2_TEST_KONEKSI.bat
)

echo.
pause
