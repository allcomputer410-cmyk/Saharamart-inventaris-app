@echo off
title [LANGKAH 3] Setup Auto-Start
color 0A
cd /d "%~dp0"

echo.
echo  ============================================================
echo    SYNC AGENT iPOS - SAHARAMART
echo    Langkah 3: Aktifkan auto-start saat PC menyala
echo  ============================================================
echo.
echo  *** FILE INI HARUS DIJALANKAN SEBAGAI ADMINISTRATOR ***
echo      Klik kanan file ini - "Run as administrator"
echo.

:: Cek Administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ============================================================
    echo   ERROR: Harus dijalankan sebagai Administrator!
    echo.
    echo   Caranya:
    echo   1. Tutup jendela ini
    echo   2. Klik KANAN file 3_AUTOSTART.bat
    echo   3. Pilih "Run as administrator"
    echo  ============================================================
    echo.
    pause
    exit /b 1
)

set SCRIPT_DIR=%~dp0
set VBS_PATH=%SCRIPT_DIR%run_silent.vbs
set TASK_NAME=iPOS_SyncAgent_Saharamart

echo  [1/3] Hapus task lama jika ada...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
echo  OK

echo  [2/3] Daftarkan task auto-start...
schtasks /create /tn "%TASK_NAME%" /tr "wscript.exe \"%VBS_PATH%\"" /sc ONLOGON /rl HIGHEST /f

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ============================================================
    echo   GAGAL mendaftarkan task otomatis.
    echo.
    echo   Cara manual (alternatif):
    echo   1. Tekan Win+R, ketik: shell:startup, Enter
    echo   2. Copy shortcut 2_JALANKAN.bat ke folder yang terbuka
    echo  ============================================================
    pause
    exit /b 1
)

echo  [3/3] Jalankan sekarang...
schtasks /run /tn "%TASK_NAME%"

echo.
echo  ============================================================
echo   BERHASIL! Auto-start sudah aktif.
echo.
echo   Sync Agent akan otomatis berjalan setiap PC dinyalakan.
echo   Icon muncul di pojok kanan bawah (system tray).
echo.
echo   Data sync setiap 15 menit ke Supabase cloud.
echo  ============================================================
echo.
pause
