@echo off
TITLE Tanryugram APK Builder (com.tanryugram)
COLOR 0A
echo ========================================================
echo   Tanryugram Android APK Builder (com.tanryugram)
echo ========================================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Checking Node.js and NPM...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH. Please install Node.js from nodejs.org and rerun this script.
    pause
    exit /b %errorlevel%
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b %errorlevel%
)

echo.
echo Logging in to EAS (Expo)... If a browser opens, please log in.
call npx eas-cli login

echo.
echo Building Android APK for com.tanryugram (Bypassing Git VCS)...
set EAS_NO_VCS=1
call npx eas-cli build --platform android --profile production --non-interactive

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [ERROR] Build failed. Please check the error above.
    echo ========================================================
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo Build complete! Check above for your download link.
echo ========================================================
pause
