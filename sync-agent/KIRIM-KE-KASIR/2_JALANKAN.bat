@echo off
cd /d "%~dp0"

:: Cek apakah sudah berjalan
tasklist 2>nul | find /i "pythonw.exe" >nul
if %errorlevel% == 0 (
    echo.
    echo  Sync Agent sudah berjalan di background.
    echo  Lihat icon di system tray (pojok kanan bawah layar).
    echo.
    timeout /t 3 /nobreak >nul
    exit /b 0
)

:: Jalankan tanpa jendela CMD
start "" /B pythonw sync_tray.py

:: Fallback: pakai VBS jika pythonw tidak tersedia
if %errorlevel% neq 0 (
    wscript.exe run_silent.vbs
)
