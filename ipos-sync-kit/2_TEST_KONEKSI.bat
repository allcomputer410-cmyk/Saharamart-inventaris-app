@echo off
title [LANGKAH 2] Test Koneksi iPOS
color 0A
cd /d "%~dp0"

echo.
echo  ============================================================
echo    SYNC AGENT iPOS -- TEST KONEKSI
echo    Langkah 2 dari 4: Cek koneksi ke database iPOS
echo  ============================================================
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

python test_koneksi.py

echo.
pause
