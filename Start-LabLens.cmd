@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.18 or newer is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Build output is missing. Run npm ci and npm run build first.
  pause
  exit /b 1
)
echo Open the local URL printed below in your browser.
echo Keep this window open while using LabLens. Press Ctrl+C to stop.
node --env-file-if-exists=.env server.mjs
if errorlevel 1 pause
