@echo off
setlocal
title La Binch - Installation GrimoireSync
set "PSFILE=%TEMP%\LaBinchInstaller-%RANDOM%.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/quentindumont70-bit/chroniques-cendreval/main/public/binch/Installer-La-Binch.ps1' -OutFile '%PSFILE%' -TimeoutSec 25; & '%PSFILE%'; exit $LASTEXITCODE } catch { Write-Host $_.Exception.Message; exit 1 }"
set "RC=%ERRORLEVEL%"
if exist "%PSFILE%" del /q "%PSFILE%"
if not "%RC%"=="0" (
 echo.
 echo Installation interrompue. Verifie ta connexion et le dossier WoW Forever.
 pause
)
exit /b %RC%
