:; sh "${GROK_PLUGIN_ROOT}/hooks/memory.sh" post-tool; exit $?
@echo off
setlocal EnableDelayedExpansion
if not defined GROK_PLUGIN_DATA exit /b 0
if not defined GROK_SESSION_ID exit /b 0
set GROK_SESSION_ID| "%SystemRoot%\System32\findstr.exe" /r /x /v /c:"GROK_SESSION_ID=[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-][ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-]*" >nul
if errorlevel 1 if not errorlevel 2 if exist "!GROK_PLUGIN_DATA!\!GROK_SESSION_ID!\oriented" exit /b 0
endlocal
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0memory.ps1" -Action post-tool
exit /b %ERRORLEVEL%
