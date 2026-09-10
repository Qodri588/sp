@echo off
setlocal

cd /d "%~dp0"

where bun >nul 2>&1
if errorlevel 1 (
  echo Bun tidak ditemukan di PATH.
  echo Install Bun terlebih dahulu dari https://bun.sh/
  pause
  exit /b 1
)

echo Menjalankan web app di http://localhost:5173 ...
call bun run web:dev

if errorlevel 1 (
  echo.
  echo Web app berhenti karena terjadi error.
  pause
)

endlocal
