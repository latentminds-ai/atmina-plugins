:; sh "${GROK_PLUGIN_ROOT}/hooks/memory.sh" cleanup; exit $?
@echo off
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0memory.ps1" -Action cleanup
exit /b %ERRORLEVEL%
