@echo off
title [LANGKAH 4] Setup Auto-Sync Otomatis
color 0A
cd /d "%~dp0"

echo.
echo  ============================================================
echo    SYNC AGENT iPOS -- SETUP AUTO-SYNC
echo    Langkah 4 dari 4: Sync berjalan otomatis saat PC nyala
echo  ============================================================
echo.
echo  Script ini akan mendaftarkan sync agent ke Windows Task
echo  Scheduler sehingga sync berjalan otomatis di background
echo  setiap kali PC kasir dinyalakan (tidak ada jendela CMD).
echo.
echo  *** FILE INI HARUS DIJALANKAN SEBAGAI ADMINISTRATOR ***
echo      Klik kanan -> "Run as administrator"
echo.

:: Cek Administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ============================================================
    echo   ERROR: Harus dijalankan sebagai Administrator!
    echo.
    echo   Caranya:
    echo   1. Tutup jendela ini
    echo   2. Klik KANAN file 4_AUTOSTART_SETUP.bat
    echo   3. Pilih "Run as administrator"
    echo  ============================================================
    echo.
    pause
    exit /b 1
)

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

:: Ambil nama toko dari .env untuk nama task
for /f "tokens=2 delims==" %%a in ('findstr "IPOS_DB_NAME" .env') do set DB_NAME=%%a
set TASK_NAME=iPOS_SyncAgent_%DB_NAME%

set SCRIPT_DIR=%~dp0
set VBS_PATH=%SCRIPT_DIR%run_silent.vbs

echo  Nama Task  : %TASK_NAME%
echo  Folder     : %SCRIPT_DIR%
echo.

echo  [1/3] Hapus task lama jika ada...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
echo  OK

echo.
echo  [2/3] Daftarkan task baru (auto-start saat login)...
schtasks /create /tn "%TASK_NAME%" /tr "wscript.exe \"%VBS_PATH%\"" /sc ONLOGON /rl HIGHEST /f

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ============================================================
    echo   GAGAL mendaftarkan task otomatis.
    echo.
    echo   Cara manual:
    echo   1. Tekan Win+R, ketik: taskschd.msc, Enter
    echo   2. Klik "Create Basic Task"
    echo   3. Name: %TASK_NAME%
    echo   4. Trigger: When I log on
    echo   5. Action: Start a program
    echo   6. Program: wscript.exe
    echo   7. Arguments: "%VBS_PATH%"
    echo   8. Klik Finish
    echo  ============================================================
    echo.
    pause
    exit /b 1
)

echo.
echo  [3/3] Jalankan sekarang (tidak perlu restart)...
schtasks /run /tn "%TASK_NAME%"

echo.
echo  ============================================================
echo   BERHASIL! Auto-sync sudah aktif.
echo.
echo   Sync agent sekarang berjalan di background.
echo   Data akan otomatis tersync setiap 15 menit.
echo.
echo   Untuk cek status sync:
echo   - Buka file: sync_agent.log
echo   - Atau lihat halaman "Sync Monitor" di aplikasi
echo.
echo   Untuk hentikan sync sementara:
echo   - Task Manager > Tab Services > cari wscript
echo   - Atau hapus task: %TASK_NAME%
echo  ============================================================
echo.
pause
