@echo off
setlocal

:: Get version from package.json
for /f "tokens=2 delims=:," %%a in ('findstr /c:"\"version\":" package.json') do (
    set VERSION=%%~a
)
set VERSION=%VERSION: =%

echo --- Cleaning old build artifacts ---
if exist dist (
    rd /s /q dist
)

echo --- Installing dependencies ---
call npm.cmd install --silent

echo --- Starting Build for version %VERSION% ---
call npm.cmd run build

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo --- Packaging Extension ---
powershell.exe -NoProfile -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'ask-gemini-v%VERSION%.zip' -Force"

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Packaging failed!
    pause
    exit /b %ERRORLEVEL%
)

echo --- Cleaning up node_modules and lockfile ---
if exist node_modules (
    rd /s /q node_modules
)
if exist package-lock.json (
    del /f /q package-lock.json
)

echo --- Done! Final package: ask-gemini-v%VERSION%.zip ---
echo Closing in 5 seconds...
timeout /t 5 /nobreak
exit
