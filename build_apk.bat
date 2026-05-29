@echo off
echo =======================================================
echo    ROADSOS - Cloud APK Builder (No Android SDK Needed)
echo =======================================================
echo.
echo This script will use Expo Application Services (EAS) to build
echo your Android app in the cloud and give you a link to download
echo the .apk file directly to your phone.
echo.
cd apps\mobile

echo Installing EAS CLI if not present...
call npm install -g eas-cli

echo.
echo Starting Android Build...
call npx eas build -p android --profile preview

echo.
pause
